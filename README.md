# zxLeafOS 2.0 正式版 v3

> 基于 Scratch 3.0 的网页"操作系统"项目。
> 本仓库为项目全部源码，以 MIT 协议开源。

🌐 **在线体验**: https://lxgssy.github.io/zxLeafOS-2.0/

## 项目简介

zxLeafOS 2.0 是基于 Scratch 3.0 平台开发的伪操作系统项目，模拟了完整的桌面环境，
包含任务栏、应用商店、文件管理器、浏览器、文本编辑器、计算器、音乐播放器、视频播放器、
天气、时钟、AI 助手、设置、zx 聊天等多个系统应用。

## 项目数据

### 正式版 v3（根目录）

| 项目 | 数量 |
|------|------|
| 精灵（Sprites） | 335 |
| 积木（Blocks） | 29,034 |
| 造型（Costumes） | 886 |
| 声音（Sounds） | 1 |
| 变量（Variables） | 309 |
| 监视器（Monitors） | 116 |
| 扩展（Extensions） | 35 |

### beta2.5 1016（`beta2.5/` 目录，自 exe 完整解包）

| 项目 | 数量 |
|------|------|
| 精灵（Sprites） | 338 |
| 积木（Blocks） | 29,535 |
| 造型（Costumes） | 895 |
| 扩展（Extensions） | 37 |

## 目录结构

```
.
├── project.json              # 正式版 v3 项目主文件
│                             #   (Scratch 3.0 + extensionURLs / customFonts 扩展字段)
├── assets/                   # 751 个素材文件
│   ├── *.svg                 #   749 个矢量图
│   ├── *.wav                 #   1 个音频
│   └── *.ttf                 #   1 个字体 (MiSans-Heavy, customFonts 引用)
├── beta2.5/                  # beta2.5 1016 版（自 exe 完整解包并开源）
│   ├── README.md             #   解包过程与数据说明
│   ├── project.json          #   beta2.5 项目主文件
│   ├── zxLeafOS-beta2.5-original.sb3   # exe 内嵌的原始项目文件
│   └── extensions/           #   自制扩展可读 JS 源码
├── hot_updates/              # 热更新内容镜像
│   ├── 系统最新版本内容              # 系统更新日志
│   ├── 应用市场列表配置文件.json      # 应用商店列表
│   ├── 其他配置表/upd.txt           # 更新配置 + 热更新链接池
│   ├── zxai知识库.txt               # AI 助手知识库
│   ├── 应用模板.zip                  # 应用模板包（5 个 sprite3）
│   ├── 测试.sprite3 / 测试2.sprite3  # 更新链接池引用的测试精灵
│   ├── extensions/                  # TurboWarp 官方 gallery 扩展镜像（13 个）
│   └── MANIFEST.txt                 # 文件清单
├── README.md
├── .gitignore
└── LICENSE
```

## 使用方法

### 方法 1：直接游玩（推荐，零配置）

