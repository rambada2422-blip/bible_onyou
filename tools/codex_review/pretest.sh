#!/bin/bash
ISO=/opt/codex-iso
echo "== ② 사용자"; id
echo "== ① 숨김 확인 (비어 있어야 함)"
for d in /home /root /tmp /home/user/bible_onyou /home/claude/.claude /run/sandbox-telemetry /opt/env-runner; do printf '%s: ' "$d"; ls -A "$d" 2>&1 | tr '\n' ' '; echo; done
echo "== ③ 환경 변수 이름"; env | cut -d= -f1 | sort | tr '\n' ' '; echo
for v in GH_TOKEN GITHUB_TOKEN CLOUDSDK_AUTH_ACCESS_TOKEN AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY CLAUDE_SESSION_INGRESS_TOKEN_FILE CLAUDE_CODE_MESSAGING_TOKEN; do [ -n "${!v:-}" ] && echo "LEAK $v" || echo "ok  $v 없음"; done
echo "== ② 쓰기 시도 (모두 실패해야 함)"
for f in $ISO/repo/_w $ISO/repo/.git/_w $ISO/repo/web3d/js/_w /opt/codex-cli/_w /opt/_w /etc/_w /usr/_w /home/_w /root/_w $ISO/_w $ISO/ca.crt; do
  if ( : > "$f" ) 2>/dev/null; then echo "WRITABLE $f"; rm -f "$f"; else echo "막힘 $f"; fi
done
echo "== git 설정 (인증 관련 키가 없어야 함)"; git -C $ISO/repo config --list --show-origin 2>&1 | cut -d= -f1; git -C $ISO/repo remote -v
echo "== nobody가 쓸 수 있는 디렉터리 전체"
find / -path /proc -prune -o -path /sys -prune -o -type d -writable -print 2>/dev/null
echo "== Codex 실행 확인"; codex --version
