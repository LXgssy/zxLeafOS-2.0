# zxLeafOS beta2.5 1016

本目录包含从 `zxLeafOS beta2.5 1016.exe` 中提取的 Scratch 项目源码。

## 项目数据

| 项目 | 数量 |
|------|------|
| 精灵（Sprites） | 338 |
| 积木（Blocks） | 29,526 |
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
├── project.json                        # 项目主文件 (紧凑格式)
├── zxLeafOS-beta2.5-original.sb3       # exe 内嵌的原始项目文件 (与解包结果字节级一致)
├── extensions/                         # 自制扩展可读 JS 源码
│   ├── zx.js / SPmbpCST.js / zxTools4.js / ...
│   └── _remote_extensions.txt          # 引用的官方 gallery 扩展清单
└── README.md                           # 本文档
```

> 素材文件不再单独存放：所有素材已包含在 `.sb3` 内，且与根目录 `assets/` 高度重复。
> 需要单独的素材时，将 `.sb3` 后缀改为 `.zip` 直接解压即可。

## 使用方法

### 在 TurboWarp 中打开

1. 从 [Release v2.5-beta](https://github.com/LXgssy/zxLeafOS-2.0/releases/tag/v2.5-beta) 下载 `zxLeafOS-beta2.5-original.sb3`
2. 访问 [TurboWarp 编辑器](https://turbowarp.org/editor)
3. 选择 "File → Load from your computer"，选择 `.sb3` 文件
4. 依次通过 **23 个扩展授权弹窗**：每个弹窗**勾选 "Run without sandbox" 后点击 "Allow"**
   （第一次勾选后浏览器会记住，后续弹窗默认已勾选）

> ⚠️ 本项目内嵌了 23 个自制扩展（其余 14 个：13 个官方 gallery 扩展 + TurboWarp 内置扩展，自动加载不弹窗）。
> 任何一个扩展被点 "Deny" 拒绝、或未勾选非沙箱就直接允许，都会导致**项目永远卡在加载界面**。
> 详细说明见[根 README 的 TurboWarp 导入指南](../README.md#方法-2在-turbowarp-编辑器中打开-sb3开发者)。
> 想要零弹窗体验请使用 Release 中的打包版。

## 与正式版 v3 的差异

| 项目 | beta2.5 | 正式版 v3 |
|------|---------|-----------|
| 打包工具 | PenguinMod Packager | 02Engine Packager |
| 加密方式 | AES-256-GCM (HTML 层) + PyInstaller exe 双层 | Base85 编码 (非加密) |
| 精灵数 | 338 | 335 |
| 积木数 | 29,526 | 26,000+ |
| 扩展数 | 37 | 35 |

## 许可证

本项目全部源码以 **MIT 协议** 开源，详见 [LICENSE](https://github.com/LXgssy/zxLeafOS-2.0/blob/main/LICENSE)。

## 扩展源码

`extensions/` 目录包含 23 个内嵌扩展的完整可读 JavaScript 源码：

| 扩展 ID | 说明 | 大小 |
|---------|------|------|
| SPmbpCST | My Blocks+ (自定义积木) | 117 KB |
| 0832rxfs2 | rxFS (虚拟内存文件系统) | 15 KB |
| mistiumindexeddb | IndexedDB 存储 | 13 KB |
| iframePlus | Iframe Plus (网页嵌入) | 16 KB |
| betterText | Better Text (文本处理) | 41 KB |
| zxTools4 | ZX Tools 4.0 (HTTP请求/录音等) | 104 KB |
| zx | ZXtools2.0 (计时器/倒计时) | 23 KB |
| filehelperprov2 | File Helper Pro V2 (文件操作) | 12 KB |
| advancedMonacoEditor | Advanced Monaco Editor (代码编辑器) | 79 KB |
| cyberexplorertoolboxzx | Cyberexplorer's Toolbox Mini | 133 KB |
| lmsDocuments | LMS Documents (文档系统) | 159 KB |
| WhenKeyPress | When Key Press (按键检测) | 133 KB |
| enhancedruntimeoptions | Enhanced Runtime Options | 19 KB |
| zxMusicPlayerV2 | ZX Music Player V2 | 36 KB |
| zxLyricsToolkit | ZX Lyrics Toolkit (歌词处理) | 35 KB |
| zxHtmlPreview | ZX HTML Preview | 18 KB |
| pageosWeatherOpenMeteoFull | PageOS Weather (Open-Meteo 天气) | 25 KB |
| zxCharacterControl | ZX Character Control (角色/ZIP控制) | 32 KB |
| dataurlmimefixer | Data URL MIME Fixer | 11 KB |
| speechapi | Web Speech API (语音识别) | 20 KB |
| variablesnapshot | Variable Snapshot (变量快照) | 25 KB |
| passwordprotect | Password Protect (密码保护) | 26 KB |
| WitCatInput | WitCat Input (输入框) | 77 KB |

另有 13 个远程扩展从 TurboWarp CDN 加载，列表见 `extensions/_remote_extensions.txt`。

`project.decoded.json` 是将所有 data: URI 替换为文件路径的版本，便于阅读。
