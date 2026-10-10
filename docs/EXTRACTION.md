# 从打包 HTML 提取 zxLeafOS 2.0 项目源码

## 背景

原始文件 `zxLeafOS 2.0正式版v3 0926.html` 是一个由 **02Engine Packager** 打包的
Scratch 3.0 项目。文件大小约 10 MB，包含：

1. 项目运行时（Scaffolding + Scratch VM，约 9 MB 压缩混淆的 JavaScript）
2. 项目数据（约 2.3 MB，Base85 编码后嵌入 HTML）

## 提取原理

### 1. 项目数据的存储方式

项目数据（ZIP 格式的 .sb3 文件内容）被分割成 36 个 chunk，每个 chunk 65536 字节
（最后一个 chunk 55476 字节），共 2,349,236 字节。

每个 chunk 通过 Base85 编码后，放在一个特殊的 `<script>` 标签中：

```html
<script type="application/x-o2-project-chunk" data-size="65536">
  wC_B+4****2****zxErH/B9NVv4nOT@sA...
</script>
```

### 2. Base85 解码算法

02Engine Packager 使用的 Base85 变体（在 HTML 文件第 95189 行附近找到）：

```javascript
const getBase85DecodeValue = (code) => {
  if (code === 0x28) code = 0x3c;   // '('  -> '<'
  if (code === 0x29) code = 0x3e;   // ')'  -> '>'
  return code - 0x2a;
};

const base85decode = (str, outBuffer, outOffset) => {
  const view = new DataView(outBuffer, outOffset, Math.floor(str.length / 5 * 4));
  for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {
    view.setUint32(j, (
      getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 1)) * 85 +
      getBase85DecodeValue(str.charCodeAt(i))
    ), true);  // little-endian
  }
};
```

**关键点**：
- 字母表是 ASCII 0x2a (`*`) 到 0x7e (`~`) 共 85 个字符
- 因为 `<` 和 `>` 在 HTML 中有特殊含义，所以用 `(` 和 `)` 替代
- 数据以小端序 uint32 写入

### 3. 解码后的数据

将 36 个 chunk 解码拼接后，得到一个标准的 ZIP 文件（PK 头），
里面包含：
- `project.json` — Scratch 3.0 项目数据
- 749 个 `.svg` 文件 — 矢量图素材
- 1 个 `.wav` 文件 — 音频素材
- 1 个 `.ttf` 文件 — 自定义字体

## 完整提取步骤

### 步骤 1：识别项目数据

```python
import re
pattern = re.compile(
    r'<script\s+type="application/x-o2-project-chunk"\s+data-size="(\d+)"\s*>(.*?)</script>',
    re.DOTALL
)
chunks = [(int(m.group(1)), m.group(2).strip()) for m in pattern.finditer(html)]
```

### 步骤 2：Base85 解码每个 chunk

```python
def get_base85_decode_value(code: int) -> int:
    if code == 0x28:  # '('
        code = 0x3c   # '<'
    if code == 0x29:  # ')'
        code = 0x3e   # '>'
    return code - 0x2a

def base85_decode_chunk(s: str, expected_size: int) -> bytes:
    out = bytearray((len(s) // 5) * 4)
    j = 0
    for i in range(0, len(s) - len(s) % 5, 5):
        v0 = get_base85_decode_value(ord(s[i]))
        v1 = get_base85_decode_value(ord(s[i + 1]))
        v2 = get_base85_decode_value(ord(s[i + 2]))
        v3 = get_base85_decode_value(ord(s[i + 3]))
        v4 = get_base85_decode_value(ord(s[i + 4]))
        val = (v4 * (85**4) + v3 * (85**3) + v2 * (85**2) + v1 * 85 + v0)
        out[j]     = val & 0xff
        out[j + 1] = (val >> 8) & 0xff
        out[j + 2] = (val >> 16) & 0xff
        out[j + 3] = (val >> 24) & 0xff
        j += 4
    return bytes(out[:expected_size])
```

### 步骤 3：拼接并解压

```python
import zipfile

decoded = bytearray()
for size, text in chunks:
    decoded.extend(base85_decode_chunk(text, size))

# decoded 就是一个 ZIP 文件 (.sb3)
with open('project.sb3', 'wb') as f:
    f.write(decoded)

# 解压
with zipfile.ZipFile('project.sb3', 'r') as z:
    z.extractall('project/')
```

## 关于反逆向保护

原始 HTML 文件包含以下"反逆向"保护机制（注意：都不是真正的加密）：

### 1. 行为限制（HTML 顶部的 JS）

```javascript
// 禁用右键菜单
document.addEventListener('contextmenu', function(e){
  e.preventDefault();
  return false;
});

// 禁用 F12 / Ctrl+Shift+I/J/C / Ctrl+U
document.addEventListener('keydown', function(e){
  if (e.key === 'F12') { e.preventDefault(); return false; }
  if (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C'].includes(e.key)) {
    e.preventDefault(); return false;
  }
  if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
    e.preventDefault(); return false;
  }
});
```

**绕过方法**：在浏览器中禁用 JavaScript 后查看源码，或直接用文本编辑器打开 HTML 文件。

### 2. DevTools 检测（debugger 时间差法）

```javascript
var _count = 0;
function _check() {
  var _start = performance.now();
  debugger;  // 在 DevTools 打开时会暂停
  if (performance.now() - _start > 100) {
    _count++;
    if (_count > 3) location.reload();
  }
  setTimeout(_check, 3000);
}
```

**绕过方法**：在 DevTools 的 "Sources → Deactivate breakpoints" 中禁用断点。

### 3. 代码压缩混淆

JavaScript 代码经 Webpack 打包 + minify，变量名被缩短，但逻辑仍可读。

**绕过方法**：使用 [Prettier](https://prettier.io/) 或浏览器 DevTools 的 `{}` 格式化按钮。

### 4. 项目数据 Base85 编码

**这不是加密**，只是一种编码方式，目的是让二进制数据能嵌入 HTML 文本中。
解码算法就在同一个 HTML 文件中，任何人都能读取。

### 5. ZIP 无密码保护

**没有使用 ZIP 加密**，任何人都可以用任何 ZIP 工具解压。

## 总结

| 保护机制 | 类型 | 是否可绕过 |
|----------|------|------------|
| 禁用右键 | 行为限制 | ✅ 禁用 JS 或用文本编辑器 |
| 禁用快捷键 | 行为限制 | ✅ 禁用 JS 或用文本编辑器 |
| DevTools 检测 | 行为限制 | ✅ 禁用断点 |
| Base85 编码 | 编码（非加密） | ✅ 算法在文件中 |
| ZIP 压缩 | 压缩（非加密） | ✅ 无密码 |
| 代码压缩混淆 | 混淆（非加密） | ✅ Prettier |

**结论**：本项目没有使用任何真正的加密技术，所有数据均可通过现有 JS 代码完整还原。
