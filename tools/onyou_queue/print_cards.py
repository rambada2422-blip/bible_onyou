"""Render Claude/Antigravity's reviewed C29 print layout locally without a shell tool."""
import html
import json
import os
from pathlib import Path


def render(folder):
    import fitz
    source = folder/'C29_인쇄.json'
    data = json.loads(source.read_text(encoding='utf-8'))
    for group, filename in [('child','C29.pdf'),('leader','C29_답지.pdf')]:
        pages = data[group]
        if not isinstance(pages,list) or not 1 <= len(pages) <= 12:
            raise ValueError('인쇄 면 수를 확인하세요')
        target = folder/filename
        temp = target.with_suffix('.tmp.pdf')
        with fitz.open() as doc:
            for sheet in pages:
                title, blocks = sheet['title'],sheet['blocks']
                if not isinstance(title,str) or not isinstance(blocks,list) or not blocks or not all(isinstance(b,str) and b.strip() for b in blocks):
                    raise ValueError('각 면에 제목과 카드 문구가 필요합니다')
                page = doc.new_page(width=595,height=842)
                # Fixed card edges can be cut by hand. Text must fit at its original print size.
                markup='<h1>'+html.escape(title)+'</h1>'
                for block in blocks:
                    markup+='<p>'+html.escape(block).replace('\n','<br>')+'</p>'
                spare,_=page.insert_htmlbox(fitz.Rect(35,38,560,804),'<div lang="ko">'+markup+'</div>',
                    css='* {font-family:sans-serif} h1 {font-size:22pt} p {font-size:14pt;line-height:1.5;border:1px dashed #777;padding:10pt;margin:8pt 0}',
                    scale_low=1)
                if spare<0:
                    raise ValueError('인쇄 면이 넘칩니다. 카드를 두 면으로 나눠 주세요')
            doc.subset_fonts()
            doc.save(temp,garbage=4,deflate=True)
        os.replace(temp,target)


def dimensions(work):
    """Use only the four measurements already printed in the C29 preparation instructions."""
    import re
    source=(work/'docs/창세기/연속/C29.md').read_text(encoding='utf-8')
    line=next((s for s in source.splitlines() if '가로는 모두' in s and '세로는' in s),'')
    width=re.search(r'가로는 모두 ([\d.]+)\s*cm',line)
    rows=re.findall(r'(\d)칸 ([\d.]+)\s*cm',line)
    if not width or [r[0] for r in rows]!=list('2345'):
        raise ValueError('C29 준비 3번의 네 덮개 치수를 찾을 수 없습니다')
    return float(width[1])*10, [(n,float(h)*10) for n,h in rows]


def masks(work,out):
    import fitz
    mm=72/25.4
    width,rows=dimensions(work)
    with fitz.open() as doc:
        page=doc.new_page(width=210*mm,height=297*mm)
        page.insert_text((10*mm,12*mm),'C29 인쇄 검토용 덮개',fontname='korea',fontsize=16)
        page.insert_text((10*mm,19*mm),'비치지 않는 종이에 실제 크기(100%)로 인쇄해 테두리를 따라 자르세요.',fontname='korea',fontsize=10)
        top=26
        for number,height in rows:
            box=fitz.Rect(10*mm,top*mm,(10+width)*mm,(top+height)*mm)
            if box.x1>page.rect.width-8*mm or box.y1>page.rect.height-15*mm:
                raise ValueError('지정된 덮개가 A4에 들어가지 않습니다')
            page.draw_rect(box,width=.5,color=(.2,.2,.2))
            page.insert_text(((12)*mm,(top+8)*mm),number+'칸',fontname='korea',fontsize=12)
            top+=height+4
        page.draw_line((10*mm,top*mm),(60*mm,top*mm),color=(0,0,0))
        page.insert_text((10*mm,(top+5)*mm),'이 선을 자로 재어 5 cm인지 확인하세요.',fontname='korea',fontsize=9)
        doc.save(out/'C29_덮개_실제크기.pdf',deflate=True)


def verify_masks(work,out):
    import fitz
    mm=72/25.4
    width,rows=dimensions(work)
    with fitz.open(out/'C29_덮개_실제크기.pdf') as doc:
        if len(doc)!=1:
            raise ValueError('덮개는 한 면이어야 합니다')
        page=doc[0]
        if abs(page.rect.width/mm-210)>.1 or abs(page.rect.height/mm-297)>.1:
            raise ValueError('A4 크기 불일치')
        boxes=[it[1] for drawing in page.get_drawings() for it in drawing['items'] if it[0]=='re']
        if len(boxes)!=4:
            raise ValueError('덮개 개수 불일치')
        label=''.join(page.get_text().split())
        previous=0
        for box,(n,height) in zip(boxes,rows):
            if abs(box.width/mm-width)>.1 or abs(box.height/mm-height)>.1 or box.y0<=previous or n+'칸' not in label:
                raise ValueError(n+'칸 표시·치수·배치 불일치')
            previous=box.y1
    return 'A4 덮개 네 장 · 원고의 너비·높이와 PDF 재단선 대조 통과'
