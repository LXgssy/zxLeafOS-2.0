class zx {
  constructor() {
    this.timers = {}; // 用于存储计时器
    this.countdowns = {}; // 用于存储倒计时器
  }

  getInfo() {
    return {
      id: 'zx',
      name: 'ZXtools2.0',
      color: '#24a238',
      blocks: [
        {
          opcode: 'waitMinutes',
          blockType: Scratch.BlockType.COMMAND,
          text: '等 [MINUTES] 分钟',
          arguments: {
            MINUTES: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'waitHours',
          blockType: Scratch.BlockType.COMMAND,
          text: '等 [HOURS] 小时',
          arguments: {
            HOURS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'reverseText',
          blockType: Scratch.BlockType.REPORTER,
          text: '反转 [TEXT]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello'
            }
          }
        },
        {
          opcode: 'isEnglish',
          blockType: Scratch.BlockType.BOOLEAN,
          text: '[TEXT] 是英语吗',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello'
            }
          }
        },
        {
          opcode: 'isChinese',
          blockType: Scratch.BlockType.BOOLEAN,
          text: '[TEXT] 是中文吗',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '你好'
            }
          }
        },
        {
          opcode: 'substring',
          blockType: Scratch.BlockType.REPORTER,
          text: '[TEXT] 的第 [START] 项到 [END] 项',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello World'
            },
            START: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            },
            END: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 5
            }
          }
        },
        {
          opcode: 'toUpperCase',
          blockType: Scratch.BlockType.REPORTER,
          text: '[TEXT] 转大写',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'hello'
            }
          }
        },
        {
          opcode: 'toLowerCase',
          blockType: Scratch.BlockType.REPORTER,
          text: '[TEXT] 转小写',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'HELLO'
            }
          }
        },
        {
          opcode: 'generateRandomString',
          blockType: Scratch.BlockType.REPORTER,
          text: '生成 [LENGTH] 位带字母数字的随机字符串',
          arguments: {
            LENGTH: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 8
            }
          }
        },
        {
          opcode: 'insertText',
          blockType: Scratch.BlockType.REPORTER,
          text: '在 [TEXT] 的第 [INDEX] 项插入 [INSERT]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello'
            },
            INDEX: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 3
            },
            INSERT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'World'
            }
          }
        },
        {
          opcode: 'daysInMonth',
          blockType: Scratch.BlockType.REPORTER,
          text: '[YEAR] 年 [MONTH] 月有多少天',
          arguments: {
            YEAR: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 2023
            },
            MONTH: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 2
            }
          }
        },
        {
          opcode: 'getScreenResolution',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取屏幕分辨率'
        },
        {
          opcode: 'removeText',
          blockType: Scratch.BlockType.REPORTER,
          text: '去掉 [TEXT] 中的 [REMOVE]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello World'
            },
            REMOVE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'World'
            }
          }
        },
        {
          opcode: 'getCPUCores',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取CPU有几核心'
        },
        {
          opcode: 'getRAM',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取运行内存'
        },
        {
          opcode: 'getDayOfWeek',
          blockType: Scratch.BlockType.REPORTER,
          text: '[YEAR] 年 [MONTH] 月 [DAY] 日是星期几',
          arguments: {
            YEAR: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 2023
            },
            MONTH: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            },
            DAY: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'calculateExpression',
          blockType: Scratch.BlockType.REPORTER,
          text: '计算 [EXPRESSION]',
          arguments: {
            EXPRESSION: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '1 + 1'
            }
          }
        },
        {
          opcode: 'createTimer',
          blockType: Scratch.BlockType.COMMAND,
          text: '创建计时器 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            }
          }
        },
        {
          opcode: 'pauseTimer',
          blockType: Scratch.BlockType.COMMAND,
          text: '暂停计时器 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            }
          }
        },
        {
          opcode: 'resetTimer',
          blockType: Scratch.BlockType.COMMAND,
          text: '归零计时器 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            }
          }
        },
        {
          opcode: 'resumeTimer',
          blockType: Scratch.BlockType.COMMAND,
          text: '继续计时器 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            }
          }
        },
        {
          opcode: 'deleteTimer',
          blockType: Scratch.BlockType.COMMAND,
          text: '删除计时器 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            }
          }
        },
        {
          opcode: 'deleteAllTimers',
          blockType: Scratch.BlockType.COMMAND,
          text: '删除所有的计时器'
        },
        {
          opcode: 'getTimerValue',
          blockType: Scratch.BlockType.REPORTER,
          text: '计时器 [NAME] 的 [UNIT]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'timer1'
            },
            UNIT: {
              type: Scratch.ArgumentType.STRING,
              menu: 'timerUnits',
              defaultValue: '秒'
            }
          }
        },
        {
          opcode: 'createCountdown',
          blockType: Scratch.BlockType.COMMAND,
          text: '创建并开始倒计时 [NAME] 天 [DAYS] 小时 [HOURS] 分钟 [MINUTES] 秒 [SECONDS]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            },
            DAYS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            },
            HOURS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            },
            MINUTES: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            },
            SECONDS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'pauseCountdown',
          blockType: Scratch.BlockType.COMMAND,
          text: '暂停倒计时 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            }
          }
        },
        {
          opcode: 'resumeCountdown',
          blockType: Scratch.BlockType.COMMAND,
          text: '继续倒计时 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            }
          }
        },
        {
          opcode: 'resetCountdown',
          blockType: Scratch.BlockType.COMMAND,
          text: '重置倒计时 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            }
          }
        },
        {
          opcode: 'deleteCountdown',
          blockType: Scratch.BlockType.COMMAND,
          text: '删除倒计时 [NAME]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            }
          }
        },
        {
          opcode: 'deleteAllCountdowns',
          blockType: Scratch.BlockType.COMMAND,
          text: '删除所有的倒计时'
        },
        {
          opcode: 'getCountdownValue',
          blockType: Scratch.BlockType.REPORTER,
          text: '倒计时 [NAME] 的 [UNIT]',
          arguments: {
            NAME: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'countdown1'
            },
            UNIT: {
              type: Scratch.ArgumentType.STRING,
              menu: 'countdownUnits',
              defaultValue: '秒'
            }
          }
        },
        {
          opcode: 'getOSName',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取操作系统名称'
        },
        {
          opcode: 'isOnline',
          blockType: Scratch.BlockType.BOOLEAN,
          text: '网络是否连接'
        },
        {
          opcode: 'getNetworkType',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取网络类型'
        },
        {
          opcode: 'getBrowserEngine',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取浏览器内核'
        },
        {
          opcode: 'fixJSON',
          blockType: Scratch.BlockType.REPORTER,
          text: '将 [JSON] 改正成正确的JSON',
          arguments: {
            JSON: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '{"name": "test", "age": 20,}'
            }
          }
        },
        {
          opcode: 'replaceTextAt',
          blockType: Scratch.BlockType.REPORTER,
          text: '将文本 [TEXT] 中的第 [INDEX] 个 [OLD] 替换成 [NEW]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello World'
            },
            INDEX: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            },
            OLD: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'o'
            },
            NEW: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '0'
            }
          }
        },
        {
          opcode: 'getJSONValue',
          blockType: Scratch.BlockType.REPORTER,
          text: '获取JSON [JSON] 中的 [KEY]',
          arguments: {
            JSON: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '{"name": "test"}'
            },
            KEY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'name'
            }
          }
        },
        {
          opcode: 'whenMouseLongPress',
          blockType: Scratch.BlockType.HAT,
          text: '当长按鼠标 [BUTTON] [SECONDS] 秒时',
          isEdgeActivated: false,
          arguments: {
            BUTTON: {
              type: Scratch.ArgumentType.STRING,
              menu: 'mouseButtons',
              defaultValue: '左键'
            },
            SECONDS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 2
            }
          }
        }
      ],
      menus: {
        timerUnits: {
          items: ['秒', '分钟', '小时', '毫秒']
        },
        countdownUnits: {
          items: ['天', '小时', '分钟', '秒', '毫秒']
        },
        mouseButtons: {
          items: ['左键', '右键']
        }
      }
    };
  }

  waitMinutes(args) {
    const minutes = args.MINUTES;
    return new Promise(resolve => setTimeout(resolve, minutes * 60000));
  }

  waitHours(args) {
    const hours = args.HOURS;
    return new Promise(resolve => setTimeout(resolve, hours * 3600000));
  }

  reverseText(args) {
    const text = args.TEXT;
    return text.split('').reverse().join('');
  }

  isEnglish(args) {
    const text = args.TEXT;
    return /^[A-Za-z\s]+$/.test(text);
  }

  isChinese(args) {
    const text = args.TEXT;
    return /^[\u4e00-\u9fa5\s]+$/.test(text);
  }

  substring(args) {
    const text = args.TEXT;
    const start = args.START - 1;
    const end = args.END;
    return text.substring(start, end);
  }

  toUpperCase(args) {
    const text = args.TEXT;
    return text.toUpperCase();
  }

  toLowerCase(args) {
    const text = args.TEXT;
    return text.toLowerCase();
  }

  generateRandomString(args) {
    const length = args.LENGTH;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  insertText(args) {
    const text = args.TEXT;
    const index = args.INDEX - 1;
    const insert = args.INSERT;
    return text.slice(0, index) + insert + text.slice(index);
  }

  daysInMonth(args) {
    const year = args.YEAR;
    const month = args.MONTH;
    return new Date(year, month, 0).getDate();
  }

  getScreenResolution() {
    return `${window.screen.width}x${window.screen.height}`;
  }

  removeText(args) {
    const text = args.TEXT;
    const remove = args.REMOVE;
    return text.replace(new RegExp(remove, 'g'), '');
  }

  getCPUCores() {
    return navigator.hardwareConcurrency || '未知';
  }

  getRAM() {
    return navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '未知';
  }

  getDayOfWeek(args) {
    const year = args.YEAR;
    const month = args.MONTH;
    const day = args.DAY;
    const date = new Date(year, month - 1, day);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `星期${days[date.getDay()]}`;
  }

  calculateExpression(args) {
    const expression = args.EXPRESSION;
    try {
      // 简单的数学解析器
      const tokens = expression.match(/(\d+|\+|\-|\*|\/)/g);
      if (!tokens) return '无效表达式';
      let result = parseFloat(tokens[0]);
      for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const nextNumber = parseFloat(tokens[i + 1]);
        if (operator === '+') result += nextNumber;
        else if (operator === '-') result -= nextNumber;
        else if (operator === '*') result *= nextNumber;
        else if (operator === '/') result /= nextNumber;
        else return '无效运算符';
      }
      return result;
    } catch (e) {
      return '计算错误';
    }
  }

  createTimer(args) {
    const name = args.NAME;
    if (!this.timers) this.timers = {};
    this.timers[name] = { start: Date.now(), paused: false, elapsed: 0 };
  }

  pauseTimer(args) {
    const name = args.NAME;
    if (this.timers && this.timers[name] && !this.timers[name].paused) {
      this.timers[name].elapsed += Date.now() - this.timers[name].start;
      this.timers[name].paused = true;
    }
  }

  resetTimer(args) {
    const name = args.NAME;
    if (this.timers && this.timers[name]) {
      this.timers[name].start = Date.now();
      this.timers[name].elapsed = 0;
      this.timers[name].paused = false;
    }
  }

  resumeTimer(args) {
    const name = args.NAME;
    if (this.timers && this.timers[name] && this.timers[name].paused) {
      this.timers[name].start = Date.now();
      this.timers[name].paused = false;
    }
  }

  deleteTimer(args) {
    const name = args.NAME;
    if (this.timers && this.timers[name]) {
      delete this.timers[name];
    }
  }

  deleteAllTimers() {
    this.timers = {};
  }

  getTimerValue(args) {
    const name = args.NAME;
    const unit = args.UNIT;
    if (this.timers && this.timers[name]) {
      const timer = this.timers[name];
      const elapsed = timer.paused ? timer.elapsed : timer.elapsed + (Date.now() - timer.start);
      if (unit === '秒') return Math.floor(elapsed / 1000);
      else if (unit === '分钟') return Math.floor(elapsed / 60000);
      else if (unit === '小时') return Math.floor(elapsed / 3600000);
      else if (unit === '毫秒') return elapsed;
    }
    return 0;
  }

  createCountdown(args) {
    const name = args.NAME;
    const days = args.DAYS;
    const hours = args.HOURS;
    const minutes = args.MINUTES;
    const seconds = args.SECONDS;
    
    if (!this.countdowns) this.countdowns = {};
    
    const totalTime = (days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
    
    this.countdowns[name] = {
      totalTime: totalTime,
      remaining: totalTime,
      startTime: Date.now(),
      paused: false,
      pausedAt: 0
    };
  }

  pauseCountdown(args) {
    const name = args.NAME;
    if (this.countdowns && this.countdowns[name] && !this.countdowns[name].paused) {
      this.countdowns[name].paused = true;
      this.countdowns[name].pausedAt = Date.now();
    }
  }

  resumeCountdown(args) {
    const name = args.NAME;
    if (this.countdowns && this.countdowns[name] && this.countdowns[name].paused) {
      const countdown = this.countdowns[name];
      const pauseDuration = Date.now() - countdown.pausedAt;
      countdown.startTime += pauseDuration;
      countdown.paused = false;
    }
  }

  resetCountdown(args) {
    const name = args.NAME;
    if (this.countdowns && this.countdowns[name]) {
      const countdown = this.countdowns[name];
      countdown.startTime = Date.now();
      countdown.remaining = countdown.totalTime;
      countdown.paused = false;
    }
  }

  deleteCountdown(args) {
    const name = args.NAME;
    if (this.countdowns && this.countdowns[name]) {
      delete this.countdowns[name];
    }
  }

  deleteAllCountdowns() {
    this.countdowns = {};
  }

  getCountdownValue(args) {
    const name = args.NAME;
    const unit = args.UNIT;
    
    if (this.countdowns && this.countdowns[name]) {
      const countdown = this.countdowns[name];
      
      if (countdown.paused) {
        var remaining = countdown.remaining;
      } else {
        const elapsed = Date.now() - countdown.startTime;
        remaining = Math.max(0, countdown.totalTime - elapsed);
        countdown.remaining = remaining;
      }
      
      if (unit === '毫秒') {
        const ms = Math.floor(remaining % 1000);
        return ms.toString().padStart(2, '0');
      } else if (unit === '秒') {
        return Math.floor((remaining % 60000) / 1000);
      } else if (unit === '分钟') {
        return Math.floor((remaining % 3600000) / 60000);
      } else if (unit === '小时') {
        return Math.floor((remaining % 86400000) / 3600000);
      } else if (unit === '天') {
        return Math.floor(remaining / 86400000);
      }
    }
    return 0;
  }

  getOSName() {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Win") !== -1) return "Windows";
    if (userAgent.indexOf("Mac") !== -1) return "MacOS";
    if (userAgent.indexOf("Linux") !== -1) return "Linux";
    if (userAgent.indexOf("Android") !== -1) return "Android";
    if (userAgent.indexOf("iOS") !== -1 || userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) return "iOS";
    return "未知";
  }

  isOnline() {
    return navigator.onLine;
  }

  getNetworkType() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection && connection.effectiveType) {
        return connection.effectiveType;
      }
    }
    return '未知';
  }

  getBrowserEngine() {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") !== -1) return "Blink";
    if (userAgent.indexOf("Firefox") !== -1) return "Gecko";
    if (userAgent.indexOf("Safari") !== -1) return "WebKit";
    if (userAgent.indexOf("Edge") !== -1) return "EdgeHTML";
    if (userAgent.indexOf("Trident") !== -1) return "Trident";
    return "未知";
  }

  fixJSON(args) {
    const jsonString = args.JSON;
    try {
      // 先尝试直接解析
      return JSON.stringify(JSON.parse(jsonString));
    } catch (e) {
      try {
        // 修复常见的JSON错误
        let fixed = jsonString
          // 修复多余的逗号
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          // 修复不规范的引号（将单引号转为双引号）
          .replace(/'/g, '"')
          // 修复缺少引号的键
          .replace(/(\w+):/g, '"$1":');
        
        return JSON.stringify(JSON.parse(fixed));
      } catch (e2) {
        return '无法修复的JSON';
      }
    }
  }

  replaceTextAt(args) {
    const text = args.TEXT;
    const index = args.INDEX;
    const oldStr = args.OLD;
    const newStr = args.NEW;
    
    if (index < 1) return text;
    
    let count = 0;
    let result = '';
    let lastIndex = 0;
    let currentIndex = text.indexOf(oldStr);
    
    while (currentIndex !== -1) {
      count++;
      if (count === index) {
        result += text.substring(lastIndex, currentIndex) + newStr;
        lastIndex = currentIndex + oldStr.length;
        break;
      }
      currentIndex = text.indexOf(oldStr, currentIndex + 1);
    }
    
    result += text.substring(lastIndex);
    return result;
  }

  getJSONValue(args) {
    const jsonString = args.JSON;
    const key = args.KEY;
    
    try {
      const obj = JSON.parse(jsonString);
      if (obj && typeof obj === 'object' && key in obj) {
        return obj[key];
      }
      return '键不存在';
    } catch (e) {
      return '无效的JSON';
    }
  }

  whenMouseLongPress(args) {
    const button = args.BUTTON;
    const seconds = args.SECONDS;
    const buttonCode = button === '左键' ? 0 : 2;
    
    return new Promise((resolve) => {
      let pressStartTime = 0;
      let isPressed = false;
      
      const checkPress = () => {
        const isDown = Scratch.vm.runtime.ioDevices.mouse.getButtonIsDown(buttonCode);
        
        if (isDown && !isPressed) {
          // 开始按下
          isPressed = true;
          pressStartTime = Date.now();
        } else if (!isDown && isPressed) {
          // 释放按钮
          isPressed = false;
        }
        
        if (isPressed && (Date.now() - pressStartTime >= seconds * 1000)) {
          resolve(true);
          isPressed = false;
        } else {
          setTimeout(checkPress, 50);
        }
      };
      
      checkPress();
    });
  }
}

Scratch.extensions.register(new zx());