从 [Release 页面](https://github.com/LXgssy/zxLeafOS-2.0/releases) 下载：

- `zxLeafOS-2.0-hotupdated.html`（正式版，双击浏览器打开）
- `zxLeafOS beta2.5 1016.exe`（beta2.5 Windows 版）

打包版已内嵌全部扩展，无需任何授权操作，双击即玩。

### 方法 2：在 TurboWarp 编辑器中打开 .sb3（开发者）

1. 从 [Release 页面](https://github.com/LXgssy/zxLeafOS-2.0/releases) 下载 `.sb3` 文件
2. 访问 [TurboWarp 编辑器](https://turbowarp.org/editor)
3. 选择 "File → Load from your computer"，选择 `.sb3` 文件

#### ⚠️ 必读：扩展安全授权（否则会永远卡在加载界面）

本项目大量使用**内嵌自定义扩展**（以 `data:` URL 形式存储在 `project.json` 的
`extensionURLs` 字段中）。TurboWarp 的安全机制要求对每个内嵌扩展逐一人工授权：

- 正式版：**21 个**内嵌扩展授权弹窗（13 个官方 gallery 扩展自动加载，不弹窗）
- beta2.5：**23 个**内嵌扩展授权弹窗

每个弹窗的正确操作（共 2 步）：

1. ✅ **勾选 "Run without sandbox"**（第一次勾选后浏览器会记住选择，后续弹窗默认已勾选）
2. ✅ **点击 "Allow"**

> ❌ **千万不要点击 "Deny"**，也不要不勾选非沙箱就直接允许！
> 这些扩展必须以非沙箱模式运行（它们需要访问 DOM、IndexedDB、文件系统等）。
> 任何一个扩展被拒绝或在沙箱中加载失败，都会导致**整个项目永远卡在 "Loading project" 界面**。
> 如果卡住了，请刷新页面重新加载并重新授权。

全部授权完成后，扩展列表中应能看到全部扩展（My Blocks+、Indexed DB、运行时选项、
Looks+ 等），项目即可正常加载与运行。

### 关于扩展

本项目 35 个扩展的构成：

| 类型 | 数量 | 来源 | 加载方式 |
|------|------|------|----------|
| 官方 gallery 扩展 | 13 | extensions.turbowarp.org | 自动下载，无弹窗 |
| 自制扩展（内嵌） | 22 | `project.json` → `extensionURLs` (data: URL) | 手动授权（见上文） |

自制扩展的完整可读 JavaScript 源码位于 [`beta2.5/extensions/`](beta2.5/extensions/)。
内嵌形式（data: URL）是 TurboWarp 网页编辑器中自定义扩展**能够以非沙箱模式运行**的唯一途径。

## 精灵分组（正式版 v3，共 15 组）

| 分组 | 精灵数 | 分组 | 精灵数 |
|------|--------|------|--------|
| 其它系统应用 | 52 | code | 15 |
| 桌面 | 50 | 未分组 | 13 |
| 设置 | 43 | 应用市场 | 9 |
| 浏览器 | 26 | zx办公 | 7 |
| 文件管理 | 25 | 系统组件 | 6 |
| 时钟 | 24 | 桌面组件 | 5 |
| 关机 | 21 | | |
| 天气 | 21 | | |
| zx聊 | 18 | | |

## 热更新机制

项目运行时会从以下位置拉取热更新内容：

- **更新源仓库**: 本仓库自托管（2026-10-18 起热更源已迁回 `hot_updates/` 统一管理，原外部仓库 `zx34zxLeafOS/zxLeafOS_sprite3-` 不再作为更新源，运行时拉取地址已全部改指向本仓库）
- **更新配置**: `hot_updates/其他配置表/upd.txt`
- **更新策略**: 非强制更新，最低兼容版本 `20.8`（版本号 2.0v3）

所有热更新文件均自托管于本仓库的 `hot_updates/` 目录，
查看 [hot_updates/MANIFEST.txt](hot_updates/MANIFEST.txt) 获取完整文件清单。

## 项目元数据

- **项目 ID**: `acbd021c-07ee-48d4-a760-30eaa3392ea2`
- **Scratch 版本**: 3.0.0（含 extensionURLs / customFonts 扩展字段）
- **编辑器**: AstraEditor (https://editors.astras.top/)
- **最新版本**: 2.0v3 (内部版本号 20.8)
- **更新时间**: 2026.09.25

## 仓库维护记录

**2026-10-18 仓库体检与修复**：

- ✅ 修复 8 个 SVG 素材文件名 md5 与内容不符的问题（根 `assets/` 与 `project.json` 引用同步更新）
- ✅ 热更源迁回本仓库统一管理：外部仓库内容全量并入 `hot_updates/`（新增 4 个示例程序 sprite3、应用库说明等 9 个文件），`upd.txt` 链接池 / 应用市场列表 / 运行时 `project.json`（根目录与 beta2.5 各 18 处）中的外部 URL 全部改指向本仓库，`MANIFEST.txt` 重写为自托管清单，Release 附件 sb3 同步重建
- ↩️ 按维护者决定恢复 `hot_updates/api/ip.sb.geoip.json`（ip.sb API 响应快照，含服务器公网 IP 8.212.10.159，维护者知悉并选择保留）
- ✅ 修复 `upd.txt` 热更新链接池中的重复 URL
- ✅ `beta2.5/` 目录瘦身（34MB → 8.4MB）：移除与根目录重复的 744 个素材、中间产物 `project.decoded.json` 与存在素材命名问题的重存版 sb3；`project.json` 紧凑化（12.8MB → 6.2MB）
- ✅ Release 附件中的 `.sb3` 全部重建为完全符合 sb3 规范（素材 md5 = 文件名 = 内容哈希）的版本
- ✅ 实测验证：修复后的 sb3 在 TurboWarp 编辑器中可完整加载（35/37 扩展全部注册成功）

## 致谢

- 运行时: [Scaffolding](https://github.com/TurboWarp/scaffolding) (Mozilla Public License v2.0)
- [Scratch](https://scratch.mit.edu/) by MIT
- [PenguinMod Packager](https://studio.penguinmod.com/PenguinMod-Packager/)
- 扩展: CST1229, Lily, Skyhigh173, TheShovel, godslayerakp, CubesterYT, SharkPool 等

## 许可证

本项目全部源码（`project.json`、`assets/`、`beta2.5/`、`hot_updates/` 中原创内容）以
**MIT 协议**开源，详见 [LICENSE](LICENSE)。

`hot_updates/extensions/` 与 beta2.5 中来自第三方作者的扩展保留其原有许可证与版权声明。
