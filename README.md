# zxLeafOS 2.0 正式版 v3

> 基于 Scratch 3.0 的网页"操作系统"项目。
> 本仓库为项目全部源码，以 MIT 协议开源。

## 项目简介

zxLeafOS 2.0 是基于 Scratch 3.0 平台开发的伪操作系统项目，模拟了完整的桌面环境，
包含任务栏、应用商店、文件管理器、浏览器、文本编辑器、计算器、音乐播放器、视频播放器、
天气、时钟、AI 助手、设置、zx 聊天等多个系统应用。

## 项目数据

| 项目 | 数量 |
|------|------|
| 精灵（Sprites） | 335 |
| 积木（Blocks） | 29,042 |
| 造型（Costumes） | 886 |
| 声音（Sounds） | 1 |
| 变量（Variables） | 309 |
| 扩展（Extensions） | 35 |
| SVG 资源文件 | 749 |
| 字体文件 | 1 |
| 热更新文件 | 26 |

## 目录结构

```
.
├── project.json              # Scratch 3.0 项目主文件
├── assets/                   # 751 个素材文件
│   ├── *.svg                 # 749 个矢量图
│   ├── *.wav                 # 1 个音频
│   └── *.ttf                 # 1 个字体
├── hot_updates/              # 热更新内容镜像
│   ├── 系统最新版本内容              # 系统更新日志
│   ├── 应用市场列表配置文件.json      # 应用商店列表
│   ├── 其他配置表/upd.txt           # 更新配置 + 热更新链接池
│   ├── zxai知识库.txt               # AI 助手知识库
│   ├── 应用模板.zip                  # 应用模板包（5 个 sprite3）
│   ├── 测试.sprite3                  # 测试精灵
│   ├── 测试2.sprite3                 # 测试精灵 2
│   ├── extensions/                  # TurboWarp 扩展镜像
│   │   ├── CST1229/zip.js
│   │   ├── Lily/*.js
│   │   ├── Skyhigh173/json.js
│   │   ├── TheShovel/CanvasEffects.js
│   │   ├── godslayerakp/http.js
│   │   ├── lab/text.js
│   │   ├── numerical-encoding-2.js
│   │   ├── CubesterYT/WindowControls.js
│   │   └── sample/             # 扩展文档示例文件
│   ├── api/ip.sb.geoip.json         # IP 地理位置服务示例响应
│   └── MANIFEST.txt                 # 文件清单
├── README.md
├── .gitignore
└── LICENSE
```

## 使用方法

### 方法 1：在 Scratch / TurboWarp 中打开 .sb3

1. 从 [Release 页面](https://github.com/LXgssy/zxLeafOS-2.0/releases) 下载 `zxLeafOS-2.0.sb3`
2. 访问 [TurboWarp 编辑器](https://turbowarp.org/editor)
3. 选择 "File → Load from your computer"，选择 `.sb3` 文件

> ⚠️ 注意：本项目使用了 35 个自定义扩展。
> 推荐使用 [TurboWarp](https://turbowarp.org/) 打开，兼容性更好。
> 扩展源码已镜像在 `hot_updates/extensions/` 目录。

### 方法 2：使用热更新版 HTML（推荐）

从 [Release 页面](https://github.com/LXgssy/zxLeafOS-2.0/releases) 下载 `zxLeafOS-2.0-hotupdated.html`，
双击即可在浏览器中打开运行，所有热更新内容已内嵌，无需联网。

## 精灵分组（共 15 组）

| 分组 | 精灵数 | 描述 |
|------|--------|------|
| 其它系统应用 | 52 |
| 桌面 | 50 |
| 设置 | 43 |
| 浏览器 | 26 |
| 文件管理 | 25 |
| 时钟 | 24 |
| 关机 | 21 |
| 天气 | 21 |
| zx聊 | 18 |
| code | 15 |
| 未分组 | 13 |
| 应用市场 | 9 |
| zx办公 | 7 |
| 系统组件 | 6 |
| 桌面组件 | 5 |

## 热更新机制

项目运行时会从以下位置拉取热更新内容：

- **更新源仓库**: https://github.com/zx34zxLeafOS/zxLeafOS_sprite3-
- **更新配置**: `hot_updates/其他配置表/upd.txt`
- **更新策略**: 非强制更新，最低兼容版本 `3.0.0`

所有热更新文件已在本仓库的 `hot_updates/` 目录中完整镜像，
查看 [hot_updates/MANIFEST.txt](hot_updates/MANIFEST.txt) 获取完整文件清单。

## 项目元数据

- **项目 ID**: `acbd021c-07ee-48d4-a760-30eaa3392ea2`
- **Scratch 版本**: 3.0.0
- **编辑器**: AstraEditor (https://editors.astras.top/)
- **最新版本**: 2.0v3 (内部版本号 20.8)
- **更新时间**: 2026.09.25

## 致谢

- 打包工具: [02Engine Packager](https://packager.02engine.02studio.xyz/) by 02Studio
- 运行时: [Scaffolding](https://github.com/TurboWarp/scaffolding) (Mozilla Public License v2.0)
- [Scratch](https://scratch.mit.edu/) by MIT

## 许可证

本项目全部源码（包括 `project.json`、`assets/`、`hot_updates/`）以 **MIT 协议** 开源，
详见 [LICENSE]
