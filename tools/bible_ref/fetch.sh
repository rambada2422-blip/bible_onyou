#!/bin/bash
# 검증용 성경 본문(구약과 신약)을 ref/bible/ 에 받는다. 저장소에는 넣지 않는다(.gitignore). 게임·문서에 본문을 싣지 않는다(규칙서 7절).
#   개역한글(krv): github.com/nehemiaharchives/bbl 의 공개 사본, 장마다 한 파일(krv.<책 번호>.<장>.txt)
#   KJV: github.com/thiagobodruk/bible 의 en_kjv.json
set -euo pipefail
D="$(cd "$(dirname "$0")/../.." && pwd)/ref/bible"
mkdir -p "$D/krv" && cd "$D"
[ -s en_kjv.json ] || curl -sS --max-time 120 --retry 3 -o en_kjv.json https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json
cd krv
i=0
for n in 50 40 27 36 34 24 21 4 31 24 22 25 29 36 10 13 10 42 150 31 12 8 66 52 5 48 12 14 3 9 1 4 7 3 3 3 2 14 4 \
         28 16 24 21 28 16 16 13 6 6 4 4 5 3 6 4 3 1 13 5 5 3 5 1 1 1 22; do
  i=$((i+1)); for c in $(seq 1 $n); do [ -s "krv.$i.$c.txt" ] || echo "krv.$i.$c.txt"; done
done | xargs -r -P 12 -I{} curl -sS --max-time 40 --retry 3 -o {} https://raw.githubusercontent.com/nehemiaharchives/bbl/master/resources/bbltexts/krv/{}
echo "krv 장 수: $(ls krv.*.txt | wc -l) (1189여야 함: 구약 929 + 신약 260), 잘못 받은 파일: $(grep -l '404: Not Found' krv.*.txt | wc -l)"
