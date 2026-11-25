"""Local work and independent acceptance checks for the assigned cards."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

TOOLS = Path(__file__).resolve().parent


def run(args, cwd, timeout=300):
    result = subprocess.run(args, cwd=cwd, capture_output=True, encoding='utf-8',
                            errors='replace', timeout=timeout, check=False)
    if result.returncode:
        raise ValueError((result.stderr or result.stdout)[-2000:] or f'exit {result.returncode}')
    return result.stdout


def finish_layout(job, cwd):
    if job in ('pdf','content'):
        folder = cwd/'docs/창세기/연속'
        if (folder/'C29_인쇄.json').is_file():
            from print_cards import render
            try:
                render(folder)
            except (KeyError, TypeError) as exc:
                raise ValueError('C29 인쇄 자료 형식을 확인하세요') from exc


def scan(cwd):
    folder = cwd / 'docs/창세기/감수'
    index = (folder / '본편_감수항목_회별.md').read_text(encoding='utf-8')
    sections = re.split(r'^## (E\d{2}) · [^\n]+$', index, flags=re.M)
    expected = [f'E{i:02}' for i in range(1, 67)]
    if sections[1::2] != expected:
        raise ValueError('회차 누락, 중복 또는 순서 불일치')
    links = {}
    for episode, body in zip(sections[1::2], sections[2::2]):
        target = re.findall(r'^- 원고: \[.*?\]\(([^)]+)\)', body, re.M)
        actual = cwd / 'docs/창세기/본편' / (episode + '.md')
        if len(target) != 1 or (folder / target[0]).resolve() != actual.resolve():
            raise ValueError(f'{episode} 원고 링크 불일치')
        source = actual.read_bytes()
        if episode not in source.decode('utf-8').splitlines()[0]:
            raise ValueError(f'{episode} 원고 머리말 불일치')
        links[episode] = hashlib.sha256(source).hexdigest()
    return links


def execute(job, cwd, out):
    if job == 'index':
        (out / '66-links.json').write_text(json.dumps(scan(cwd), indent=2), encoding='utf-8')
    elif job == 'bundle':
        run(['node', 'tools/build-david.js'], cwd)
    elif job == 'proof':
        import fitz
        for label,file in pdf_files(cwd):
            with fitz.open(file) as doc:
                for number,page in enumerate(doc,1):
                    page.get_pixmap(matrix=fitz.Matrix(1,1)).save(out/f'{label}-{number}.png')
    else:
        raise ValueError('unknown local card')


def pdf_files(cwd):
    folder=cwd/'docs/창세기/연속'
    child=folder/'C29_판.pdf'
    return [('child',child if child.is_file() else folder/'C29.pdf'),('leader',folder/'C29_답지.pdf')]


def verify(job, cwd, out):
    if job == 'content':
        verify('pdf',cwd,out)
        doc=(cwd/'docs/창세기/연속/C29.md').read_text(encoding='utf-8')
        section=doc.partition('## 별도 내용 검증')[2].split('\n## ',1)[0]
        if len(section.strip())<70 or not re.search('대조|필수|지적|반영',section) or '검증 뒤에 채운다' in section:
            raise ValueError('C29 별도 검증 결과와 근거 대기')
        return '별도 내용 검증 기록 수신 및 수정본 PDF 기술 검사 통과'
    if job == 'index':
        rows = json.loads((out / '66-links.json').read_text(encoding='utf-8'))
        if len(rows) != 66 or rows != scan(cwd):
            raise ValueError('색인 결과 검증 실패')
        return '66/66 회차·원고 링크와 파일 해시 일치'
    if job == 'pdf':
        # Local PDF rendering and text extraction use the free PyMuPDF package.
        import fitz
        base = cwd / 'docs/창세기/연속'
        md = (base / 'C29.md').read_text(encoding='utf-8')
        for episode in ('E59', 'E60'):
            if episode not in md:
                raise ValueError(f'C29 원고에서 {episode} 누락')
        texts = []
        for label,file in pdf_files(cwd):
            name=file.name
            with fitz.open(file) as doc:
                if not doc.page_count:
                    raise ValueError('빈 PDF')
                text = '\n'.join(page.get_text() for page in doc)
                if len(re.findall('[가-힣]', text)) < 15:
                    raise ValueError(f'{name} 회차 또는 한글 본문 누락')
                for page in doc:
                    pix = page.get_pixmap(matrix=fitz.Matrix(.5, .5))
                    if not pix.width or min(pix.samples) > 240:
                        raise ValueError(f'{name} 빈 페이지')
                texts.append(text)
        if texts[0].strip() == texts[1].strip() or not re.search('정답|해답|답지|진행자', texts[1]):
            raise ValueError('진행자 답지를 확인하세요')
        child, leader = (re.sub(r'\s+','',t) for t in texts)
        if re.search(r'(?:정답|해답)[:：]', child):
            raise ValueError('아이 면에 답 표시가 있습니다')
        for ep in ('E59','E60'):
            manuscript=(cwd/'docs/창세기/본편'/(ep+'.md')).read_text(encoding='utf-8')
            options=re.findall(r'^  - \*\*(.+?)\*\* → 칸 (\d+)',manuscript,re.M)
            if len(options)!=2 or not all(re.sub(r'\s+','',s) in child for s,_ in options):
                raise ValueError(f'{ep} 원고의 보기 두 개를 확인하세요')
            if not any(re.sub(r'\s+','',s) in leader for s,to in options if to=='4'):
                raise ValueError(f'{ep} 진행자 답과 원고 불일치')
        if not re.search(r'44(?:[:：]33|장33절)',leader) or not re.search(r'45(?:[:：]1(?!\d)|장1절)',leader):
            raise ValueError('답지의 창 44:33, 45:1 근거 확인 필요')
        return 'C29 원고·놀이판·별도 진행자 PDF 렌더와 한글 본문 확인'
    if job == 'proof':
        import fitz
        count=0
        for label,file in pdf_files(cwd):
            with fitz.open(file) as doc:
                for number,page in enumerate(doc,1):
                    image=fitz.Pixmap(str(out/f'{label}-{number}.png'))
                    if (image.width,image.height)!=(page.rect.irect.width,page.rect.irect.height) or min(image.samples)>240:
                        raise ValueError('원본 PDF와 미리보기 크기 또는 내용 불일치')
                    count+=1
        return f'C29 아이용·진행자용 {count}면 미리보기 검증 통과'
    if job in ('bundle', 'journey'):
        if job == 'journey':
            run(['node', 'tools/build-david.js'], cwd)
        html = cwd / 'dist/david.html'
        if not html.exists() or 'data:video/mp4;base64,' not in html.read_text(encoding='utf-8'):
            raise ValueError('오프라인 영상 누락')
        if job == 'journey':
            run(['node', str(TOOLS/'journey.cjs'), str(html)], cwd)
            run(['node', 'web/david/tests/verify_nine_journey.js'], cwd, 1200)
        log = run(['node', 'web/david/tests/verify_temple_gifts.js'], cwd, 300)
        (out/'playtest.txt').write_text(log, encoding='utf-8')
        return '오프라인 HTML·D09 실조작 통과' if job == 'bundle' else '첫 연결·아홉 장면 완주 검사·D09 회귀 통과'
    raise ValueError('unknown verifier')
