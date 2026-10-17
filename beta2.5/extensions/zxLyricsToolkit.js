(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('zx的歌词处理扩展 必须以 unsandboxed 模式运行');
    }

    // 扩展图标（音符样式内联 SVG）
    const blockIcon = 'data:image/svg+xml;base64,' + btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">' +
        '<rect x="2" y="2" width="56" height="56" rx="12" fill="#5B3FD6"/>' +
        '<path d="M38 14v20.5a6.5 6.5 0 1 1-4-5.96V20l-12 3v16.5a6.5 6.5 0 1 1-4-5.96V16l20-5z" fill="#fff"/>' +
        '<text x="30" y="52" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif">zx</text>' +
        '</svg>'
    );

    // 歌词数据获取接口（沿用原扩展的公开接口）
    function fetchLyricJson(ID) {
        return fetch('https://apis.netstart.cn/music/lyric?id=' + ID)
            .then(r => r.text())
            .catch(() => '');
    }

    // ================= 通用解析辅助函数 =================

    // 把秒数格式化为 LRC 的 "mm:ss.xx"
    function formatTime(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = sec - m * 60;
        const ss = Math.floor(s);
        const cs = Math.round((s - ss) * 100);
        const pad = n => String(n).padStart(2, '0');
        return pad(m) + ':' + pad(ss) + '.' + pad(cs % 100);
    }

    // 把 hh:mm:ss.cc / hh:mm:ss,mmm / hh:mm:ss.mmm / mm:ss 都转成秒
    function clockToSeconds(str) {
        const parts = String(str).trim().split(':');
        if (parts.length === 3) {
            const h = parseFloat(parts[0]);
            const m = parseFloat(parts[1]);
            const s = parseFloat(parts[2].replace(',', '.'));
            return h * 3600 + m * 60 + s;
        }
        if (parts.length === 2) {
            return parseFloat(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
        }
        return parseFloat(String(str).replace(',', '.')) || 0;
    }

    // 解析 LRC：支持一行多个时间戳，返回 [{time,text}]，忽略 [ti:][ar:] 等元信息行
    function parseLRC(text) {
        const arr = [];
        const lines = String(text || '').split(/\r?\n/);
        for (const line of lines) {
            const stamps = [];
            const re = /\[(\d+):([\d.]+)\]/g;
            let mm;
            while ((mm = re.exec(line)) !== null) {
                stamps.push(parseFloat(mm[1]) * 60 + parseFloat(mm[2]));
            }
            if (stamps.length === 0) continue;
            const content = line.replace(/\[[^\]]*\]/g, '').trim();
            for (const t of stamps) arr.push({ time: t, text: content });
        }
        return arr;
    }

    // 解析 SRT
    function parseSRT(text) {
        const arr = [];
        const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/);
        for (const b of blocks) {
            const m = b.match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
            if (!m) continue;
            const start = clockToSeconds(m[1]);
            const after = b.slice(m.index + m[0].length).replace(/^\s+/, '').split('\n');
            const content = after.filter(l => l.trim() !== '')
                .map(l => l.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim())
                .join(' ');
            arr.push({ time: start, text: content });
        }
        return arr;
    }

    // 解析 VTT / WebVTT
    function parseVTT(text) {
        const arr = [];
        const lines = String(text || '').replace(/\r/g, '').split('\n');
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}|\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})/);
            if (!m) continue;
            const start = clockToSeconds(m[1]);
            let content = '';
            for (let j = i + 1; j < lines.length && lines[j].trim() !== '' && !/-->\s*$/.test(lines[j]); j++) {
                content += (content ? ' ' : '') + lines[j].replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim();
            }
            arr.push({ time: start, text: content.trim() });
        }
        return arr;
    }

    // 解析 ASS / SSA
    function parseASS(text) {
        const arr = [];
        const lines = String(text || '').replace(/\r/g, '').split('\n');
        let fmtIndex = null;
        for (const line of lines) {
            if (/^Format:/i.test(line) && /Start/i.test(line)) {
                const cols = line.slice(line.indexOf(':') + 1).split(',').map(s => s.trim());
                fmtIndex = { start: cols.indexOf('Start'), text: cols.indexOf('Text') };
            }
            if (/^Dialogue:/i.test(line)) {
                const body = line.slice(line.indexOf(':') + 1);
                const cols = body.split(',');
                let si = fmtIndex && fmtIndex.start >= 0 ? fmtIndex.start : 1;
                let ti = fmtIndex && fmtIndex.text >= 0 ? fmtIndex.text : 9;
                if (cols.length <= ti) { si = 1; ti = 9; }
                const start = clockToSeconds(cols[si]);
                const content = cols.slice(ti).join(',').replace(/\{[^}]*\}/g, '').replace(/\\N/gi, ' ').trim();
                if (content) arr.push({ time: start, text: content });
            }
        }
        return arr;
    }

    // 自动嗅探格式并解析，format 传 "自动" 时按特征判定
    function parseSubtitle(text, format) {
        const t = String(text || '');
        let fmt = (format || '自动').toLowerCase();
        if (fmt === '自动' || fmt === 'auto' || fmt === '') {
            if (/^Dialogue:/im.test(t) || /\[Script Info\]/i.test(t)) fmt = 'ass';
            else if (/-->/.test(t)) fmt = /,/.test(t.match(/\d{1,2}:\d{2}:\d{2}(?:[,.]\d+)?/) ? t.match(/\d{1,2}:\d{2}:\d{2}([,.])\d/)[1] : '.') ? 'srt' : 'vtt';
            else if (/\[\d+:[\d.]+\]/.test(t)) fmt = 'lrc';
            else fmt = 'plain';
        }
        if (fmt.indexOf('srt') >= 0) return parseSRT(t);
        if (fmt.indexOf('ass') >= 0 || fmt.indexOf('ssa') >= 0) return parseASS(t);
        if (fmt.indexOf('vtt') >= 0) return parseVTT(t);
        if (fmt.indexOf('lrc') >= 0) return parseLRC(t);
        return t.split(/\r?\n/).filter(l => l.trim() !== '').map(l => ({ time: 0, text: l.trim() }));
    }

    // 把归一化数组重新输出为标准 LRC 文本（按时间升序）
    function toLRC(arr) {
        return arr.slice().sort((a, b) => a.time - b.time)
            .map(o => '[' + formatTime(o.time) + ']' + o.text)
            .join('\n');
    }

    // ================= 智能文本解码（防乱码） =================
    // 先按 BOM 判定，再严格校验 UTF-8，失败后逐个回退候选编码，尽量还原正确文本
    function smartDecode(buffer) {
        const bytes = new Uint8Array(buffer);
        const len = bytes.length;
        // 1. BOM 判定
        if (len >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
            return { text: new TextDecoder('utf-8').decode(bytes.subarray(3)), enc: 'UTF-8(BOM)' };
        }
        if (len >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE &&
            !(len >= 4 && bytes[2] === 0x00 && bytes[3] === 0x00)) {
            return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), enc: 'UTF-16LE' };
        }
        if (len >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
            return { text: new TextDecoder('utf-16be').decode(bytes.subarray(2)), enc: 'UTF-16BE' };
        }
        if (len >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0xFE && bytes[3] === 0xFF) {
            return { text: new TextDecoder('utf-32le').decode(bytes.subarray(4)), enc: 'UTF-32' };
        }
        // 2. 无 BOM：严格校验 UTF-8（fatal 模式，非法字节即报错）
        try {
            const t = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            return { text: t, enc: 'UTF-8' };
        } catch (e) { /* 不是合法 UTF-8，继续回退 */ }
        // 3. 依次尝试常见中文/日文编码，替换字符（U+FFFD）越少越可信
        const candidates = ['gb18030', 'big5', 'shift_jis', 'windows-1252'];
        let best = null, bestBad = Infinity;
        for (const enc of candidates) {
            try {
                const t = new TextDecoder(enc).decode(bytes);
                const bad = (t.match(/\uFFFD/g) || []).length;
                if (bad < bestBad) { bestBad = bad; best = { text: t, enc: enc }; }
                if (bad === 0) break;
            } catch (e) { /* 该编码不支持则跳过 */ }
        }
        if (best) return best;
        // 4. 最后兜底 latin1（单字节永不报错）
        return { text: new TextDecoder('windows-1252').decode(bytes), enc: 'windows-1252' };
    }

    // 指定编码解码（用户强制选编码时）
    function decodeWith(buffer, enc) {
        try {
            return new TextDecoder(enc).decode(buffer);
        } catch (e) {
            return smartDecode(buffer).text;
        }
    }

    class ZxLyrics {
        constructor(runtime) {
            this.runtime = runtime;
        }

        getInfo() {
            return {
                id: 'zxLyricsToolkit',
                name: 'zx的歌词处理扩展',
                color1: '#5B3FD6',
                color2: '#7A5CF0',
                color3: '#3B2A9E',
                blockIconURI: blockIcon,
                menus: {
                    lyricFormat: {
                        acceptReporters: true,
                        items: ['自动', 'LRC', 'SRT', 'ASS/SSA', 'VTT', '纯文本']
                    },
                    metaField: {
                        acceptReporters: true,
                        items: ['标题', '歌手', '专辑', '制作人', '全部']
                    },
                    splitBy: {
                        acceptReporters: true,
                        items: ['换行', '标点', '逗号', '句号', '问号', '感叹号']
                    },
                    fileMode: {
                        acceptReporters: false,
                        items: ['智能文本', 'UTF-8', 'GBK/GB18030', 'Big5', 'Shift_JIS', 'UTF-16', 'DataURL(二进制)']
                    }
                },
                blocks: [
                    // ===== 一、歌词数据获取（移植自原扩展） =====
                    { blockType: Scratch.BlockType.LABEL, text: '一、歌词数据获取（移植）' },
                    {
                        opcode: 'GetOnlineLyric',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '网易云歌曲 [ID] 的歌词',
                        tooltip: '按歌曲 ID 获取原版 LRC 歌词',
                        arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '1365746746' } }
                    },
                    {
                        opcode: 'GetOnlineTranslatedLyric',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '网易云歌曲 [ID] 的翻译歌词',
                        tooltip: '按歌曲 ID 获取翻译歌词(tlyric)',
                        arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '1365746746' } }
                    },
                    {
                        opcode: 'GetOnlineLyricJson',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '网易云歌曲 [ID] 的所有歌词数据(JSON)',
                        tooltip: '返回歌词接口的完整 JSON',
                        arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '1365746746' } }
                    },

                    // ===== 二、外部字幕与本地文件读取 =====
                    { blockType: Scratch.BlockType.LABEL, text: '二、外部字幕 / 本地文件读取' },
                    {
                        opcode: 'ParseSubtitle',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '按 [format] 解析字幕 [subtitleText] 为标准LRC',
                        tooltip: '新增1：把 SRT/VTT/ASS/纯文本 等统一归一化成标准 LRC，供后续积木使用',
                        arguments: {
                            subtitleText: { type: Scratch.ArgumentType.STRING, defaultValue: '00:00:04,000 --> 00:00:07,000\n第一句歌词' },
                            format: { type: Scratch.ArgumentType.STRING, menu: 'lyricFormat', defaultValue: '自动' }
                        }
                    },
                    {
                        opcode: 'OpenFile',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '打开本地文件 以 [mode] 读取',
                        tooltip: '调用浏览器文件选择框打开本地文件。智能文本模式先判 BOM，再严格校验 UTF-8，失败自动按 GB18030/Big5/Shift_JIS 逐个兜底，解决多种乱码。DataURL 模式返回 data:URL。',
                        arguments: {
                            mode: { type: Scratch.ArgumentType.STRING, menu: 'fileMode', defaultValue: '智能文本' }
                        }
                    },

                    // ===== 三、基础查询（移植自原扩展） =====
                    { blockType: Scratch.BlockType.LABEL, text: '三、基础查询（移植）' },
                    {
                        opcode: 'GetCurrentTimeLyrics',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [currentTime] 秒时显示的歌词',
                        tooltip: '返回某时刻对应的当前歌词文本（自动兼容多格式）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'GetLyricsLineFromTime',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [currentTime] 秒时是第几行',
                        tooltip: '返回某时刻对应的歌词行号（从1开始）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'GetTimeFromLyricsLine',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 第 [linenumber] 行是第几秒',
                        tooltip: '返回某歌词行对应的时间戳（秒）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            linenumber: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },

                    // ===== 四、区间与取行 =====
                    { blockType: Scratch.BlockType.LABEL, text: '四、区间与取行（新增）' },
                    {
                        opcode: 'GetLyricsByLineRange',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 第 [startLine] 行到第 [endLine] 行的文本',
                        tooltip: '新增2：按行号区间取歌词（换行连接）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            startLine: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            endLine: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 }
                        }
                    },
                    {
                        opcode: 'GetLyricsByTimeRange',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [startTime] 秒到 [endTime] 秒之间的歌词',
                        tooltip: '新增2：按时间区间取歌词（换行连接）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            startTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
                            endTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 30 }
                        }
                    },
                    {
                        opcode: 'GetLineText',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 第 [linenumber] 行的纯文本',
                        tooltip: '新增3：取指定行的纯文本（去掉时间标签）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            linenumber: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },

                    // ===== 五、逐字卡拉OK与双语对照 =====
                    { blockType: Scratch.BlockType.LABEL, text: '五、逐字卡拉OK / 双语对照（新增）' },
                    {
                        opcode: 'GetKaraokeCharIndex',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [currentTime] 秒时当前句已唱到第几个字',
                        tooltip: '新增4：按句时长对字符均分插值，估算逐字高亮进度',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'GetKaraokeText',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [currentTime] 秒时已唱出的文本',
                        tooltip: '新增4：返回当前句已唱出部分（未唱部分在第二行，用换行分隔）',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'MergeBilingual',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '原文 [original] 与译文 [translated] 按时间对照',
                        tooltip: '新增5：按时间戳把原文与翻译对齐合并为“原句 ||| 译句”逐行',
                        arguments: {
                            original: { type: Scratch.ArgumentType.STRING, defaultValue: '[00:12.00]hello' },
                            translated: { type: Scratch.ArgumentType.STRING, defaultValue: '[00:12.00]你好' }
                        }
                    },

                    // ===== 六、时长与播放进度 =====
                    { blockType: Scratch.BlockType.LABEL, text: '六、时长与播放进度（新增）' },
                    {
                        opcode: 'GetLineDuration',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 第 [linenumber] 行的持续时长(秒)',
                        tooltip: '新增6：该行开始到下一行开始之间的时间差',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            linenumber: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'GetCurrentLineProgress',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 在 [currentTime] 秒时当前句进度(百分比)',
                        tooltip: '新增6：返回当前句已播放的百分比(0~100)',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },

                    // ===== 七、检索与元信息 =====
                    { blockType: Scratch.BlockType.LABEL, text: '七、检索与元信息（新增）' },
                    {
                        opcode: 'SearchKeywordLine',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '在 [lyricsText] 中查找 [keyword] 所在行号',
                        tooltip: '新增7：返回关键词首次出现的行号(从1开始)，找不到返回0',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            keyword: { type: Scratch.ArgumentType.STRING, defaultValue: '关键词' }
                        }
                    },
                    {
                        opcode: 'SearchKeywordTime',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '在 [lyricsText] 中查找 [keyword] 出现的时间(秒)',
                        tooltip: '新增7：返回关键词首次出现对应的时间戳(秒)',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            keyword: { type: Scratch.ArgumentType.STRING, defaultValue: '关键词' }
                        }
                    },
                    {
                        opcode: 'TotalLines',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 的歌词总行数',
                        tooltip: '新增8：统计带时间戳的歌词行总数',
                        arguments: { lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' } }
                    },
                    {
                        opcode: 'ParseMeta',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[lyricsText] 的元信息 [field]',
                        tooltip: '新增9：解析 LRC 头部 [ti:]标题 [ar:]歌手 [al:]专辑 [by:]制作人',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '[ti:歌名]\n[ar:歌手]\n[al:专辑]\n[00:00.00]正文' },
                            field: { type: Scratch.ArgumentType.STRING, menu: 'metaField', defaultValue: '标题' }
                        }
                    },

                    // ===== 八、时间校正与纯文本处理 =====
                    { blockType: Scratch.BlockType.LABEL, text: '八、时间校正 / 纯文本处理（新增）' },
                    {
                        opcode: 'OffsetLyrics',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '把 [lyricsText] 整体后移 [offsetSeconds] 秒',
                        tooltip: '新增10：正数=歌词延后，负数=歌词提前，返回校正后的 LRC',
                        arguments: {
                            lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: '歌词' },
                            offsetSeconds: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'SplitPlainText',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '把纯文本歌词 [text] 按 [by] 拆成行',
                        tooltip: '新增11：将没有 LRC 时间标签的整段歌词拆分为逐行(换行连接)',
                        arguments: {
                            text: { type: Scratch.ArgumentType.STRING, defaultValue: '第一句。第二句！第三句？' },
                            by: { type: Scratch.ArgumentType.STRING, menu: 'splitBy', defaultValue: '标点' }
                        }
                    },
                    {
                        opcode: 'GetPlainSentence',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '纯文本歌词 [text] 按 [by] 拆分的第 [n] 句',
                        tooltip: '新增11：取纯文本歌词拆分后的第 N 句(从1开始)',
                        arguments: {
                            text: { type: Scratch.ArgumentType.STRING, defaultValue: '第一句。第二句！第三句？' },
                            by: { type: Scratch.ArgumentType.STRING, menu: 'splitBy', defaultValue: '标点' },
                            n: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },

                    // ===== 九、时间工具 =====
                    { blockType: Scratch.BlockType.LABEL, text: '九、时间工具（新增）' },
                    {
                        opcode: 'TimeToSeconds',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '把时间 [clock] 转为秒数',
                        tooltip: '把 1:02:03 / 01:35 / 90 等形式的时间统一转换为秒，可直接喂给“在…秒”系列积木',
                        arguments: { clock: { type: Scratch.ArgumentType.STRING, defaultValue: '01:35' } }
                    }
                ]
            };
        }

        // ---------- 一、歌词数据获取 ----------
        GetOnlineLyric(args) {
            return fetchLyricJson(args.ID).then(txt => {
                try { return JSON.parse(txt).lrc.lyric || ''; } catch (e) { return ''; }
            });
        }
        GetOnlineTranslatedLyric(args) {
            return fetchLyricJson(args.ID).then(txt => {
                try { return JSON.parse(txt).tlyric.lyric || ''; } catch (e) { return ''; }
            });
        }
        GetOnlineLyricJson(args) {
            return fetchLyricJson(args.ID);
        }

        // ---------- 二、外部字幕 / 本地文件 ----------
        ParseSubtitle(args) {
            return toLRC(parseSubtitle(args.subtitleText, args.format));
        }
        OpenFile(args) {
            const mode = args.mode || '智能文本';
            return new Promise(resolve => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.lrc,.srt,.vtt,.ass,.ssa,.txt';
                input.onchange = () => {
                    const file = input.files && input.files[0];
                    if (!file) { resolve(''); return; }
                    if (mode === 'DataURL(二进制)') {
                        const fr = new FileReader();
                        fr.onload = () => resolve(String(fr.result));
                        fr.onerror = () => resolve('');
                        fr.readAsDataURL(file);
                        return;
                    }
                    const fr = new FileReader();
                    fr.onload = () => {
                        const buf = fr.result;
                        if (mode === '智能文本') {
                            resolve(smartDecode(buf).text);
                        } else if (mode === 'UTF-8') {
                            resolve(decodeWith(buf, 'utf-8'));
                        } else if (mode === 'GBK/GB18030') {
                            resolve(decodeWith(buf, 'gb18030'));
                        } else if (mode === 'Big5') {
                            resolve(decodeWith(buf, 'big5'));
                        } else if (mode === 'Shift_JIS') {
                            resolve(decodeWith(buf, 'shift_jis'));
                        } else if (mode === 'UTF-16') {
                            resolve(decodeWith(buf, 'utf-16le'));
                        } else {
                            resolve(smartDecode(buf).text);
                        }
                    };
                    fr.onerror = () => resolve('');
                    fr.readAsArrayBuffer(file);
                };
                input.click();
            });
        }

        // ---------- 三、基础查询（移植，统一解析，自动兼容多格式） ----------
        GetCurrentTimeLyrics(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').filter(o => o.text !== '' || o.time > 0).sort((a, b) => a.time - b.time);
            const t = parseFloat(args.currentTime) || 0;
            let result = '';
            for (const o of arr) { if (o.time <= t) result = o.text; else break; }
            return result;
        }
        GetLyricsLineFromTime(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const t = parseFloat(args.currentTime) || 0;
            let idx = 0;
            for (let i = 0; i < arr.length; i++) { if (arr[i].time <= t) idx = i + 1; else break; }
            return idx;
        }
        GetTimeFromLyricsLine(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const n = parseInt(args.linenumber, 10);
            if (isNaN(n) || n < 1 || n > arr.length) return 0;
            return arr[n - 1].time;
        }

        // ---------- 四、区间与取行 ----------
        GetLyricsByLineRange(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            let s = parseInt(args.startLine, 10);
            let e = parseInt(args.endLine, 10);
            if (isNaN(s) || s < 1) s = 1;
            if (isNaN(e) || e > arr.length) e = arr.length;
            if (s > e) return '';
            return arr.slice(s - 1, e).map(o => o.text).filter(t => t !== '').join('\n');
        }
        GetLyricsByTimeRange(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const s = parseFloat(args.startTime) || 0;
            const e = parseFloat(args.endTime) || 0;
            const lo = Math.min(s, e), hi = Math.max(s, e);
            return arr.filter(o => o.time >= lo && o.time <= hi).map(o => o.text).filter(t => t !== '').join('\n');
        }
        GetLineText(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const n = parseInt(args.linenumber, 10);
            if (isNaN(n) || n < 1 || n > arr.length) return '';
            return arr[n - 1].text;
        }

        // ---------- 五、逐字卡拉OK与双语对照 ----------
        GetKaraokeCharIndex(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const t = parseFloat(args.currentTime) || 0;
            let cur = -1;
            for (let i = 0; i < arr.length; i++) { if (arr[i].time <= t) cur = i; else break; }
            if (cur < 0) return 0;
            const text = arr[cur].text;
            const start = arr[cur].time;
            const end = (cur + 1 < arr.length) ? arr[cur + 1].time : start + 4;
            const dur = Math.max(end - start, 0.001);
            const ratio = Math.min(Math.max((t - start) / dur, 0), 1);
            return Math.round(ratio * text.length);
        }
        GetKaraokeText(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const t = parseFloat(args.currentTime) || 0;
            let cur = -1;
            for (let i = 0; i < arr.length; i++) { if (arr[i].time <= t) cur = i; else break; }
            const text = cur < 0 ? '' : arr[cur].text;
            let idx = 0;
            if (cur >= 0) {
                const start = arr[cur].time;
                const end = (cur + 1 < arr.length) ? arr[cur + 1].time : start + 4;
                const dur = Math.max(end - start, 0.001);
                const ratio = Math.min(Math.max((t - start) / dur, 0), 1);
                idx = Math.round(ratio * text.length);
            }
            return text.slice(0, idx) + '\n' + text.slice(idx);
        }
        MergeBilingual(args) {
            const org = parseSubtitle(args.original, '自动').sort((a, b) => a.time - b.time);
            const tra = parseSubtitle(args.translated, '自动').sort((a, b) => a.time - b.time);
            const matchTrans = (t) => {
                let best = '';
                for (const tr of tra) { if (Math.abs(tr.time - t) <= 0.6) { best = tr.text; break; } }
                return best;
            };
            const lines = [];
            for (const o of org) {
                if (o.text === '') continue;
                const tr = matchTrans(o.time);
                lines.push(tr !== '' ? (o.text + ' ||| ' + tr) : o.text);
            }
            return lines.join('\n');
        }

        // ---------- 六、时长与进度 ----------
        GetLineDuration(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const n = parseInt(args.linenumber, 10);
            if (isNaN(n) || n < 1 || n > arr.length) return 0;
            const start = arr[n - 1].time;
            const end = (n < arr.length) ? arr[n].time : start + 4;
            return Math.max(end - start, 0);
        }
        GetCurrentLineProgress(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const t = parseFloat(args.currentTime) || 0;
            let cur = -1;
            for (let i = 0; i < arr.length; i++) { if (arr[i].time <= t) cur = i; else break; }
            if (cur < 0) return 0;
            const start = arr[cur].time;
            const end = (cur + 1 < arr.length) ? arr[cur + 1].time : start + 4;
            const dur = Math.max(end - start, 0.001);
            return Math.round(Math.min(Math.max((t - start) / dur, 0), 1) * 100);
        }

        // ---------- 七、检索与元信息 ----------
        SearchKeywordLine(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const kw = String(args.keyword || '');
            if (kw === '') return 0;
            for (let i = 0; i < arr.length; i++) { if (arr[i].text.indexOf(kw) >= 0) return i + 1; }
            return 0;
        }
        SearchKeywordTime(args) {
            const arr = parseSubtitle(args.lyricsText, '自动').sort((a, b) => a.time - b.time);
            const kw = String(args.keyword || '');
            if (kw === '') return 0;
            for (let i = 0; i < arr.length; i++) { if (arr[i].text.indexOf(kw) >= 0) return arr[i].time; }
            return 0;
        }
        TotalLines(args) {
            return parseSubtitle(args.lyricsText, '自动').length;
        }
        ParseMeta(args) {
            const text = String(args.lyricsText || '');
            const grab = (tag) => {
                const m = text.match(new RegExp('\\[' + tag + ':([^\\]]*)\\]', 'i'));
                return m ? m[1].trim() : '';
            };
            const map = { '标题': grab('ti'), '歌手': grab('ar'), '专辑': grab('al'), '制作人': grab('by') };
            if (args.field === '全部') {
                return '标题:' + map['标题'] + '\n歌手:' + map['歌手'] + '\n专辑:' + map['专辑'] + '\n制作人:' + map['制作人'];
            }
            return map[args.field] || '';
        }

        // ---------- 八、时间校正与纯文本处理 ----------
        OffsetLyrics(args) {
            const arr = parseSubtitle(args.lyricsText, '自动');
            const off = parseFloat(args.offsetSeconds) || 0;
            const shifted = arr.map(o => ({ time: Math.max(o.time + off, 0), text: o.text }));
            return toLRC(shifted);
        }
        SplitPlainText(args) {
            const text = String(args.text || '');
            const by = args.by;
            let arr;
            if (by === '换行') {
                arr = text.split(/\r?\n/).map(s => s.trim()).filter(s => s !== '');
            } else {
                let re;
                if (by === '逗号') re = /[,，]/;
                else if (by === '句号') re = /[。.]/;
                else if (by === '问号') re = /[?？]/;
                else if (by === '感叹号') re = /[!！]/;
                else re = /[,，。.!?？！、;；]/;
                arr = text.split(re).map(s => s.trim()).filter(s => s !== '');
            }
            return arr.join('\n');
        }
        GetPlainSentence(args) {
            const joined = this.SplitPlainText(args);
            const arr = joined.split('\n');
            const n = parseInt(args.n, 10);
            if (isNaN(n) || n < 1 || n > arr.length) return '';
            return arr[n - 1];
        }

        // ---------- 九、时间工具 ----------
        TimeToSeconds(args) {
            return clockToSeconds(args.clock);
        }
    }

    Scratch.extensions.register(new ZxLyrics(Scratch.runtime));
})(Scratch);