"""Bible Onyou local work queue. Python 3.9+; no model SDK or API keys."""
import argparse
import contextlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from pathlib import Path

import jobs
import providers

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DEFAULT = Path(os.environ.get('LOCALAPPDATA', Path.home()/'.local/state'))/'BibleOnyou'
SERVICES = ('local','claude','antigravity')


@contextlib.contextmanager
def exclusive(path):
    file = path.open('a+b')
    try:
        file.seek(0)
        if os.name == 'nt':
            import msvcrt
            if file.read(1) == b'':
                file.write(b'0')
                file.flush()
            file.seek(0)
            msvcrt.locking(file.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (OSError, BlockingIOError):
        file.close()
        yield None
        return
    try:
        yield file
    finally:
        file.close()


class Store:
    def __init__(self, folder):
        self.folder = folder.resolve()
        self.folder.mkdir(parents=True, exist_ok=True)
        self.path = self.folder / 'queue.sqlite3'
        with self.db() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY, phase TEXT NOT NULL DEFAULT 'todo',
                    owner TEXT DEFAULT '', failures INTEGER DEFAULT 0, note TEXT DEFAULT '', due REAL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS services(name TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0,
                    due REAL DEFAULT 0, count INTEGER DEFAULT 0, note TEXT DEFAULT '');
                CREATE TABLE IF NOT EXISTS events(n INTEGER PRIMARY KEY, ts INTEGER, card TEXT, service TEXT,
                    kind TEXT, note TEXT);
                CREATE TABLE IF NOT EXISTS backlog(id TEXT PRIMARY KEY, spec TEXT NOT NULL);
            """)
            db.executemany('INSERT OR IGNORE INTO services(name) VALUES (?)', [(s,) for s in SERVICES])

    @contextlib.contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=30)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def event(self, db, card, service, kind, note=''):
        db.execute('INSERT INTO events(ts,card,service,kind,note) VALUES (?,?,?,?,?)',
                   (int(time.time()),card,service,kind,note[:3000]))

    def log(self, kind, msg, task, service):
        with self.db() as db:
            self.event(db,task,service,kind,msg)

    def change(self, card, service, phase, note=''):
        with self.db() as db:
            db.execute('UPDATE cards SET phase=?,owner=?,note=? WHERE id=?',(phase,service,note,card))
            self.event(db,card,service,phase,note)

    def register(self, cards):
        with self.db() as db:
            db.executemany('INSERT OR IGNORE INTO cards(id) VALUES (?)',[(c['id'],) for c in cards])
            db.executemany('INSERT OR IGNORE INTO backlog(id,spec) VALUES (?,?)',
                           [(c['id'],json.dumps(c,ensure_ascii=False)) for c in cards])

    def backlog(self):
        with self.db() as db:
            return [json.loads(r['spec']) for r in db.execute('SELECT spec FROM backlog ORDER BY rowid')]

    def snapshot(self):
        with self.db() as db:
            return ({r['id']:dict(r) for r in db.execute('SELECT * FROM cards')},
                    {r['name']:dict(r) for r in db.execute('SELECT * FROM services')})

    def dump_log(self):
        with self.db() as db:
            last=db.execute('SELECT MAX(n) FROM events').fetchone()[0]
            if getattr(self,'last_export',-1)==last and (self.folder/'events.jsonl').exists():
                return
            rows = list(db.execute('SELECT * FROM events ORDER BY n'))
        tmp = self.folder/'events.jsonl.tmp'
        with tmp.open('w',encoding='utf-8') as stream:
            for row in rows:
                stream.write(json.dumps(dict(row),ensure_ascii=False)+'\n')
        os.replace(tmp,self.folder/'events.jsonl')
        self.last_export=last


def catalogue(source=None, extension=None):
    cards = json.loads(source if source is not None else (HERE/'cards.json').read_text(encoding='utf-8'))
    if source is None:
        extension = (HERE/'cards-dot.json').read_text(encoding='utf-8')
    if extension is not None:
        cards.extend(json.loads(extension))
    ids = set()
    for c in cards:
        if not re.fullmatch(r'[a-z0-9-]+',c['id']) or c['id'] in ids:
            raise ValueError('중복되거나 유효하지 않은 작업 ID')
        if not set(c.get('after',[])) <= ids or not c['services'] or not set(c['services']) <= set(SERVICES):
            raise ValueError('카드 순서 또는 담당 확인 필요')
        if c['job'] not in ('index','bundle','pdf','journey','proof','content','masks','routes','entry','pacing') or not re.fullmatch(r'[\w/-]+',c['branch']):
            raise ValueError('지원하지 않는 카드')
        ids.add(c['id'])
    return cards


def refresh_backlog(store):
    # Fetch only data from the team's branch. Job handlers and acceptance checks belong to this installation.
    ref = 'refs/remotes/origin/antigravity/david-week'
    try:
        git(ROOT,'fetch','--no-write-fetch-head','origin','refs/heads/antigravity/david-week:'+ref)
        registry = git(ROOT,'show',ref+':tools/onyou_queue/cards.json')
        store.register(catalogue(registry))
        extension = git(ROOT,'show',ref+':tools/onyou_queue/cards-dot.json')
        store.register(catalogue(registry,extension))
    except (OSError,ValueError,TypeError, KeyError, subprocess.TimeoutExpired) as exc:
        store.log('catalogue-wait','저장된 목록으로 진행 · '+str(exc)[-240:],'','local')


def git(cwd,*args):
    return jobs.run(['git','-c','credential.interactive=never',*args],cwd,timeout=180).strip()


def checkout(card, out, update=True):
    work = out/'work'
    # Only fetch the designated branch. Each card keeps its working tree through handoffs and restarts.
    branch = card['branch']
    try:
        if (work/'.git').is_file():
            base_file = out/'base.txt'
            if not base_file.exists():
                # Recover a stop between creating the checkout and recording its base.
                history = git(work,'reflog','--format=%H','HEAD').splitlines()
                base_file.write_text(history[-1] if history else git(work,'rev-parse','HEAD'),encoding='ascii')
            # Another session may have delivered a result since a quota stop. Update only an untouched checkout.
            if not update or git(work,'status','--porcelain') or git(work,'rev-parse','HEAD') != (out/'base.txt').read_text().strip():
                return work
        git(ROOT,'fetch','--no-write-fetch-head','origin',f'refs/heads/{branch}:refs/remotes/origin/{branch}')
        revision = 'refs/remotes/origin/'+branch
        for dep in card.get('after',[]):
            artifact = out.parent/dep/'verified-ref.txt'
            if artifact.is_file():
                dependency_branch, dependency_ref = artifact.read_text().strip().splitlines()
                if dependency_branch == branch and git(ROOT,'merge-base',revision,dependency_ref) != git(ROOT,'rev-parse',dependency_ref):
                    revision = dependency_ref
        if not (work/'.git').is_file():
            git(ROOT,'worktree','add','--detach',str(work),revision)
        else:
            git(work,'merge','--ff-only',revision)
        (out/'base.txt').write_text(git(work,'rev-parse','HEAD'),encoding='ascii')
    except (ValueError, subprocess.TimeoutExpired) as exc:
        raise providers.Waiting('작업 폴더 준비 실패: '+str(exc)[-400:],60,'transient') from exc
    return work


def preserve_result(card, out, work):
    if card['job'] not in ('pdf','journey','content','routes'):
        return
    base=(out/'base.txt').read_text().strip()
    changed=git(work,'-c','core.quotepath=false','diff','--name-only',base).splitlines()
    changed+=git(work,'-c','core.quotepath=false','ls-files','--others','--exclude-standard').splitlines()
    if card['job']=='routes':
        ok=lambda name: name=='docs/창세기/연속/C29_재검증.md'
    elif card['job'] in ('pdf','content'):
        ok=lambda name: name in ('docs/창세기/연속/C29.md','docs/창세기/연속/C29.pdf','docs/창세기/연속/C29_판.pdf','docs/창세기/연속/C29_답지.pdf','docs/창세기/연속/C29_인쇄.json') or bool(re.fullmatch(r'docs/인계/사진/C29_[^/]+\.png',name))
    else:
        ok=lambda name: name.startswith(('web/david/','docs/인계/사진/다윗/')) or name in ('tools/build-david.js','docs/인계/다윗_Antigravity.md')
    wrong=[p for p in changed if not ok(p)]
    if wrong:
        raise ValueError('카드 범위 밖 변경: '+', '.join(wrong))
    if changed:
        git(work,'add','-A','--',*set(changed))
    if git(work,'diff','--cached','--name-only'):
        git(work,'-c','user.name=Bible Onyou Queue','-c','user.email=queue@localhost','commit','-m',card['title'])
    tip=git(work,'rev-parse','HEAD')
    ref='refs/heads/onyou-queue/'+card['id']
    old=git(work,'for-each-ref','--format=%(objectname)',ref)
    if old and git(work,'merge-base',old,tip)!=old:
        raise ValueError('기존 결과 브랜치와 갈라져 검토 필요')
    git(work,'update-ref',ref,tip,old or '0'*len(tip))
    (out/'verified-ref.txt').write_text(card['branch']+'\n'+ref+'\n',encoding='utf-8')


def checkpoint(out, work, card, service, note):
    revision = git(work,'rev-parse','HEAD')
    files = git(work,'-c','core.quotepath=false','status','--short')
    tmp = out/'handoff.tmp'
    tmp.write_text(f"{card['title']}\n{card.get('prompt','')}\n\n{service} · {note}\n{revision}\n{files}\n",encoding='utf-8')
    os.replace(tmp,out/'handoff.txt')


def apply(store, card, service):
    ident,job = card['id'],card['job']
    out = store.folder/'tasks'/ident
    out.mkdir(parents=True,exist_ok=True)
    work = None
    cards,services = store.snapshot()
    prev = cards[ident]
    try:
        work = checkout(card,out,update=prev['phase'] not in ('run','verify'))
        if prev['phase'] == 'verify':
            jobs.finish_layout(job,work)
            result = jobs.verify(job,work,out)
        else:
            if service != 'local':
                # A previous run, another service, or the branch owner may already have supplied the deliverable.
                try:
                    jobs.finish_layout(job,work)
                    result = jobs.verify(job,work,out)
                except (ValueError, OSError, ImportError, RuntimeError, subprocess.TimeoutExpired):
                    result = None
                if result is None:
                    # An external reviewer already owns this card; poll the branch while that session is active.
                    if job == 'content':
                        handoff=(work/'docs/인계/창세기_Claude.md').read_text(encoding='utf-8').splitlines()[0]
                        last=int(git(work,'log','-1','--format=%ct','--','docs/창세기/연속/C29.md','docs/인계/창세기_Claude.md'))
                        if '별도 검증 진행 중' in handoff and 0 <= time.time()-last < 2400:
                            with store.db() as db:
                                db.execute("UPDATE cards SET phase='todo',due=?,note=? WHERE id=?",
                                           (time.time()+120,'외부 C29 검증 진행 중',ident))
                                store.event(db,ident,service,'await-review','담당 브랜치의 검증 결과를 2분 뒤 확인')
                            return
                    enabled = [s for s,row in services.items() if row['enabled']]
                    args,env = providers.command(service,enabled,work)
                    history = (out/'handoff.txt').read_text(encoding='utf-8')[-3000:] if (out/'handoff.txt').exists() else ''
                    prompt = card['prompt']+'\n기존 변경을 보존하고 이 작업 폴더에서만 작업하세요. 결제·API 연결·푸시·배포는 하지 마세요.\n인계 기록:\n'+history
                    store.change(ident,service,'run',card['title'])
                    proc = subprocess.run(args+[prompt],cwd=work,env=env,stdin=subprocess.DEVNULL,
                                          capture_output=True,timeout=3600,encoding='utf-8',errors='replace')
                    providers.interpret(proc.returncode,proc.stdout,proc.stderr,services[service]['count']+1)
                else:
                    store.log('existing','이미 올라온 결과물 검증 · '+git(work,'rev-parse','--short','HEAD'),ident,'local')
            else:
                store.change(ident,service,'run',card['title'])
                jobs.execute(job,work,out)
            store.change(ident,service,'verify','독립 검사 시작')
            jobs.finish_layout(job,work)
            result = jobs.verify(job,work,out)
        preserve_result(card,out,work)
        checkpoint(out,work,card,service,result)
        with store.db() as db:
            db.execute("UPDATE cards SET phase='done',owner=?,note=?,due=0 WHERE id=?",(service,result,ident))
            db.execute("UPDATE services SET due=0,count=0,note='' WHERE name=?",(service,))
            store.event(db,ident,service,'done',result)
    except (providers.Waiting, subprocess.TimeoutExpired) as exc:
        if not isinstance(exc,providers.Waiting):
            exc = providers.Waiting('작업 시간 초과, 이어하기 대기',120,'transient')
        if work:
            checkpoint(out,work,card,service,str(exc))
        with store.db() as db:
            db.execute('UPDATE services SET due=?,count=count+1,note=? WHERE name=?',(time.time()+exc.delay,str(exc),service))
            # Never erase a saved verification boundary after an interrupted test.
            db.execute("UPDATE cards SET phase=CASE WHEN phase='verify' THEN 'verify' ELSE 'todo' END, note=? WHERE id=?",(str(exc),ident))
            store.event(db,ident,service,exc.kind,str(exc))
    except (OSError,ValueError,ImportError,RuntimeError) as exc:
        msg = str(exc)[-1600:]
        if work:
            checkpoint(out,work,card,service,msg)
        count = prev['failures']+1
        phase = 'blocked' if count >= 3 else 'todo'
        with store.db() as db:
            db.execute('UPDATE cards SET phase=?,failures=?,owner=?,note=?,due=? WHERE id=?',
                       (phase,count,service,msg,time.time()+min(900,15*2**count),ident))
            store.event(db,ident,service,'failed',msg)


def select(cards, states, services, busy, now):
    available = set(SERVICES)-set(busy.values())
    chosen = []
    # Allocate all primaries first, even when an earlier card could use their service as a fallback.
    for card in sorted(cards, key=lambda c: services[c['services'][0]]['due'] > now):
        ident = card['id']
        state = states[ident]
        if ident in busy or state['phase'] in ('done','blocked') or state['due'] > now:
            continue
        if any(states[dep]['phase'] != 'done' for dep in card.get('after',[])):
            continue
        # Reserve a healthy primary for its own card before assigning any handoff.
        primary = card['services'][0]
        choices = [primary] if services[primary]['due'] <= now else card['services'][1:]
        for svc in choices:
            if svc in available and services[svc]['due'] <= now:
                chosen.append((card,svc))
                available.remove(svc)
                break
    return chosen


def guarded(store, card, service):
    with exclusive(store.folder/(card['id']+'.lock')) as card_lock:
        if not card_lock:
            return
        with exclusive(store.folder/(service+'.lock')) as service_lock:
            if not service_lock:
                return
            states,services = store.snapshot()
            if states[card['id']]['phase'] in ('done','blocked') or services[service]['due'] > time.time():
                return
            store.log('start',card['title'],card['id'],service)
            apply(store,card,service)


def launch(store, card, service):
    # A coordinator restart leaves an in-flight worker holding both locks until its checkpoint is saved.
    args=[sys.executable,str(HERE/'runner.py'),'worker',card['id'],'--service',service,'--state',str(store.folder)]
    subprocess.run(args,check=True)


def dispatch(store, once):
    with exclusive(store.folder/'runner.lock') as lock:
        if not lock:
            print('자동 실행기가 이미 실행 중입니다.')
            return
        with ThreadPoolExecutor(max_workers=3) as pool:
            active = {}
            refresh_at = 0
            while True:
                if time.monotonic() >= refresh_at:
                    refresh_backlog(store)
                    refresh_at = time.monotonic()+600
                cards = store.backlog()
                states,services = store.snapshot()
                busy = {i:s for _,(i,s) in active.items()}
                for card in cards:
                    if card['id'] not in busy:
                        with exclusive(store.folder/(card['id']+'.lock')) as probe:
                            if not probe:
                                busy[card['id']] = states[card['id']]['owner']
                for name in SERVICES:
                    with exclusive(store.folder/(name+'.lock')) as probe:
                        if not probe:
                            busy['lock-'+name] = name
                for card,svc in select(cards,states,services,busy,time.time()):
                    future = pool.submit(launch,store,card,svc)
                    active[future] = (card['id'],svc)
                store.dump_log()
                if active:
                    finished,_ = wait(active,timeout=5,return_when=FIRST_COMPLETED)
                    for f in finished:
                        ident,svc=active.pop(f)
                        try:
                            f.result()
                        except (OSError,subprocess.CalledProcessError) as exc:
                            with store.db() as db:
                                db.execute("UPDATE cards SET due=?,failures=failures+1,phase=CASE WHEN failures>=2 THEN 'blocked' ELSE phase END WHERE id=? AND phase!='done'",
                                           (time.time()+60,ident))
                                store.event(db,ident,svc,'worker-exit',str(exc)[:500])
                elif once:
                    return
                else:
                    time.sleep(10)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('action',choices=['once','watch','status','enable','disable','retry','worker'])
    parser.add_argument('target',nargs='?')
    parser.add_argument('--service',choices=SERVICES)
    parser.add_argument('--state',type=Path,default=DEFAULT)
    parser.add_argument('--confirmed-no-overages',action='store_true')
    args=parser.parse_args()
    st=Store(args.state)
    st.register(catalogue())
    if args.action=='worker':
        card=next((c for c in st.backlog() if c['id']==args.target), None)
        if not card or args.service not in card['services']:
            parser.error('작업 ID와 배정 서비스를 확인하세요')
        guarded(st,card,args.service)
    elif args.action in ('watch','once'):
        dispatch(st,args.action=='once')
    elif args.action=='status':
        cards,services=st.snapshot()
        print(st.folder)
        for r in cards.values():
            print(r['id'],r['phase'],r['owner'],r['note'])
        for r in services.values():
            until=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(r['due'])) if r['due']>time.time() else '-'
            print(r['name'],'재시도',until,r['note'])
    elif args.action=='retry':
        with st.db() as db:
            row=db.execute("UPDATE cards SET phase='todo',failures=0,due=0 WHERE id=? AND phase='blocked'",(args.target,))
            if not row.rowcount:
                parser.error('blocked 상태의 작업 ID가 필요합니다')
    else:
        if args.target not in SERVICES[1:] or (args.action=='enable' and not args.confirmed_no_overages):
            parser.error('개인 구독 로그인과 서비스의 초과 과금 해제를 확인한 뒤 enable 서비스 --confirmed-no-overages')
        if args.action=='enable' and args.target=='antigravity':
            try:
                providers.configure_personal_antigravity()
            except providers.Waiting as exc:
                parser.error(str(exc))
        with st.db() as db:
            db.execute('UPDATE services SET enabled=?,due=0,count=0,note=? WHERE name=?',
                       (args.action=='enable','',args.target))
        print(args.target,args.action)

if __name__=='__main__':
    main()
