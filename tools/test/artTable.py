# 진행 파일의 '그린 것과 근거 장절' 절을 sceneart.js의 장면 머리 주석과 그림 함수 주석에서 다시 만든다.
import re,io
import os
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')+'/'
s=io.open(root+'web3d/js/sceneart.js',encoding='utf8').read()
s=s[s.index('/* ═══ 장면 그림'):]
out=['## 그린 것과 근거 장절','`web3d/js/sceneart.js`의 장면 묶음 주석에서 뽑은 것(같은 내용이 코드 주석에 있다). 대목 줄은 그림 함수마다의 한 줄 주석이다.','']
for m in re.finditer(r'/\* ── (OT-\d\d[^\n]*?) ──\n(.*?)\*/(.*?)(?=/\* ── OT-|\Z)',s,re.S):
    out.append('### '+m.group(1))
    head=' '.join(x.strip().lstrip('*').strip() for x in m.group(2).strip().split('\n'))
    out.append(head); out.append('')
    seen=set()
    for c in re.findall(r'/\* (\d[\d·]*\)[^\n]*?) \*/',m.group(3)):   # 그림 함수 위의 줄 주석과 beats 줄 끝의 주석 모두
        if c not in seen: seen.add(c); out.append('- '+c)
    out.append('')
p=root+'docs/auto/art_진행.md'; t=io.open(p,encoding='utf8').read()
a=t.index('## 그린 것과 근거 장절'); b=t.index('## 그리는 법 요약')
t=t[:a]+'\n'.join(out)+'\n'+t[b:]
io.open(p,'w',encoding='utf8').write(t); print('표 갱신', len(out),'줄')
