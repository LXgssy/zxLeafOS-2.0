# zxLeafOS beta2.5 1016

本目录包含从 `zxLeafOS beta2.5 1016.exe` 中提取的原始 HTML 文件。

## 文件来源

- **原 .exe 文件**: `zxLeafOS beta2.5 1016.exe` (21 MB, PyInstaller 打包的 Python 应用)
- **打包工具**: [PenguinMod Packager](https://studio.penguinmod.com/PenguinMod-Packager/)
- **运行时**: PenguinMod Scaffolding

## 提取方法

该 .exe 使用了 AES-256-GCM 双层加密 + Gzip 压缩保护：

1. PE 文件后追加加密 payload (5.2 MB)
2. 第一层: PBKDF2 派生密钥 (200,000 次迭代) + AES-256-GCM
3. 第二层: SHA-256(PE 内容) 作为密钥 + AES-256-GCM
4. 解密后 Gzip 解压得到 HTML (13 MB)

提取工具源码位于私密仓库 `LXgssy/zxLeafOS-deobfuscator`。
在线工具: https://lxgssy.github.io/zxLeafOS-deobfuscator-web/

## 使用方法

直接在浏览器中打开 `zxLeafOS-beta2.5.html` 即可运行。

## 与正式版 v3 的差异

- 正式版 v3: 02Engine Packager 打包
- beta2.5: PenguinMod Packager 打包
- 都是同一 Scratch 项目的不同打包版本
