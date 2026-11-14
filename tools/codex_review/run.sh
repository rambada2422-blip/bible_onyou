#!/bin/bash
# Codex 격리 실행기 (작업 환경 전용, 저장소 밖). root로 실행하면
# 새 마운트·PID 공간을 만들고, 민감 경로를 빈 공간으로 덮고, 복사본을 읽기 전용으로 붙인 뒤
# nobody 사용자 + 최소 환경 변수로 명령을 실행한다.
set -euo pipefail
ISO=/opt/codex-iso
if [ "${1:-}" != "__inner" ]; then
  exec unshare --mount --pid --fork --mount-proc --propagation private "$0" __inner "$@"
fi
shift
# 1) 민감 경로를 빈 임시 공간으로 덮는다
#    (a) 숨기기만: 비어 있고 쓰기 불가
for d in /home /root /run/sandbox-telemetry /run/lock /var/lib/php/sessions /opt/env-runner /opt/claude-code /opt/rclone /opt/rclone-attach /opt/cu-desktop; do
  [ -d "$d" ] && mount -t tmpfs -o mode=755,size=1m,ro tmpfs "$d"
done
#    (b) 임시 작업 공간: 이 격리 공간이 끝나면 사라짐
for d in /tmp /var/tmp /dev/shm; do
  mount -t tmpfs -o mode=1777,size=256m tmpfs "$d"
done
# 2) 복사본·Codex 프로그램·인증서를 읽기 전용으로 다시 붙인다
for d in $ISO/repo /opt/codex-cli; do
  mount --bind "$d" "$d"; mount -o remount,bind,ro "$d"
done
mount --bind $ISO/ca.crt $ISO/ca.crt; mount -o remount,bind,ro $ISO/ca.crt
# 3) nobody 사용자 + 최소 환경 변수
cd $ISO/repo
exec setpriv --reuid=65534 --regid=65534 --clear-groups --no-new-privs \
  env -i \
    PATH=/opt/codex-cli/node_modules/.bin:/opt/node22/bin:/usr/local/bin:/usr/bin:/bin \
    HOME=$ISO/home CODEX_HOME=$ISO/home/.codex \
    HTTPS_PROXY="$HTTPS_PROXY" https_proxy="$HTTPS_PROXY" HTTP_PROXY="$HTTPS_PROXY" http_proxy="$HTTPS_PROXY" \
    NO_PROXY="localhost,127.0.0.1,::1" no_proxy="localhost,127.0.0.1,::1" \
    SSL_CERT_FILE=$ISO/ca.crt NODE_EXTRA_CA_CERTS=$ISO/ca.crt CODEX_CA_CERTIFICATE=$ISO/ca.crt \
    TERM=dumb LANG=C.UTF-8 \
    GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=$ISO/repo \
    "$@"
