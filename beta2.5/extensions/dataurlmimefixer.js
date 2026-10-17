(function(Scratch) {
    'use strict';

    class DataURLMIMEFixer {
        constructor(runtime) {
            this.runtime = runtime;
        }

        getInfo() {
            return {
                id: 'dataurlmimefixer',
                name: 'DataURL 类型修复器',
                color1: '#E91E63',
                color2: '#C2185B',
                blocks: [
                    {
                        opcode: 'fixMIMEType',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '修复 Data URL 的真实文件类型 [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'data:image/jpeg;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+'
                            }
                        }
                    },
                    {
                        opcode: 'detectMIMEType',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '检测 Data URL 的真实类型 [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'data:image/jpeg;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+'
                            }
                        }
                    },
                    {
                        opcode: 'isMIMECorrect',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Data URL 类型是否正确？ [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+'
                            }
                        }
                    },
                    {
                        opcode: 'normalizeSVG',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '标准化 SVG Data URL [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'data:image/png;base64,PHN2ZyB3aWR0aD0iMTAwIj48L3N2Zz4='
                            }
                        }
                    }
                ]
            };
        }

        /**
         * 判断一段字符串解码后是否是 SVG 内容
         * 处理各种前缀：XML声明、DOCTYPE、注释、空行等
         */
        isSVGContent(decodedText) {
            if (!decodedText) return false;

            // 去除 BOM、空白、注释后检查
            let cleaned = decodedText.trim();

            // 跳过 XML 声明 <?xml version="1.0"?>
            cleaned = cleaned.replace(/^<\?xml[^>]*>/i, '').trim();
            // 跳过 DOCTYPE
            cleaned = cleaned.replace(/^<!DOCTYPE[^>]*>/i, '').trim();
            // 跳过注释 <!-- ... -->
            while (cleaned.startsWith('<!--')) {
                const endIdx = cleaned.indexOf('-->');
                if (endIdx === -1) break;
                cleaned = cleaned.substring(endIdx + 3).trim();
            }

            // 最终判断是否以 <svg 开头
            return /^<svg[\s>]/i.test(cleaned);
        }

        /**
         * 核心：通过 Magic Number + 内容特征检测真实 MIME 类型
         */
        detectRealMIME(base64Data, rawData, isBase64) {
            const head = base64Data ? base64Data.substring(0, 64) : '';

            // ===== SVG 专项检测（放在前面，优先级高）=====
            if (isBase64) {
                // 常见 SVG base64 前缀：
                // PHN2Zw == <svg
                // PD94bWw == <?xm  (<?xml version="1.0"?><svg...)
                // PCEtLQ == <!--   (注释开头的 SVG)
                if (head.startsWith('PHN2Zw') || head.startsWith('PD94bWw')) {
                    return 'image/svg+xml';
                }
                // 处理有注释前缀的 SVG
                if (head.startsWith('PCEtLQ')) {
                    try {
                        const decoded = atob(base64Data.substring(0, 200));
                        if (this.isSVGContent(decoded)) {
                            return 'image/svg+xml';
                        }
                    } catch(e) {}
                }
                // 通用：解码后检查内容
                try {
                    const decoded = atob(base64Data.substring(0, 500));
                    if (this.isSVGContent(decoded)) {
                        return 'image/svg+xml';
                    }
                } catch(e) {}
            } else {
                // 非 base64 的 inline SVG
                if (this.isSVGContent(rawData)) {
                    return 'image/svg+xml';
                }
            }

            // ===== 图片类型 =====
            if (head.startsWith('iVBORw0KGgo')) return 'image/png';
            if (head.startsWith('/9j/')) return 'image/jpeg';
            if (head.startsWith('R0lGOD')) return 'image/gif';
            if (head.startsWith('UklGR')) {
                try {
                    const riffType = atob(head.substring(0, 16));
                    if (riffType.indexOf('WEBP') !== -1) return 'image/webp';
                    if (riffType.indexOf('WAVE') !== -1) return 'audio/wav';
                } catch(e) {}
            }
            if (head.startsWith('Qk')) return 'image/bmp';
            if (head.startsWith('AAABAA')) return 'image/x-icon';

            // ===== 音频/视频 =====
            if (head.startsWith('SUQz') || head.startsWith('SUQy')) return 'audio/mpeg';
            if (head.startsWith('T2dnUw')) return 'audio/ogg';
            if (head.indexOf('Zml0eX') !== -1 || head.indexOf('ZnR5c') !== -1) return 'video/mp4';

            // ===== 文档 =====
            if (head.startsWith('JVBER')) return 'application/pdf';
            if (head.startsWith('UEsDB')) return 'application/zip';
            if (head.startsWith('UmFyIQ')) return 'application/vnd.rar';
            if (head.startsWith('N3q8')) return 'application/x-7z-compressed';

            // ===== 文本/JSON =====
            try {
                const sample = isBase64 ? atob(head.substring(0, 60)) : rawData.substring(0, 60);
                const trimmed = sample.trimStart();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'application/json';
            } catch(e) {}

            return null;
        }

        extractDeclaredMIME(dataURL) {
            const match = dataURL.match(/^data:([^;,]+)/);
            return match ? match[1].toLowerCase() : null;
        }

        extractBase64Data(dataURL) {
            const commaIdx = dataURL.indexOf(',');
            if (commaIdx === -1) return null;
            return dataURL.substring(commaIdx + 1);
        }

        /**
         * 积木1：修复类型
         */
        fixMIMEType(args) {
            let url = String(args.URL || '').trim();
            if (!url || !url.startsWith('data:')) return url;

            const isBase64 = url.indexOf(';base64') !== -1;
            const commaIdx = url.indexOf(',');
            if (commaIdx === -1) return url;

            const dataPart = url.substring(commaIdx + 1);
            const base64Head = isBase64 ? dataPart.replace(/\s/g, '').substring(0, 200) : null;

            const realMIME = this.detectRealMIME(
                base64Head,
                isBase64 ? null : decodeURIComponent(dataPart),
                isBase64
            );

            if (!realMIME) return url;

            const declaredMIME = this.extractDeclaredMIME(url);
            if (declaredMIME && declaredMIME === realMIME) return url;

            // 修复标头
            return url.replace(/^data:[^;,]+/, `data:${realMIME}`);
        }

        /**
         * 积木2：检测真实类型
         */
        detectMIMEType(args) {
            let url = String(args.URL || '').trim();
            if (!url.startsWith('data:')) return '';

            const isBase64 = url.indexOf(';base64') !== -1;
            const commaIdx = url.indexOf(',');
            if (commaIdx === -1) return '';

            const dataPart = url.substring(commaIdx + 1);
            const base64Head = isBase64 ? dataPart.replace(/\s/g, '').substring(0, 200) : null;

            const realMIME = this.detectRealMIME(
                base64Head,
                isBase64 ? null : decodeURIComponent(dataPart),
                isBase64
            );

            return realMIME || '未知类型';
        }

        /**
         * 积木3：类型是否正确
         */
        isMIMECorrect(args) {
            let url = String(args.URL || '').trim();
            if (!url.startsWith('data:')) return false;

            const isBase64 = url.indexOf(';base64') !== -1;
            const commaIdx = url.indexOf(',');
            if (commaIdx === -1) return false;

            const dataPart = url.substring(commaIdx + 1);
            const base64Head = isBase64 ? dataPart.replace(/\s/g, '').substring(0, 200) : null;

            const realMIME = this.detectRealMIME(
                base64Head,
                isBase64 ? null : decodeURIComponent(dataPart),
                isBase64
            );

            if (!realMIME) return true;

            const declaredMIME = this.extractDeclaredMIME(url);
            return declaredMIME === realMIME;
        }

        /**
         * 积木4：SVG 专项标准化
         * 无论输入是什么，都输出一个干净的 SVG Data URL
         */
        normalizeSVG(args) {
            let url = String(args.URL || '').trim();

            // 如果不是 Data URL，尝试把它当 SVG 文本处理
            if (!url.startsWith('data:')) {
                if (this.isSVGContent(url)) {
                    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(url.trim());
                }
                return url;
            }

            const isBase64 = url.indexOf(';base64') !== -1;
            const commaIdx = url.indexOf(',');
            if (commaIdx === -1) return url;

            const dataPart = url.substring(commaIdx + 1);

            let svgText;
            if (isBase64) {
                try {
                    svgText = atob(dataPart.replace(/\s/g, ''));
                } catch(e) {
                    return url; // 解码失败，原样返回
                }
            } else {
                svgText = decodeURIComponent(dataPart);
            }

            // 验证确实是 SVG
            if (!this.isSVGContent(svgText)) {
                return url; // 不是 SVG，不处理
            }

            // 标准化输出：用 base64 编码，确保兼容性最好
            const cleanBase64 = btoa(unescape(encodeURIComponent(svgText.trim())));
            return `data:image/svg+xml;base64,${cleanBase64}`;
        }
    }

    Scratch.extensions.register(new DataURLMIMEFixer());

})(Scratch);