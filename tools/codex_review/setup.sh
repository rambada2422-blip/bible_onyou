#!/bin/bash
# Codex 2차 검토용 격리 환경을 준비한다 (작업 환경 안, 저장소 밖). root로 실행한다.
# 새 작업 환경마다 1회, 그리고 검토 전에 복사본을 새로 받을 때마다 다시 실행한다.
# 복사본에는 '커밋된 상태'만 들어간다(커밋 안 한 변경은 들어가지 않는다).
set -euo pipefail
REPO=$(cd "$(dirname "$0")/../.." && pwd)
VER=0.167.2
ISO=/opt/codex-iso
# 1) Codex 프로그램 (버전 고정)
if [ "$(/opt/codex-cli/node_modules/.bin/codex --version 2>/dev/null)" != "codex-cli $VER" ]; then
  mkdir -p /opt/codex-cli
  npm install --prefix /opt/codex-cli --ignore-scripts --no-fund --no-audit "@openai/codex@$VER"
fi
# 2) 저장소 복사본 (매번 새로, 원격 주소 없음, root 소유)
mkdir -p $ISO
rm -rf $ISO/repo
git clone -q --no-hardlinks "$REPO" $ISO/repo
git -C $ISO/repo remote remove origin
chown -R root:root $ISO/repo && chmod -R go-w $ISO/repo
# 3) 프록시 인증서, Codex 전용 홈 (nobody만 쓸 수 있음. 로그인 정보는 여기에만 생긴다)
cp "${SSL_CERT_FILE:-/root/.ccr/ca-bundle.crt}" $ISO/ca.crt && chmod 644 $ISO/ca.crt
install -d -o 65534 -g 65534 -m 700 $ISO/home $ISO/home/.codex
# 4) 실행기와 격리 시험
install -m 755 "$REPO/tools/codex_review/run.sh" "$REPO/tools/codex_review/pretest.sh" $ISO/
echo "준비 완료: $(/opt/codex-cli/node_modules/.bin/codex --version), 복사본 $(git -C $ISO/repo rev-parse --short HEAD)"
