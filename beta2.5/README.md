# zxLeafOS beta2.5 1016

本目录包含从 `zxLeafOS beta2.5 1016.exe` 中提取的 Scratch 项目源码。

## 项目数据

| 项目 | 数量 |
|------|------|
| 精灵（Sprites） | 338 |
| 积木（Blocks） | 29,535 |
| 造型（Costumes） | 895 |
| 声音（Sounds） | 1 |
| 扩展（Extensions） | 37 |
| SVG 资源文件 | 762 |
| 字体文件 | 1 |

## 文件来源

- **原 .exe 文件**: `zxLeafOS beta2.5 1016.exe` (21 MB, PyInstaller + AES-256-GCM 双层加密)
- **打包工具**: [PenguinMod Packager](https://studio.penguinmod.com/PenguinMod-Packager/)
- **运行时**: PenguinMod Scaffolding
- **编辑器**: AstraEditor (https://editors.astras.top/)

## 提取流程

### 1. 从 exe 中提取 HTML

.exe 文件结构：
- PE 文件头 + PyInstaller bootloader (716 KB)
- 追加的加密 payload (5.2 MB) — 8 个 chunks
- 105 字节 trailer (magic + n + dbl + payload_len)

解密算法：
1. `key = SHA-256(exe_data[:pe_raw_size])` — 32 字节 AES-256 密钥
2. 读取 8 个 chunks 拼接 → payload
3. 双层加密模式 (dbl=1)：
   - `derived = PBKDF2-HMAC-SHA256(key, salt, 200000, 32)` (salt = payload[:16])
   - `inner = AES-256-GCM(derived).decrypt(payload[16:28], payload[28:])`
4. `plain = AES-256-GCM(key).decrypt(inner[:12], inner[12:])`
5. `raw = gzip.decompress(plain)` → 13 MB
6. 前缀 4 字节 = config 长度，然后是 JSON config + HTML

### 2. 从 HTML 中提取 Scratch 项目

PenguinMod 打包的 HTML 使用 AES-256-GCM 加密项目数据：
- `<script id="zxlx-enc">` 包含 key/iv/xk (XOR 0xA5 编码 + reverse)
- `<script id="zxlx-data">` 包含 base64 编码的密文

解密步骤：
1. 解析 data-key, data-iv, data-xk（每项 XOR 0xA5，数组 reverse）
2. 如果有 xk：对 key/iv 再 XOR xk
3. base64 解码 zxlx-data 内容
4. AES-256-GCM 解密 → ZIP (.sb3)

## 目录结构

```
beta2.5/
├── project.json              # Scratch 3.0 项目主文件
├── assets/                   # 762 个素材文件
│   ├── *.svg                 # 矢量图素材
│   ├── *.ttf                 # 字体文件
│   └── ...
└── README.md                 # 本文档
```

## 使用方法

### 在 TurboWarp 中打开

1. 从 [Release v2.5-beta](https://github.com/LXgssy/zxLeafOS-2.0/releases/tag/v2.5-beta) 下载 `zxLeafOS-beta2.5.sb3`
2. 访问 [TurboWarp 编辑器](https://turbowarp.org/editor)
3. 选择 "File → Load from your computer"，选择 `.sb3` 文件

> ⚠️ 本项目使用了 37 个自定义扩展。推荐使用 TurboWarp 打开，兼容性更好。

## 与正式版 v3 的差异

| 项目 | beta2.5 | 正式版 v3 |
|------|---------|-----------|
| 打包工具 | PenguinMod Packager | 02Engine Packager |
| 加密方式 | AES-256-GCM (HTML 层) + PyInstaller exe 双层 | Base85 编码 (非加密) |
| 精灵数 | 338 | 335 |
| 积木数 | 29,535 | 26,000+ |
| 扩展数 | 37 | 35 |

## 许可证

本项目全部源码以 **MIT 协议** 开源，详见 [LICENSE](https://github.com/LXgssy/zxLeafOS-2.0/blob/main/LICENSE)。
