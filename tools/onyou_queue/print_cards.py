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
