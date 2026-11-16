"""인물 GLB의 꼭짓점 자료를 줄인다(Blender 없이). 사용: python3 tools/blender/glb_slim.py <입력.glb> <출력.glb> [--check]
- NORMAL(법선): float 3개(12바이트) → 부호 있는 1바이트 정규화 3개 + 빈칸 1(4바이트). KHR_mesh_quantization(three r128 GLTFLoader 지원).
- WEIGHTS_0(뼈 가중치): float 4개(16바이트) → 0~255 정수 정규화 4개(4바이트). 합이 정확히 255가 되게 가장 큰 값으로 맞춘다.
- COLOR_0(꼭짓점 색): 2바이트 정수 4개 → 1바이트 정수 4개.
위치(POSITION)·관절 번호·인덱스·동작은 그대로 둔다. 같은 파일을 다시 넣어도 이미 줄인 것은 건너뛴다.
make_person.sh에서 SLIM=1이면 마지막에 이 스크립트를 부른다."""
import json, struct, sys

def main(src, dst, check=False):
    b = open(src, 'rb').read()
    assert b[:4] == b'glTF'
    L = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + L])
    o = 20 + L
    bl = struct.unpack('<I', b[o:o + 4])[0]
    binc = b[o + 8:o + 8 + bl]
    views = j['bufferViews']; accs = j['accessors']
    newdata = {}  # bufferView 번호 → (bytes, byteStride)
    done = set()
    def view_bytes(a):
        v = views[a['bufferView']]
        return binc[v.get('byteOffset', 0) + a.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']], v
    for m in j['meshes']:
        for p in m['primitives']:
            for name, ai in p['attributes'].items():
                if ai in done: continue
                a = accs[ai]
                if name == 'NORMAL' and a['componentType'] == 5126 and a['type'] == 'VEC3':
                    raw, v = view_bytes(a); st = v.get('byteStride', 12); n = a['count']
                    out = bytearray(n * 4)
                    for i in range(n):
                        x, y, z = struct.unpack_from('<3f', raw, i * st)
                        ln = (x * x + y * y + z * z) ** 0.5 or 1.0
                        q = [max(-127, min(127, round(c / ln * 127))) for c in (x, y, z)]
                        struct.pack_into('<3bx', out, i * 4, *q)
                    newdata[a['bufferView']] = (bytes(out), 4)
                    a['componentType'] = 5120; a['normalized'] = True; a.pop('byteOffset', None)
                    a.pop('min', None); a.pop('max', None)
                elif name.startswith('WEIGHTS_') and a['componentType'] == 5126:
                    raw, v = view_bytes(a); st = v.get('byteStride', 16); n = a['count']
                    out = bytearray(n * 4)
                    for i in range(n):
                        w = struct.unpack_from('<4f', raw, i * st); s = sum(w) or 1.0
                        q = [max(0, round(x / s * 255)) for x in w]
                        k = q.index(max(q)); q[k] += 255 - sum(q)
                        struct.pack_into('<4B', out, i * 4, *q)
                    newdata[a['bufferView']] = (bytes(out), None)
                    a['componentType'] = 5121; a['normalized'] = True; a.pop('byteOffset', None)
                    a.pop('min', None); a.pop('max', None)
                elif name.startswith('COLOR_') and a['componentType'] == 5123:
                    raw, v = view_bytes(a); nc = 4 if a['type'] == 'VEC4' else 3; st = v.get('byteStride', 2 * nc); n = a['count']
                    out = bytearray(n * 4)
                    for i in range(n):
                        c = struct.unpack_from('<%dH' % nc, raw, i * st)
                        q = [round(x / 65535 * 255) for x in c]
                        struct.pack_into('<%dB' % nc + ('x' if nc == 3 else ''), out, i * 4, *q)
                    newdata[a['bufferView']] = (bytes(out), 4 if nc == 3 else None)
                    a['componentType'] = 5121; a['normalized'] = True; a.pop('byteOffset', None)
                done.add(ai)
    # 바뀐 bufferView가 다른 accessor와 함께 쓰이면 안 된다
    for vi in newdata:
        users = [k for k, a in enumerate(accs) if a.get('bufferView') == vi]
        assert len(users) == 1, ('bufferView를 여럿이 씀', vi, users)
    # 새 바이너리를 4바이트 맞춤으로 다시 잇는다
    out = bytearray()
    for vi, v in enumerate(views):
        while len(out) % 4: out.append(0)
        if vi in newdata:
            data, st = newdata[vi]
            v['byteOffset'] = len(out); v['byteLength'] = len(data)
            if st: v['byteStride'] = st
            else: v.pop('byteStride', None)
            out += data
        else:
            off = v.get('byteOffset', 0); data = binc[off:off + v['byteLength']]
            v['byteOffset'] = len(out); out += data
    while len(out) % 4: out.append(0)
    j['buffers'][0]['byteLength'] = len(out)
    if newdata:
        for key in ('extensionsUsed', 'extensionsRequired'):
            ex = j.setdefault(key, [])
            if 'KHR_mesh_quantization' not in ex: ex.append('KHR_mesh_quantization')
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(out)) + b'BIN\x00' + bytes(out)
    open(dst, 'wb').write(glb)
    if check: print(src, len(b), '→', dst, len(glb), '(%.0f%%)' % (100.0 * len(glb) / len(b)), '바꾼 자료', len(newdata))

if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    main(a[0], a[1], '--check' in sys.argv)
