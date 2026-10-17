// Name: Enhanced Runtime Options
// ID: enhancedruntimeoptions
// Description: 获取和修改加速模式、帧率、插值、克隆限制、舞台尺寸等，并新增克隆数监控、系统信息等功能。
// License: MIT AND MPL-2.0

(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error("Enhanced Runtime Options extension needs to be run unsandboxed");
    }

    const greenFlagURI =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAABFFBMVEUAAACAgABVqlVJkklAn0BNmTNLljxGlzpDmzdFmjpGmzxHmz9Fmj1FmT5Emj1GmT1GmD1EmDxGmTxEmT1GmjxGmT1FmDxEmT5EmTxGmT5FmD1GmT5FmT1Gmj1EmT5FmT1FmT1FmDxGmT1FmjxLs09LtE9Jr0xJsk1Js05JtVBKtU5KtVBKtlBJrkpJsE1KtlFIrEpIsExLt1FLuFJKuVNIqkhLulNIp0VJqkhKtlJLvVRMvFNFmT5GpUVFmT1HpEVHokNMvlVFmT1Ho0NFmTxLvlVGoUFMvlVLvlVGn0BFmT1Nv1ZEmz5FmTxFmTxFmT1NvlZFmz9FmT5FnT9FnD5GnT9Mv1ZMv1ZMv1ZFmT1Mv1b////70P2GAAAAWXRSTlMAAgMHCAoRFhcwMz0/RkdQVGFmaWpxcnh7gIGEhZKZo6eprLq/v8DAwMDAwMDBwcHCwsPDxcbIysrLzM3Pz9DQ1NTV1dfZ29vg4uXm5+jp6ens7fDx9Pv8/nPb5aAAAAABYktHRFt0vJU0AAAAsUlEQVQoz2NgwA3YhNiwS4hHykoou9goCrKiSUhGhqhZe7gbm3rxQwQ4BJihEupRYODooMDFyMAu6uMsgyoRFW5kHxjkqeuhL4cmAQM4JXRwSWjjktDEJaGFS0IVIeFtZuIaAZdQgUmY2/oqyTu5WcEkNGAS/kJMQJrbySAAJBxmGSoIlYAoYGCR8rPVM7QItuNlQJVgYGDlE5MU5kSErhz2+KCihEikNHYJJh5mBhIAADBcR/r5OJzCAAAAAElFTkSuQmCC";
    const TURBO_MODE = "turbo mode";
    const INTERPOLATION = "interpolation";
    const REMOVE_FENCING = "remove fencing";
    const REMOVE_MISC_LIMITS = "remove misc limits";
    const HIGH_QUALITY_PEN = "high quality pen";
    const FRAMERATE = "framerate";
    const CLONE_LIMIT = "clone limit";
    const STAGE_SIZE = "stage size";
    const USERNAME = "username";
    const CLONE_COUNT = "clone count";
    const SYSTEM_INFO = "system info";
    const PAGE_TITLE = "page title";
    const CURRENT_FPS = "current fps";

    /** @param {string} what */
    const emitChanged = (what) =>
        Scratch.vm.runtime.startHats("enhancedruntimeoptions_whenChange", {
            WHAT: what,
        });

    /**
     * @template T
     * @param {T} obj
     * @returns {T}
     */
    const shallowCopy = (obj) => Object.assign({}, obj);

    let previousRuntimeOptions = shallowCopy(Scratch.vm.runtime.runtimeOptions);

    Scratch.vm.on("TURBO_MODE_OFF", () => emitChanged(TURBO_MODE));
    Scratch.vm.on("TURBO_MODE_ON", () => emitChanged(TURBO_MODE));
    Scratch.vm.on("INTERPOLATION_CHANGED", () => emitChanged(INTERPOLATION));
    Scratch.vm.on("RUNTIME_OPTIONS_CHANGED", (newOptions) => {
        if (newOptions.fencing !== previousRuntimeOptions.fencing) {
            emitChanged(REMOVE_FENCING);
        }
        if (newOptions.miscLimits !== previousRuntimeOptions.miscLimits) {
            emitChanged(REMOVE_MISC_LIMITS);
        }
        if (newOptions.maxClones !== previousRuntimeOptions.maxClones) {
            emitChanged(CLONE_LIMIT);
        }
        previousRuntimeOptions = shallowCopy(newOptions);
    });
    Scratch.vm.renderer.on("UseHighQualityRenderChanged", () =>
        emitChanged(HIGH_QUALITY_PEN)
    );
    Scratch.vm.on("FRAMERATE_CHANGED", () => emitChanged(FRAMERATE));
    Scratch.vm.on("STAGE_SIZE_CHANGED", () => emitChanged(STAGE_SIZE));

    const originalPostData = Scratch.vm.runtime.ioDevices.userData.postData;
    Scratch.vm.runtime.ioDevices.userData.postData = function (data) {
        const newUsername = data.username !== this._username;
        originalPostData.call(this, data);
        if (newUsername) {
            emitChanged(USERNAME);
        }
    };

    // 用于计算当前FPS
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let currentFPS = 0;

    function updateFPS() {
        const now = performance.now();
        frameCount++;
        if (now >= lastFrameTime + 1000) {
            currentFPS = Math.round((frameCount * 1000) / (now - lastFrameTime));
            frameCount = 0;
            lastFrameTime = now;
        }
        requestAnimationFrame(updateFPS);
    }
    updateFPS();

    class EnhancedRuntimeOptions {
        getInfo() {
            return {
                id: "enhancedruntimeoptions",
                name: "运行时选项",
                color1: "#8c9abf",
                color2: "#7d8aab",
                color3: "#6f7b99",
                blocks: [
                    {
                        opcode: "getEnabled",
                        text: "[thing] 是否启用？",
                        blockType: Scratch.BlockType.BOOLEAN,
                        arguments: {
                            thing: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: TURBO_MODE,
                                menu: "thing",
                            },
                        },
                    },
                    {
                        opcode: "setEnabled",
                        text: "将 [thing] 设为 [enabled]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            thing: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: TURBO_MODE,
                                menu: "thing",
                            },
                            enabled: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "true",
                                menu: "enabled",
                            },
                        },
                    },

                    "---",

                    {
                        opcode: "getFramerate",
                        text: "FPS上限",
                        blockType: Scratch.BlockType.REPORTER,
                    },
                    {
                        opcode: "setFramerate",
                        text: "设置FPS上限为 [fps]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            fps: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: "30",
                            },
                        },
                    },
                    {
                        opcode: "getCurrentFPS",
                        text: "当前FPS",
                        blockType: Scratch.BlockType.REPORTER,
                    },

                    "---",

                    {
                        opcode: "getCloneLimit",
                        text: "克隆限制",
                        blockType: Scratch.BlockType.REPORTER,
                    },
                    {
                        opcode: "setCloneLimit",
                        text: "将克隆体限制设为 [limit]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            limit: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: "300",
                                menu: "clones",
                            },
                        },
                    },
                    {
                        opcode: "getCloneCount",
                        text: "当前克隆体数量",
                        blockType: Scratch.BlockType.REPORTER,
                    },

                    "---",

                    {
                        opcode: "getDimension",
                        text: "舞台 [dimension]",
                        blockType: Scratch.BlockType.REPORTER,
                        arguments: {
                            dimension: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "width",
                                menu: "dimension",
                            },
                        },
                    },
                    {
                        opcode: "setDimensions",
                        text: "将舞台大小设为 宽 [width] 高 [height]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            width: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: "480",
                            },
                            height: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: "360",
                            },
                        },
                    },
                    {
                        opcode: "adjustDimension",
                        text: "将舞台 [dimension] 增加 [amount]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            dimension: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "width",
                                menu: "dimension",
                            },
                            amount: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: "10",
                            },
                        },
                    },

                    "---",

                    {
                        opcode: "getSystemInfo",
                        text: "用户设备 [info]",
                        blockType: Scratch.BlockType.REPORTER,
                        arguments: {
                            info: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "os",
                                menu: "system_info_type",
                            },
                        },
                    },
                    {
                        opcode: "getPageTitle",
                        text: "页面标题",
                        blockType: Scratch.BlockType.REPORTER,
                    },

                    "---",

                    {
                        opcode: "setUsername",
                        text: "将用户名设为 [username]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            username: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "",
                            },
                        },
                    },
                    {
                        opcode: "greenFlag",
                        text: "运行绿旗 [flag]",
                        blockType: Scratch.BlockType.COMMAND,
                        arguments: {
                            flag: {
                                type: Scratch.ArgumentType.IMAGE,
                                dataURI: greenFlagURI,
                            },
                        },
                    },
                    {
                        opcode: "pauseProject",
                        text: "暂停当前作品",
                        blockType: Scratch.BlockType.COMMAND,
                    },

                    "---",

                    {
                        opcode: "whenChange",
                        blockType: Scratch.BlockType.EVENT,
                        text: "当 [WHAT] 被修改时",
                        isEdgeActivated: false,
                        arguments: {
                            WHAT: { type: Scratch.ArgumentType.STRING, menu: "changeable" },
                        },
                    },
                ],
                menus: {
                    thing: {
                        acceptReporters: true,
                        items: [
                            { text: "加速模式", value: TURBO_MODE },
                            { text: "补帧", value: INTERPOLATION },
                            { text: "允许角色移出舞台", value: REMOVE_FENCING },
                            { text: "取消音效范围与画笔大小限制", value: REMOVE_MISC_LIMITS },
                            { text: "高清画笔", value: HIGH_QUALITY_PEN },
                        ],
                    },

                    changeable: {
                        acceptReporters: false,
                        items: [
                            { text: "加速模式", value: TURBO_MODE },
                            { text: "补帧", value: INTERPOLATION },
                            { text: "允许角色移出舞台", value: REMOVE_FENCING },
                            { text: "取消音效范围与画笔大小限制", value: REMOVE_MISC_LIMITS },
                            { text: "高清画笔", value: HIGH_QUALITY_PEN },
                            { text: "FPS上限", value: FRAMERATE },
                            { text: "克隆限制", value: CLONE_LIMIT },
                            { text: "舞台尺寸", value: STAGE_SIZE },
                            { text: "用户名称", value: USERNAME },
                            { text: "克隆体数量", value: CLONE_COUNT },
                            { text: "系统信息", value: SYSTEM_INFO },
                            { text: "页面标题", value: PAGE_TITLE },
                            { text: "当前FPS", value: CURRENT_FPS },
                        ],
                    },

                    enabled: {
                        acceptReporters: true,
                        items: [
                            { text: "启用", value: "true" },
                            { text: "禁用", value: "false" },
                        ],
                    },

                    clones: {
                        acceptReporters: true,
                        items: [
                            { text: "默认值(300)", value: "300" },
                            { text: "无限", value: "Infinity" },
                        ],
                    },

                    dimension: {
                        acceptReporters: true,
                        items: [
                            { text: "宽度", value: "width" },
                            { text: "高度", value: "height" },
                        ],
                    },

                    system_info_type: {
                        acceptReporters: false,
                        items: [
                            { text: "操作系统", value: "os" },
                            { text: "运行内存", value: "memory" },
                        ],
                    },
                },
            };
        }

        getEnabled({ thing }) {
            if (thing === TURBO_MODE) {
                return Scratch.vm.runtime.turboMode;
            } else if (thing === INTERPOLATION) {
                return Scratch.vm.runtime.interpolationEnabled;
            } else if (thing === REMOVE_FENCING) {
                return !Scratch.vm.runtime.runtimeOptions.fencing;
            } else if (thing === REMOVE_MISC_LIMITS) {
                return !Scratch.vm.runtime.runtimeOptions.miscLimits;
            } else if (thing === HIGH_QUALITY_PEN) {
                return Scratch.renderer.useHighQualityRender;
            }
            return false;
        }

        setEnabled({ thing, enabled }) {
            enabled = Scratch.Cast.toBoolean(enabled);

            if (thing === TURBO_MODE) {
                Scratch.vm.setTurboMode(enabled);
            } else if (thing === INTERPOLATION) {
                Scratch.vm.setInterpolation(enabled);
            } else if (thing === REMOVE_FENCING) {
                Scratch.vm.setRuntimeOptions({
                    fencing: !enabled,
                });
            } else if (thing === REMOVE_MISC_LIMITS) {
                Scratch.vm.setRuntimeOptions({
                    miscLimits: !enabled,
                });
            } else if (thing === HIGH_QUALITY_PEN) {
                Scratch.renderer.setUseHighQualityRender(enabled);
            }
        }

        getFramerate() {
            return Scratch.vm.runtime.frameLoop.framerate;
        }

        setFramerate({ fps }) {
            fps = Scratch.Cast.toNumber(fps);
            Scratch.vm.setFramerate(fps);
        }

        getCurrentFPS() {
            return currentFPS;
        }

        getCloneLimit() {
            return Scratch.vm.runtime.runtimeOptions.maxClones;
        }
        
        setCloneLimit({ limit }) {
            limit = Scratch.Cast.toNumber(limit);
            Scratch.vm.setRuntimeOptions({
                maxClones: limit,
            });
        }

        getCloneCount() {
            return Scratch.vm.runtime.clones.length;
        }

        getDimension({ dimension }) {
            if (dimension === "width") {
                return Scratch.vm.runtime.stageWidth;
            } else if (dimension === "height") {
                return Scratch.vm.runtime.stageHeight;
            }
            return 0;
        }

        setDimensions({ width, height }) {
            width = Scratch.Cast.toNumber(width);
            height = Scratch.Cast.toNumber(height);
            Scratch.vm.setStageSize(width, height);
        }

        adjustDimension({ dimension, amount }) {
            amount = Scratch.Cast.toNumber(amount);
            if (dimension === "width") {
                const currentWidth = Scratch.vm.runtime.stageWidth;
                Scratch.vm.setStageSize(currentWidth + amount, Scratch.vm.runtime.stageHeight);
            } else if (dimension === "height") {
                const currentHeight = Scratch.vm.runtime.stageHeight;
                Scratch.vm.setStageSize(Scratch.vm.runtime.stageWidth, currentHeight + amount);
            }
        }

        getSystemInfo({ info }) {
            if (info === "os") {
                const userAgent = navigator.userAgent || navigator.vendor || window.opera;
                if (userAgent.includes('Win')) return 'Windows';
                if (userAgent.includes('Mac')) return 'macOS';
                if (userAgent.includes('Linux')) return 'Linux';
                if (userAgent.includes('Android')) return 'Android';
                if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'iOS';
                return '未知';
            } else if (info === "memory") {
                if ('deviceMemory' in navigator) {
                    return `${navigator.deviceMemory} GB`;
                } else {
                    return '无法获取';
                }
            }
            return '未知';
        }

        getPageTitle() {
            return document.title;
        }

        setUsername({ username }) {
            Scratch.vm.postIOData("userData", {
                username: Scratch.Cast.toString(username),
            });
        }

        greenFlag() {
            Scratch.vm.runtime.greenFlag();
        }

        pauseProject() {
            // 暂停项目：停止所有脚本
            Scratch.vm.stopAll();
        }
    }

    Scratch.extensions.register(new EnhancedRuntimeOptions());
})(Scratch);