"""Subscription CLI adapters. Account/transport checks run before every paid-service invocation."""
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from datetime import datetime
from pathlib import Path


class Waiting(Exception):
    def __init__(self, reason, delay=300, kind='setup'):
        super().__init__(reason)
        self.kind = kind
        self.delay = delay


def safe_env():
    names = ('PATH','PATHEXT','SYSTEMROOT','WINDIR','COMSPEC','USERPROFILE','APPDATA','LOCALAPPDATA',
             'PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMW6432','TEMP','TMP','TMPDIR','HOME','USER','USERNAME',
             'HOMEDRIVE','HOMEPATH','LANG','LC_ALL','XDG_CONFIG_HOME','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS',
             'NODE_PATH','PLAYWRIGHT_BROWSERS_PATH','VIRTUAL_ENV')
    env = {k:v for k,v in os.environ.items() if k.upper() in names}
    env.update({'GIT_TERMINAL_PROMPT':'0','PYTHONUTF8':'1'})
    return env


def read_settings(path):
    if not path.exists():
        return {}
    try:
        settings = json.loads(path.read_text(encoding='utf-8-sig'))
        if not isinstance(settings, dict):
            raise ValueError()
        return settings
    except (OSError, ValueError) as exc:
        raise Waiting('구독 설정 파일을 읽을 수 없음') from exc


def configure_personal_antigravity():
    path=Path.home()/'.gemini/antigravity-cli/settings.json'
    current=read_settings(path)
    auth=current.get('auth',{})
    if (not isinstance(auth,dict) or auth.get('type') not in (None,'oauth-personal') or
            current.get('modelProvider') not in (None,'','antigravity') or current.get('gcp')):
        raise Waiting('기존 기업/API 프로필이 있습니다. 개인 OAuth로 전환한 뒤 등록하세요.')
    current['auth']={**auth,'type':'oauth-personal'}
    current['useG1Credits']=False
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=path.parent,delete=False) as tmp:
        json.dump(current,tmp,ensure_ascii=False,indent=2)
    os.replace(tmp.name,path)


def command(service, enabled, cwd):
    exe = shutil.which('claude' if service == 'claude' else 'agy')
    if not exe:
        raise Waiting(f'{service} 공식 CLI 설치·로그인 대기')
    if service not in enabled:
        raise Waiting(f'{service} 초과 사용 꺼짐 확인 대기')
    env = safe_env()
    if service == 'claude':
        try:
            status = subprocess.run([exe, 'auth', 'status'], cwd=cwd, env=env, capture_output=True,
                                    timeout=20, encoding='utf-8', errors='replace')
            auth = json.loads(status.stdout)
        except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
            raise Waiting('Claude 구독 로그인 상태 확인 대기') from exc
        if status.returncode or not auth.get('loggedIn') or auth.get('authMethod') != 'claude.ai':
            raise Waiting('Claude 개인 구독 로그인 필요')
        if auth.get('apiProvider', 'firstParty') != 'firstParty' or auth.get('subscriptionType','') not in ('pro','max','ultra'):
            raise Waiting('Claude 개인 유료 구독 유형 확인 필요')
        return [exe, '--safe-mode', '--setting-sources', '', '--strict-mcp-config',
                '--permission-mode','acceptEdits','--output-format','json','-p'], env
    settings = read_settings(Path.home()/'.gemini/antigravity-cli/settings.json')
    auth=settings.get('auth')
    if (not isinstance(auth,dict) or auth.get('type') != 'oauth-personal' or settings.get('gcp') or
            settings.get('modelProvider') not in (None,'','antigravity')):
        raise Waiting('Antigravity CLI 개인 OAuth 설정 확인 필요 (auth.type = oauth-personal)')
    if settings.get('useG1Credits', False) is not False:
        raise Waiting('Antigravity Use AI Credits를 Off로 설정해야 함')
    return [exe,'--mode','auto','--output-format','json','-p'], env


def reset_delay(payload, message, attempt):
    # Prefer an explicit server-supplied interval or timestamp. A failed probe only backs off this service.
    now = time.time()
    if isinstance(payload, dict):
        for name in ('retry_after','retryAfter','retry_after_seconds'):
            value = payload.get(name)
            if isinstance(value,(int,float)) and value > 0:
                return max(2, int(value)+1)
        for name in ('resetsAt','reset_at','resetAt','resets_at'):
            value = payload.get(name)
            try:
                until = float(value) if isinstance(value,(int,float)) else datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()
                if until > 1e12:
                    until /= 1000
                if until > now:
                    return int(until-now)+1
            except (TypeError, ValueError, AttributeError):
                pass
        for v in payload.values():
            if isinstance(v,dict):
                nested = reset_delay(v, '', 0)
                if nested:
                    return nested
    m = re.search(r'(?:retry|try again|resets?)\s+(?:after\s+|in\s+)?(\d+)\s*(seconds?|s\b|minutes?|m\b|hours?|h\b)', message, re.I)
    if m:
        return max(2,int(m[1])*{'s':1,'m':60,'h':3600}[m[2][0].lower()]+1)
    return min(3600, 300*2**min(4,attempt-1)) if attempt else 0


def interpret(code, stdout, stderr, attempt):
    try:
        payload = json.loads(stdout)
    except ValueError:
        payload = {}
    is_error = isinstance(payload,dict) and (payload.get('is_error') or payload.get('error') or
               str(payload.get('subtype','')).startswith('error') or payload.get('status') == 'error')
    # A successful model's answer may discuss quotas. Only interpret CLI diagnostics as failures.
    message = stderr + (' '+stdout[-6000:] if code or is_error else '')
    if re.search(r'rate.limit|usage.limit|quota.exhaust|resource.exhaust|(?:limit|quota).{0,15}(?:reached|exceeded)|hit your (?:session |weekly )?limit|too many requests|\b429\b|사용량 한도', message, re.I):
        raise Waiting('구독 사용 한도',reset_delay(payload,message,attempt),'quota')
    if re.search(r'authentication required|not logged in|please (?:log|sign) in|invalid credentials|unauthenticated|login required',message,re.I):
        raise Waiting('서비스 재로그인 대기')
    if re.search(r'ECONNRESET|ETIMEDOUT|network error|overloaded|temporarily unavailable|\b(?:502|503|504|529)\b',message,re.I):
        raise Waiting('일시적인 연결 오류', min(900,15*2**min(6,attempt-1)), 'transient')
    if code or is_error or not isinstance(payload, dict) or not payload:
        raise ValueError(f'공식 CLI가 성공 결과를 주지 않음 (exit {code})')
