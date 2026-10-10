#!/usr/bin/env python3
"""
Extract Scratch project data from zxLeafOS 2.0 packaged HTML.

Algorithm (reverse-engineered from the packager's JS, see lines around idx 10373935):

  const getBase85DecodeValue = (code) => {
    if (code === 0x28) code = 0x3c;   // '('  -> '<'
    if (code === 0x29) code = 0x3e;   // ')'  -> '>'
    return code - 0x2a;
  };

So the alphabet is chars 0x2a..0x7e (85 chars), with '(' and ')' aliased
to '<' (18) and '>' (20) so the encoded text can safely sit inside an
HTML <script> tag.
"""
import os
import re
import sys
import zipfile

SRC_HTML = "/home/z/my-project/upload/zxLeafOS 2.0正式版v3 0926.html"
WORK_DIR = "/home/z/my-project/work"
PROJECT_DIR = os.path.join(WORK_DIR, "project")

os.makedirs(PROJECT_DIR, exist_ok=True)


def get_base85_decode_value(code: int) -> int:
    """Match the JS getBase85DecodeValue exactly."""
    if code == 0x28:  # '('
        code = 0x3c   # '<'
    if code == 0x29:  # ')'
        code = 0x3e   # '>'
    return code - 0x2a


def base85_decode_chunk(s: str, expected_size: int) -> bytes:
    """Decode a base85-encoded chunk to bytes (matching the JS implementation)."""
    # JS allocates Math.floor(str.length / 5) * 4 bytes for this chunk,
    # but we only need expected_size bytes.
    n = len(s)
    out = bytearray((n // 5) * 4)
    j = 0
    for i in range(0, n - n % 5, 5):
        v0 = get_base85_decode_value(ord(s[i]))
        v1 = get_base85_decode_value(ord(s[i + 1]))
        v2 = get_base85_decode_value(ord(s[i + 2]))
        v3 = get_base85_decode_value(ord(s[i + 3]))
        v4 = get_base85_decode_value(ord(s[i + 4]))
        val = (v4 * (85 ** 4)
               + v3 * (85 ** 3)
               + v2 * (85 ** 2)
               + v1 * 85
               + v0)
        # little-endian uint32
        out[j]     = val & 0xff
        out[j + 1] = (val >> 8) & 0xff
        out[j + 2] = (val >> 16) & 0xff
        out[j + 3] = (val >> 24) & 0xff
        j += 4
    return bytes(out[:expected_size])


def main():
    print(f"[*] Reading source HTML: {SRC_HTML}")
    with open(SRC_HTML, 'r', encoding='utf-8') as f:
        html = f.read()
    print(f"    HTML size: {len(html):,} chars")

    print("[*] Extracting project chunks...")
    pattern = re.compile(
        r'<script\s+type="application/x-o2-project-chunk"\s+data-size="(\d+)"\s*>(.*?)</script>',
        re.DOTALL
    )
    chunks = []
    total_size = 0
    for m in pattern.finditer(html):
        size = int(m.group(1))
        text = m.group(2).strip()
        chunks.append((size, text))
        total_size += size
    print(f"    Found {len(chunks)} chunks, total declared size = {total_size:,} bytes")

    print("[*] Decoding Base85 chunks...")
    decoded = bytearray(total_size)
    offset = 0
    for i, (size, text) in enumerate(chunks, 1):
        chunk_bytes = base85_decode_chunk(text, size)
        decoded[offset:offset + size] = chunk_bytes
        offset += size
        if i <= 5 or i == len(chunks):
            print(f"    Chunk {i:02d}: text_len={len(text):>7}, decoded={len(chunk_bytes):>7}, expected={size:>7}")
        elif i == 6:
            print(f"    ... (printing only first/last) ...")
    decoded = bytes(decoded[:offset])
    print(f"    Total decoded: {len(decoded):,} bytes")

    raw_zip_path = os.path.join(WORK_DIR, "project.zip")
    with open(raw_zip_path, 'wb') as f:
        f.write(decoded)
    print(f"[*] Wrote raw ZIP to: {raw_zip_path}")

    # Quick ZIP magic check
    if decoded[:2] != b'PK':
        print(f"[!] WARNING: First 2 bytes = {decoded[:2]!r}, expected b'PK' (ZIP magic)")

    print("[*] Verifying ZIP...")
    if not zipfile.is_zipfile(raw_zip_path):
        print("[!] ERROR: Decoded data is not a valid ZIP file!")
        sys.exit(1)

    print("[*] Extracting ZIP...")
    with zipfile.ZipFile(raw_zip_path, 'r') as z:
        names = z.namelist()
        print(f"    ZIP entries: {len(names)}")
        # Show first 30 entries
        for name in sorted(names)[:30]:
            info = z.getinfo(name)
            print(f"      - {name} ({info.file_size:,} bytes)")
        if len(names) > 30:
            print(f"      ... ({len(names) - 30} more entries)")
        z.extractall(PROJECT_DIR)
    print(f"[*] Extracted to: {PROJECT_DIR}")
    print("[*] Done.")


if __name__ == "__main__":
    main()
