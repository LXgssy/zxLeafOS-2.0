# zxLeafOS 2.0 正式版 v3

> 一个由 Scratch 3.0 编写的网页"操作系统"项目。

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
| SVG 资源文件 | 749 |
| WAV 音频文件 | 1 |
| TTF 字体文件 | 1 |
| 扩展（Extensions） | 35 |

## 目录结构

```
.
├── project.json              # Scratch 3.0 项目主文件（已格式化，便于阅读）
├── assets/                   # 所有素材文件
│   ├── *.svg                 # 749 个矢量图素材
│   ├── *.wav                 # 1 个音频素材
│   └── *.ttf                 # 1 个字体文件
├── docs/                     # 文档
│   ├── EXTRACTION.md         # 从打包 HTML 中提取项目源码的步骤
│   └── PROJECT_STRUCTURE.md  # 项目结构详解（按精灵分组）
├── scripts/                  # 辅助脚本
│   └── extract_project.py    # 提取脚本（Python）
├── zxLeafOS-2.0.sb3          # 原始 Scratch 项目文件（可直接在 Scratch 编辑器中打开）
├── README.md
├── .gitignore
└── LICENSE
```

## 使用方法

### 方法 1：在 Scratch 编辑器中打开
1. 下载 `zxLeafOS-2.0.sb3` 文件
2. 访问 [Scratch 在线编辑器](https://scratch.mit.edu/projects/editor/) 或 [TurboWarp](https://turbowarp.org/editor)
3. 选择 "File → Load from your computer"，选择 `.sb3` 文件

> ⚠️ 注意：本项目使用了大量自定义扩展（35 个），完整运行需要这些扩展。
> 推荐使用 [TurboWarp](https://turbowarp.org/) 打开，兼容性更好。

### 方法 2：在本地运行原始打包版本
- 直接打开原始 HTML 文件（`zxLeafOS 2.0正式版v3 0926.html`）即可运行

## 精灵分组（共 15 组）

| 分组 | 精灵数 |
|------|--------|
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

## 提取方法

本项目源码从一个使用 02Engine Packager 打包的 HTML 文件中提取而来。
原始 HTML 文件大小约 10MB，其中项目数据被 Base85 编码后嵌入在 36 个
`<script type="application/x-o2-project-chunk">` 标签中。

详细提取步骤请见 [docs/EXTRACTION.md](docs/EXTRACTION.md)。

## 项目元数据

- **项目 ID**: `acbd021c-07ee-48d4-a760-30eaa3392ea2`
- **Scratch 版本**: 3.0.0
- **编辑器**: AstraEditor (https://editors.astras.top/)

## 关于反逆向保护

原始打包 HTML 包含以下保护机制（均已在本仓库的源码中被剥离）：

1. 禁用右键菜单
2. 禁用 F12 / Ctrl+Shift+I/J/C / Ctrl+U 等开发者工具快捷键
3. 通过 `debugger` 时间差检测 DevTools，打开则自动刷新
4. 项目数据使用 Base85 编码（非加密）
5. ZIP 压缩无密码保护
6. JavaScript 代码经 Webpack 打包 + minify

**项目本身没有使用任何真正的加密技术**，所有数据均可通过现有 JS 代码完整还原。

## 许可证

本项目以 MIT 许可证发布，
详见 [LICENSE](LICENSE)。

## 致谢

- 原项目作者: zxLeafOS 团队
- 打包工具: [02Engine Packager](https://packager.02engine.02studio.xyz/) by 02Studio
- 运行时: [Scaffolding](https://github.com/TurboWarp/scaffolding) (Mozilla Public License v2.0)
- [Scratch](https://scratch.mit.edu/) by MIT
