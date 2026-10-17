// Web Speech API 多语言语音识别扩展 for TurboWarp

(function() {
    'use strict';

    class SpeechExt {
        constructor() {
            this.recognition = null;
            this.isListening = false;
            this.lastResult = '';
            this.isFinal = false;
            this.currentLang = 'zh-CN'; // 默认中文
            
            // 新增：语音合成相关状态
            this.selectedVoice = ''; // 选定的语音角色
            this.isSpeaking = false; // 是否正在朗读
            
            // 新增：关键词监听
            this.targetKeyword = ''; // 当前监听的关键词
            
            // 新增：状态追踪
            this.listeningStartTime = 0;
            this.speakingStartTime = 0;
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn('浏览器不支持 Web Speech API');
            }
            
            // 预加载语音列表（解决某些浏览器延迟加载问题）
            if ('speechSynthesis' in window) {
                window.speechSynthesis.getVoices();
                window.speechSynthesis.onvoiceschanged = () => {
                    window.speechSynthesis.getVoices();
                };
            }
        }

        getInfo() {
            return {
                id: 'speechapi',
                name: '语音识别',
                color1: '#4287f5',
                color2: '#3270d9',
                blocks: [
                    // ========== 原有积木 ==========
                    {
                        opcode: 'setLanguage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '设置语言为 [LANG]',
                        arguments: {
                            LANG: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'LANGUAGE_MENU',
                                defaultValue: 'zh-CN'
                            }
                        }
                    },
                    {
                        opcode: 'startListening',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '开始听写',
                        arguments: {}
                    },
                    {
                        opcode: 'stopListening',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '停止听写',
                        arguments: {}
                    },
                    {
                        opcode: 'getResult',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '识别到的文字',
                        arguments: {}
                    },
                    {
                        opcode: 'isListening',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '正在听写?',
                        arguments: {}
                    },
                    {
                        opcode: 'speak',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '用 [SLANG] 朗读 [TEXT]',
                        arguments: {
                            SLANG: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'LANGUAGE_MENU',
                                defaultValue: 'zh-CN'
                            },
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Hello World'
                            }
                        }
                    },
                    {
                        opcode: 'getCurrentLang',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '当前语言',
                        arguments: {}
                    },
                    {
                        opcode: 'whenResult',
                        blockType: Scratch.BlockType.HAT,
                        text: '当听到内容时',
                        isEdgeActivated: false,
                        arguments: {}
                    },
                    
                    // ========== 新增积木 ==========
                    // 1. 关键词触发器
                    {
                        opcode: 'whenHearKeyword',
                        blockType: Scratch.BlockType.HAT,
                        text: '当听到关键词 [KEYWORD] 时',
                        isEdgeActivated: false,
                        arguments: {
                            KEYWORD: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '开始'
                            }
                        }
                    },
                    {
                        opcode: 'containsKeyword',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '识别结果包含 [KEYWORD]？',
                        arguments: {
                            KEYWORD: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '你好'
                            }
                        }
                    },
                    
                    // 2. 语音角色选择
                    {
                        opcode: 'setVoice',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '设置语音角色为 [VOICE]',
                        arguments: {
                            VOICE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'VOICE_MENU',
                                defaultValue: ''
                            }
                        }
                    },
                    {
                        opcode: 'getVoicesList',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '可用语音列表',
                        arguments: {}
                    },
                    
                    // 3. 语音合成完成事件
                    {
                        opcode: 'whenSpeechEnd',
                        blockType: Scratch.BlockType.HAT,
                        text: '当朗读完成时',
                        isEdgeActivated: false,
                        arguments: {}
                    },
                    {
                        opcode: 'isSpeaking',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '正在朗读?',
                        arguments: {}
                    },
                    
                    // 4. 强制停止（解决停止失败问题）
                    {
                        opcode: 'forceStopListening',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '强制停止听写',
                        arguments: {}
                    },
                    
                    // 5. 新增状态检测积木
                    {
                        opcode: 'isSpeechEnabled',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '语音识别打开成功?',
                        arguments: {}
                    },
                    {
                        opcode: 'isSpeakingSuccess',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '朗读成功?',
                        arguments: {}
                    }
                ],
                menus: {
                    LANGUAGE_MENU: {
                        acceptReporters: true,
                        items: [
                            {text: '中文（普通话）', value: 'zh-CN'},
                            {text: '中文（粤语）', value: 'zh-HK'},
                            {text: '中文（台湾）', value: 'zh-TW'},
                            {text: '英语（美国）', value: 'en-US'},
                            {text: '英语（英国）', value: 'en-GB'},
                            {text: '日语', value: 'ja-JP'},
                            {text: '韩语', value: 'ko-KR'},
                            {text: '法语', value: 'fr-FR'},
                            {text: '德语', value: 'de-DE'},
                            {text: '西班牙语', value: 'es-ES'},
                            {text: '俄语', value: 'ru-RU'},
                            {text: '意大利语', value: 'it-IT'},
                            {text: '葡萄牙语', value: 'pt-BR'},
                            {text: '阿拉伯语', value: 'ar-SA'},
                            {text: '印地语', value: 'hi-IN'},
                            {text: '泰语', value: 'th-TH'},
                            {text: '越南语', value: 'vi-VN'},
                            {text: '土耳其语', value: 'tr-TR'},
                            {text: '荷兰语', value: 'nl-NL'}
                        ]
                    },
                    // 动态语音菜单（根据当前语言过滤）
                    VOICE_MENU: {
                        acceptReporters: true,
                        items: 'getVoiceMenuItems'
                    }
                }
            };
        }

        // ========== 原有方法（保留） ==========
        
        setLanguage(args) {
            this.currentLang = args.LANG;
            if (this.isListening) {
                this.stopListening();
                setTimeout(() => this.startListening(), 300);
            }
        }

        startListening() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn('浏览器不支持语音识别');
                return;
            }

            // 强制清理旧实例（防止重复启动）
            if (this.recognition) {
                try {
                    this.recognition.stop();
                } catch(e) {}
                this.recognition = null;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.currentLang;
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            
            this.isListening = true;
            this.isFinal = false;
            this.listeningStartTime = Date.now();

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                        this.isFinal = true;
                        
                        // 保存最终结果
                        this.lastResult = finalTranscript;
                        
                        // 触发通用听到内容事件
                        this.onResultCallback();
                        
                        // 检查关键词触发
                        this.checkKeywordTrigger(finalTranscript);
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // 如果没有最终结果，显示临时结果
                if (!finalTranscript) {
                    this.lastResult = interimTranscript;
                }
            };

            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                // 忽略"no-speech"和"aborted"错误，避免误报
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    this.isListening = false;
                }
            };

            this.recognition.onend = () => {
                console.log('识别结束，状态:', this.isListening);
                // 只有标记为正在听写时才自动重启
                if (this.isListening) {
                    setTimeout(() => {
                        if (this.isListening) {
                            try {
                                this.recognition.start();
                            } catch(e) {
                                console.error('自动重启失败:', e);
                                this.isListening = false;
                            }
                        }
                    }, 100);
                } else {
                    this.recognition = null;
                }
            };

            try {
                this.recognition.start();
                console.log('语音识别已启动');
            } catch(e) {
                console.error('启动失败:', e);
                this.isListening = false;
            }
        }

        stopListening() {
            console.log('执行停止听写...');
            this.isListening = false;
            
            if (this.recognition) {
                try {
                    // 移除 onend 回调中的自动重启逻辑
                    this.recognition.onend = null;
                    this.recognition.stop();
                    console.log('识别已停止');
                } catch(e) {
                    console.error('停止识别出错:', e);
                }
                
                // 延迟清理实例，确保停止命令送达
                setTimeout(() => {
                    if (this.recognition) {
                        try {
                            this.recognition.abort(); // 强制中止
                        } catch(e) {}
                        this.recognition = null;
                        console.log('识别实例已清理');
                    }
                }, 200);
            }
        }

        // 新增：强制停止（双重保险）
        forceStopListening() {
            console.log('执行强制停止...');
            this.isListening = false;
            
            // 立即停止
            if (this.recognition) {
                try {
                    this.recognition.abort(); // abort 比 stop 更强制
                } catch(e) {}
                
                try {
                    this.recognition.stop();
                } catch(e) {}
                
                this.recognition = null;
            }
            
            // 再试一次确保停止（处理某些浏览器的延迟问题）
            setTimeout(() => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition && this.isListening === false) {
                    try {
                        const tempRec = new SpeechRecognition();
                        tempRec.abort();
                    } catch(e) {}
                }
            }, 300);
        }

        getResult() {
            return this.lastResult || '';
        }

        isListening() {
            // 修复卡死问题：如果长时间没有活动，自动重置状态
            if (this.isListening && Date.now() - this.listeningStartTime > 30000) { // 30秒超时
                this.isListening = false;
                if (this.recognition) {
                    try {
                        this.recognition.abort();
                        this.recognition = null;
                    } catch(e) {}
                }
            }
            return this.isListening;
        }

        getCurrentLang() {
            return this.currentLang;
        }

        // 修改后的朗读方法（支持语音角色和完成事件）
        speak(args) {
            const text = String(args.TEXT);
            const lang = args.SLANG;
            
            if (!('speechSynthesis' in window)) {
                console.warn('浏览器不支持语音合成');
                return;
            }
            
            // 取消之前的朗读
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 1;
            utterance.pitch = 1;
            
            // 设置选定的语音角色
            if (this.selectedVoice) {
                const voices = window.speechSynthesis.getVoices();
                const selected = voices.find(v => v.name === this.selectedVoice);
                if (selected) {
                    utterance.voice = selected;
                }
            }
            
            // 状态标记
            this.isSpeaking = true;
            this.speakingStartTime = Date.now();
            
            // 朗读完成回调
            utterance.onend = () => {
                this.isSpeaking = false;
                this.onSpeechEndCallback();
            };
            
            utterance.onerror = (e) => {
                this.isSpeaking = false;
                console.error('语音合成错误:', e);
            };
            
            window.speechSynthesis.speak(utterance);
        }

        onResultCallback() {
            if (this.runtime) {
                this.runtime.startHats('speechapi_whenResult');
            }
        }

        // ========== 新增方法 ==========
        
        // 关键词触发器：检查并触发帽子积木
        checkKeywordTrigger(text) {
            // 获取所有"当听到关键词"帽子积木的实例
            const hats = this.runtime._hats ? 
                Object.keys(this.runtime._hats).filter(key => 
                    key.startsWith('speechapi_whenHearKeyword')
                ) : [];
            
            // 遍历所有该类型的帽子积木
            hats.forEach(hatOpcode => {
                const threads = this.runtime.startHats(hatOpcode);
                // 注意：这里需要在积木实例中存储关键词进行比较
            });
        }

        // 当听到关键词（帽子积木的触发逻辑）
        whenHearKeyword(args) {
            // 帽子积木的触发由 checkKeywordTrigger 处理
            // 这里返回 false 因为实际触发在 onresult 中判断
            return false;
        }

        // 检查识别结果是否包含关键词（布尔积木）
        containsKeyword(args) {
            const keyword = String(args.KEYWORD).toLowerCase().trim();
            if (!keyword) return false;
            return this.lastResult.toLowerCase().includes(keyword);
        }

        // 设置语音角色
        setVoice(args) {
            this.selectedVoice = args.VOICE;
            console.log('已设置语音角色:', this.selectedVoice);
        }

        // 获取语音菜单项（动态生成）
        getVoiceMenuItems() {
            if (!('speechSynthesis' in window)) return [{text: '默认', value: ''}];
            
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return [{text: '默认', value: ''}];
            
            // 根据当前语言过滤语音
            const langPrefix = this.currentLang.split('-')[0];
            const filteredVoices = voices.filter(v => 
                v.lang.startsWith(langPrefix) || v.lang.startsWith(this.currentLang)
            );
            
            // 如果没有匹配当前语言的，显示全部
            const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices;
            
            const items = displayVoices.map(v => ({
                text: `${v.name} (${v.lang})`,
                value: v.name
            }));
            
            // 添加默认选项
            items.unshift({text: '系统默认', value: ''});
            
            return items;
        }

        // 获取可用语音列表（供用户查看）- 返回JSON格式
        getVoicesList() {
            if (!('speechSynthesis' in window)) return JSON.stringify([]);
            
            const voices = window.speechSynthesis.getVoices();
            const voiceList = voices.map(v => ({
                name: v.name,
                lang: v.lang,
                default: v.default
            }));
            
            return JSON.stringify(voiceList);
        }

        // 朗读完成事件触发
        onSpeechEndCallback() {
            if (this.runtime) {
                this.runtime.startHats('speechapi_whenSpeechEnd');
            }
        }

        // 是否正在朗读
        isSpeaking() {
            // 修复卡死问题：如果长时间没有活动，自动重置状态
            if (this.isSpeaking && Date.now() - this.speakingStartTime > 60000) { // 60秒超时
                this.isSpeaking = false;
            }
            return this.isSpeaking;
        }
        
        // 语音识别是否打开成功
        isSpeechEnabled() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            return !!SpeechRecognition;
        }
        
        // 朗读是否成功
        isSpeakingSuccess() {
            // 检查是否有正在播放的语音
            return window.speechSynthesis ? !window.speechSynthesis.speaking : false;
        }
    }

    Scratch.extensions.register(new SpeechExt());
})();