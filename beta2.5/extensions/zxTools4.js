(function (Scratch) {
  'use strict';

  // 导入RecordRTC库
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/recordrtc@5.6.2/RecordRTC.min.js';
  document.head.appendChild(script);

  class ZxTools4 {
    constructor() {
      // 计时器相关
      this.timers = {};
      this.timerCount = 0;
      
      // 倒计时相关
      this.countdowns = {};
      this.countdownCount = 0;
      
      // 闹钟相关
      this.alarms = {};
      this.alarmCount = 0;
      this.activeAlarms = {};
      this.alarmIntervals = {};
      this.alarmStates = {};
      this.alarmExceeded = {};
      
      // 变量相关
      this.variables = {};
      
      // 文件相关
      this.selectedFiles = [];
      
      // 键盘监听
      this.keyPressed = {};
      
      // 鼠标监听
      this.mouseDown = {
        left: false,
        middle: false,
        right: false
      };
      
      // 文本分割输出相关
      this.textSplitterIntervals = {};
      this.currentSegmentIndex = {};
      this.splitResults = {};
      
      // 麦克风录制相关
      this.recorder = null;
      this.recordingStartTime = null;
      this.recordingBlob = null;
      
      // 语音识别相关
      this.speechRecognition = null;
      this.recognizedText = '';
      this.isRecognizing = false;
      
      // 电池信息相关
      this.batteryLevel = 100;
      this.chargingStatus = false;
      this.lastChargedTime = new Date();
      
      // 添加事件监听器
      this._addEventListeners();
      this._setupBatteryMonitoring();
    }

    _addEventListeners() {
      // 键盘事件
      document.addEventListener('keydown', (e) => {
        this.keyPressed[e.key] = true;
      });
      
      document.addEventListener('keyup', (e) => {
        this.keyPressed[e.key] = false;
      });
      
      // 鼠标事件
      document.addEventListener('mousedown', (e) => {
        if (e.button === 0) this.mouseDown.left = true;
        if (e.button === 1) this.mouseDown.middle = true;
        if (e.button === 2) this.mouseDown.right = true;
      });
      
      document.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.mouseDown.left = false;
        if (e.button === 1) this.mouseDown.middle = false;
        if (e.button === 2) this.mouseDown.right = false;
      });
    }

    _setupBatteryMonitoring() {
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          this.batteryLevel = battery.level * 100;
          this.chargingStatus = battery.charging;
          
          battery.addEventListener('chargingchange', () => {
            this.chargingStatus = battery.charging;
            if (battery.charging) {
              this.lastChargedTime = new Date();
            }
          });
          
          battery.addEventListener('levelchange', () => {
            this.batteryLevel = battery.level * 100;
          });
        });
      }
    }

    getInfo() {
      return {
        id: 'zxTools4',
        name: 'zx小工具4.0',
        color1: '#3cba92',
        color2: '#2d9a72',
        color3: '#1f7a55',
        blocks: [
          // 计时器板块
          {
            blockType: 'label',
            text: '计时器板块',
          },
          {
            opcode: 'createTimer',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建计时器并且命名成 [NAME]',
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
            opcode: 'getTimerTime',
            blockType: Scratch.BlockType.REPORTER,
            text: '计时器 [NAME] 时 [UNIT] 秒',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'timer1'
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'timeUnits'
              }
            }
          },
          {
            opcode: 'deleteTimer',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除 [NAME] 计时器',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'timer1'
              }
            }
          },
          {
            opcode: 'getTimerCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '已创建多少个计时器？'
          },
          {
            opcode: 'deleteAllTimers',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部计时器'
          },
          
          '---',
          
          // 倒计时板块
          {
            blockType: 'label',
            text: '倒计时板块',
          },
          {
            opcode: 'createCountdown',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建倒计时命名为 [NAME] [HOUR] 小时 [MINUTE] 分钟 [SECOND] 秒',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'countdown1'
              },
              HOUR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              MINUTE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              SECOND: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'deleteCountdown',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除名字为 [NAME] 倒计时',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'countdown1'
              }
            }
          },
          {
            opcode: 'getCountdownCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有倒计时数量'
          },
          {
            opcode: 'getAllCountdownNames',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有倒计时名称'
          },
          {
            opcode: 'deleteAllCountdowns',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部倒计时'
          },
          {
            opcode: 'getCountdownTime',
            blockType: Scratch.BlockType.REPORTER,
            text: '倒计时 [NAME] 的 [UNIT]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'countdown1'
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'timeUnitsExtended'
              }
            }
          },
          
          '---',
          
          // 三角函数板块
          {
            blockType: 'label',
            text: '三角函数板块',
          },
          {
            opcode: 'trigFunction',
            blockType: Scratch.BlockType.REPORTER,
            text: '[FUNC] [ANGLE]° 的精确值',
            arguments: {
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                menu: 'trigFunctions'
              },
              ANGLE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          {
            opcode: 'trigFraction',
            blockType: Scratch.BlockType.REPORTER,
            text: '[FUNC] [ANGLE]° 的分数形式',
            arguments: {
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                menu: 'trigFunctions'
              },
              ANGLE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          
          '---',
          
          // 数学运算板块
          {
            blockType: 'label',
            text: '数学运算板块',
          },
          {
            opcode: 'powerFunction',
            blockType: Scratch.BlockType.REPORTER,
            text: '[BASE] 的 [EXPONENT] 次方',
            arguments: {
              BASE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2
              },
              EXPONENT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 3
              }
            }
          },
          
          '---',
          
          // 闹钟板块
          {
            blockType: 'label',
            text: '闹钟板块',
          },
          {
            opcode: 'setAlarmWeek',
            blockType: Scratch.BlockType.COMMAND,
            text: '设置闹钟为星期 [START_DAY] 至星期 [END_DAY] 的时 [HOUR] 分 [MINUTE] 秒 [SECOND]，名字命名为 [NAME]（自动同步当前时间）',
            arguments: {
              START_DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getDay()
              },
              END_DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getDay()
              },
              HOUR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getHours()
              },
              MINUTE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getMinutes()
              },
              SECOND: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getSeconds()
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'alarm1'
              }
            }
          },
          {
            opcode: 'setAlarmDate',
            blockType: Scratch.BlockType.COMMAND,
            text: '设置闹钟 [YEAR] 年 [MONTH] 月 [DAY] 日 [HOUR] 时 [MINUTE] 分 [SECOND] 秒，名字命名为 [NAME]（自动同步当前时间）',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getFullYear()
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getMonth() + 1
              },
              DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getDate()
              },
              HOUR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getHours()
              },
              MINUTE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getMinutes()
              },
              SECOND: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: new Date().getSeconds()
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'alarm1'
              }
            }
          },
          {
            opcode: 'deleteAlarm',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除闹钟 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'alarm1'
              }
            }
          },
          {
            opcode: 'deleteAllAlarms',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除所有闹钟'
          },
          {
            opcode: 'getAllAlarms',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有的闹钟名称和事件（返回JSON）'
          },
          {
            opcode: 'getAlarmCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有闹钟数量'
          },
          {
            opcode: 'isAlarmExceeded',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '名字为 [NAME] 的闹钟是否超过设置的时间？',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'alarm1'
              }
            }
          },
          {
            opcode: 'exportAlarmData',
            blockType: Scratch.BlockType.REPORTER,
            text: '导出闹钟数据'
          },
          {
            opcode: 'importAlarmData',
            blockType: Scratch.BlockType.COMMAND,
            text: '导入闹钟数据 [DATA]',
            arguments: {
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{}'
              }
            }
          },
          
          '---',
          
          // 文本处理板块
          {
            blockType: 'label',
            text: '文本处理',
          },
          {
            opcode: 'textContainsRange',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[TEXT] 文本中第 [START] 项到第 [END] 项包含 [SEARCH]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              START: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              END: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 5
              },
              SEARCH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'ell'
              }
            }
          },
          {
            opcode: 'orCondition',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[A] 或者 [B]',
            arguments: {
              A: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'true'
              },
              B: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'false'
              }
            }
          },
          {
            opcode: 'andCondition',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[A] 与 [B]',
            arguments: {
              A: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'true'
              },
              B: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'true'
              }
            }
          },
          {
            opcode: 'countInText',
            blockType: Scratch.BlockType.REPORTER,
            text: '文本 [TEXT] 中有几个 [SUBTEXT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world hello'
              },
              SUBTEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              }
            }
          },
          {
            opcode: 'getTextRange',
            blockType: Scratch.BlockType.REPORTER,
            text: '文本 [TEXT] 中的第 [START] 个到 [END] 个字符的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
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
            opcode: 'removeTextRange',
            blockType: Scratch.BlockType.REPORTER,
            text: '文本 [TEXT] 中删除第 [START] 个到 [END] 个字符的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
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
            opcode: 'calculateExpression',
            blockType: Scratch.BlockType.REPORTER,
            text: '计算数学算式 [EXPR]',
            arguments: {
              EXPR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '2+3*4'
              }
            }
          },
          {
            opcode: 'reverseText',
            blockType: Scratch.BlockType.REPORTER,
            text: '反转文本 [TEXT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              }
            }
          },
          {
            opcode: 'toUpper',
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
            opcode: 'toLower',
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
            opcode: 'greaterOrEqual',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[A] 大于等于 [B]',
            arguments: {
              A: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 5
              },
              B: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 3
              }
            }
          },
          {
            opcode: 'lessOrEqual',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[A] 小于等于 [B]',
            arguments: {
              A: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 3
              },
              B: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 5
              }
            }
          },
          {
            opcode: 'notEqual',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[A] 不等于 [B]？',
            arguments: {
              A: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              },
              B: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'world'
              }
            }
          },
          {
            opcode: 'getTextRangeSimple',
            blockType: Scratch.BlockType.REPORTER,
            text: '文本 [TEXT] 的第 [START] 项到 [END] 项',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
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
            opcode: 'replaceTextAtPosition',
            blockType: Scratch.BlockType.REPORTER,
            text: '将文本 [TEXT] 第 [POS] 个 [OLD] 替换成 [NEW]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world hello'
              },
              POS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              OLD: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              },
              NEW: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hi'
              }
            }
          },
          {
            opcode: 'getJsonValue',
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
            opcode: 'getTextAfter',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取文本 [TEXT] [SUBSTRING] 字符后面的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              SUBSTRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' '
              }
            }
          },
          {
            opcode: 'getTextBefore',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取文本 [TEXT] [SUBSTRING] 字符前面的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              SUBSTRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' '
              }
            }
          },
          {
            opcode: 'removeTextAfter',
            blockType: Scratch.BlockType.REPORTER,
            text: '去掉文本 [TEXT] [SUBSTRING] 字符后面的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              SUBSTRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' '
              }
            }
          },
          {
            opcode: 'removeTextBefore',
            blockType: Scratch.BlockType.REPORTER,
            text: '去掉文本 [TEXT] [SUBSTRING] 字符前面的内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              SUBSTRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' '
              }
            }
          },
          
          // 新增：文本分割功能
          {
            opcode: 'splitTextAndGetSegment',
            blockType: Scratch.BlockType.REPORTER,
            text: '将文本 [TEXT] 分成 [SEGMENTS] 段并且获取第 [INDEX] 段内容',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world test'
              },
              SEGMENTS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 3
              },
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },

          '---',
          
          // 时间板块
          {
            blockType: 'label',
            text: '时间板块',
          },
          {
            opcode: 'getTimeFormat',
            blockType: Scratch.BlockType.REPORTER,
            text: '今天的时间 [FORMAT]',
            arguments: {
              FORMAT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'timeFormat'
              }
            }
          },
          {
            opcode: 'getTodayDate',
            blockType: Scratch.BlockType.REPORTER,
            text: '今天的日期'
          },
          {
            opcode: 'getYesterdayDay',
            blockType: Scratch.BlockType.REPORTER,
            text: '昨天是星期几？'
          },
          {
            opcode: 'getTomorrowDay',
            blockType: Scratch.BlockType.REPORTER,
            text: '明天是星期几？'
          },
          {
            opcode: 'getTodayDay',
            blockType: Scratch.BlockType.REPORTER,
            text: '今天是星期几？'
          },
          {
            opcode: 'getDayOfWeek',
            blockType: Scratch.BlockType.REPORTER,
            text: '[YEAR] 年 [MONTH] 月 [DAY] 日是星期几？',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'daysUntilDate',
            blockType: Scratch.BlockType.REPORTER,
            text: '今天距离 [YEAR] 年 [MONTH] 月 [DAY] 日还有多少天？',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'daysUntilDateFromTomorrow',
            blockType: Scratch.BlockType.REPORTER,
            text: '明天距离 [YEAR] 年 [MONTH] 月 [DAY] 日还有多少天？',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'daysUntilDateFromYesterday',
            blockType: Scratch.BlockType.REPORTER,
            text: '昨天距离 [YEAR] 年 [MONTH] 月 [DAY] 日还有多少天？',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'daysBetweenDates',
            blockType: Scratch.BlockType.REPORTER,
            text: '[START_YEAR] 年 [START_MONTH] 月 [START_DAY] 日 [START_HOUR] 距离 [END_YEAR] 年 [END_MONTH] 月 [END_DAY] 日还有多少天？',
            arguments: {
              START_YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2024
              },
              START_MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 12
              },
              START_DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 31
              },
              START_HOUR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              END_YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              END_MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              END_DAY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'addTime',
            blockType: Scratch.BlockType.REPORTER,
            text: '当前的时间加 [AMOUNT] [UNIT] 是多少',
            arguments: {
              AMOUNT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'timeAdditionUnits'
              }
            }
          },
          
          '---',
          
          // 转换板块
          {
            blockType: 'label',
            text: '转换板块',
          },
          {
            opcode: 'convertTemperature',
            blockType: Scratch.BlockType.REPORTER,
            text: '[TEMP] 将数字转换为 [UNIT]',
            arguments: {
              TEMP: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'tempUnit'
              }
            }
          },
          {
            opcode: 'insertAtStart',
            blockType: Scratch.BlockType.REPORTER,
            text: '在文本 [TEXT] 开始插入内容 [INSERT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'world'
              },
              INSERT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello '
              }
            }
          },
          {
            opcode: 'insertAtEnd',
            blockType: Scratch.BlockType.REPORTER,
            text: '在文本 [TEXT] 结尾插入内容 [INSERT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              },
              INSERT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' world'
              }
            }
          },
          {
            opcode: 'insertAtPosition',
            blockType: Scratch.BlockType.REPORTER,
            text: '在文本 [TEXT] 第 [POS] 个字符前插入内容 [INSERT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'helloworld'
              },
              POS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 5
              },
              INSERT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' '
              }
            }
          },
          {
            opcode: 'insertAtPositionAfter',
            blockType: Scratch.BlockType.REPORTER,
            text: '在文本 [TEXT] 第 [POS] 个字符后插入内容 [INSERT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              },
              POS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 5
              },
              INSERT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ' world'
              }
            }
          },
          {
            opcode: 'splitAndExtract',
            blockType: Scratch.BlockType.REPORTER,
            text: '将文本 [TEXT] 分成 [SEPARATOR] 段并且输出第 [INDEX] 段',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'apple,banana,cherry'
              },
              SEPARATOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ','
              },
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2
              }
            }
          },
          {
            opcode: 'removeAllOccurrences',
            blockType: Scratch.BlockType.REPORTER,
            text: '去掉 [TEXT] 里面所有的 [REMOVE]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world hello'
              },
              REMOVE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              }
            }
          },
          {
            opcode: 'countOccurrences',
            blockType: Scratch.BlockType.REPORTER,
            text: '[TEXT] 文本里面有几个 [SEARCH]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world hello'
              },
              SEARCH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello'
              }
            }
          },
          
          '---',
          
          // 变量板块
          {
            blockType: 'label',
            text: '变量板块',
          },
          {
            opcode: 'createVariable',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建变量 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              }
            }
          },
          {
            opcode: 'deleteVariable',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除变量 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              }
            }
          },
          {
            opcode: 'setVariable',
            blockType: Scratch.BlockType.COMMAND,
            text: '将变量 [NAME] 设为 [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              },
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '100'
              }
            }
          },
          {
            opcode: 'changeVariableBy',
            blockType: Scratch.BlockType.COMMAND,
            text: '将变量 [NAME] 增加 [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'getVariablesInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: '已创建的变量的 [INFO]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'varInfo'
              }
            }
          },
          {
            opcode: 'getVariableValue',
            blockType: Scratch.BlockType.REPORTER,
            text: '名字为 [NAME] 的变量的内容',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              }
            }
          },
          {
            opcode: 'getVariableLength',
            blockType: Scratch.BlockType.REPORTER,
            text: '名字为 [NAME] 的变量的字数',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              }
            }
          },
          {
            opcode: 'insertVariable',
            blockType: Scratch.BlockType.COMMAND,
            text: '将变量 [NAME] 的值 [POSITION] 插入 [TEXT]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              },
              POSITION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'position'
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'new'
              }
            }
          },
          {
            opcode: 'variableExists',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '变量 [NAME] 存在？',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'variable1'
              }
            }
          },
          {
            opcode: 'parseDataUrl',
            blockType: Scratch.BlockType.REPORTER,
            text: '通过DATAURL读取 [DATA_URL] 里面的 [TYPE] 内容',
            arguments: {
              DATA_URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data:text/plain;base64,SGVsbG8='
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'dataType'
              }
            }
          },
          {
            opcode: 'parseCodeFromDataUrl',
            blockType: Scratch.BlockType.REPORTER,
            text: '通过DATAURL读取 [DATA_URL] 里面的 [LANGUAGE] 代码内容',
            arguments: {
              DATA_URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data:text/plain;base64,SGVsbG8='
              },
              LANGUAGE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'codeLanguage'
              }
            }
          },
          {
            opcode: 'exportVariableData',
            blockType: Scratch.BlockType.REPORTER,
            text: '导出变量数据'
          },
          {
            opcode: 'importVariableData',
            blockType: Scratch.BlockType.COMMAND,
            text: '导入变量数据 [DATA]',
            arguments: {
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{}'
              }
            }
          },
          
          '---',
          
          // 随机板块
          {
            blockType: 'label',
            text: '随机板块',
          },
          {
            opcode: 'randomNumberString',
            blockType: Scratch.BlockType.REPORTER,
            text: '随机生成 [LENGTH] 位数字字符串',
            arguments: {
              LENGTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 6
              }
            }
          },
          {
            opcode: 'randomAlphaNumString',
            blockType: Scratch.BlockType.REPORTER,
            text: '随机生成 [LENGTH] 位数字字母符字符串',
            arguments: {
              LENGTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8
              }
            }
          },
          {
            opcode: 'removeChar',
            blockType: Scratch.BlockType.REPORTER,
            text: '去掉 [TEXT] 里面的 [CHAR]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello world'
              },
              CHAR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'l'
              }
            }
          },
          {
            opcode: 'convertTempSimple',
            blockType: Scratch.BlockType.REPORTER,
            text: '将数字 [TEMP] 转化为 [UNIT]',
            arguments: {
              TEMP: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'tempUnit'
              }
            }
          },
          {
            opcode: 'getDaysInMonth',
            blockType: Scratch.BlockType.REPORTER,
            text: '[YEAR] 年 [MONTH] 月有多少天？',
            arguments: {
              YEAR: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2025
              },
              MONTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2
              }
            }
          },
          {
            opcode: 'isOnlyType',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[TEXT] 中只包含 [TYPE]？',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '12345'
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'charType'
              }
            }
          },
          
          '---',
          
          // 音频录制板块
          {
            blockType: 'label',
            text: '音频录制板块',
          },
          {
            opcode: 'startMicrophone',
            blockType: Scratch.BlockType.COMMAND,
            text: '打开麦克风并且录制'
          },
          {
            opcode: 'stopMicrophone',
            blockType: Scratch.BlockType.COMMAND,
            text: '关闭麦克风并且停止录制'
          },
          {
            opcode: 'isMicrophoneReady',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '打开麦克风成功？'
          },
          {
            opcode: 'getRecordingDuration',
            blockType: Scratch.BlockType.REPORTER,
            text: '已经录制的时长（秒）'
          },
          {
            opcode: 'exportRecording',
            blockType: Scratch.BlockType.REPORTER,
            text: '将录制好的内容导出为DATAURL格式为 [FORMAT]',
            arguments: {
              FORMAT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'audioFormat'
              }
            }
          },
          
          '---',
          
          // 语音识别板块
          {
            blockType: 'label',
            text: '语音识别板块',
          },
          {
            opcode: 'startSpeechRecognition',
            blockType: Scratch.BlockType.COMMAND,
            text: '启动浏览器语音识别'
          },
          {
            opcode: 'stopSpeechRecognition',
            blockType: Scratch.BlockType.COMMAND,
            text: '关闭浏览器语音识别'
          },
          {
            opcode: 'getSpeechResult',
            blockType: Scratch.BlockType.REPORTER,
            text: '语音识别的内容'
          },
          {
            opcode: 'isSpeechRecognizing',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '语音识别成功？'
          },
          
          '---',
          
          // 系统信息板块
          {
            blockType: 'label',
            text: '系统信息板块',
          },
          {
            opcode: 'getOSName',
            blockType: Scratch.BlockType.REPORTER,
            text: '用户的操作系统名称'
          },
          {
            opcode: 'isTablet',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '用户是平板吗'
          },
          {
            opcode: 'isLaptop',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '用户是笔记本吗'
          },
          {
            opcode: 'getBatteryLevel',
            blockType: Scratch.BlockType.REPORTER,
            text: '电池电量'
          },
          {
            opcode: 'isCharging',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '是否在充电'
          },
          {
            opcode: 'getLastChargedTime',
            blockType: Scratch.BlockType.REPORTER,
            text: '最近一次充电时间'
          },
          
          '---',
          
          // 网络板块
          {
            blockType: 'label',
            text: '网络板块',
          },
          {
            opcode: 'httpRequest',
            blockType: Scratch.BlockType.REPORTER,
            text: '来自 [URL] 的网络请求',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://httpbin.org/get'
              }
            }
          },
          
          '---',
          
          // 输入板块
          {
            blockType: 'label',
            text: '输入板块',
          },
          {
            opcode: 'whenMouseDown',
            blockType: Scratch.BlockType.HAT,
            text: '当按下鼠标 [BUTTON] 键按下',
            arguments: {
              BUTTON: {
                type: Scratch.ArgumentType.STRING,
                menu: 'mouseButton'
              }
            }
          },
          {
            opcode: 'waitTimeUnit',
            blockType: Scratch.BlockType.COMMAND,
            text: '等待 [TIME] [UNIT]',
            arguments: {
              TIME: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'timeUnit'
              }
            }
          },
          {
            opcode: 'whenKeyPressed',
            blockType: Scratch.BlockType.HAT,
            text: '当按下 [KEY] 键',
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'a'
              }
            }
          },
          {
            opcode: 'goToWebpage',
            blockType: Scratch.BlockType.COMMAND,
            text: '跳转到网页 [URL]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://space.bilibili.com/1196118574?spm_id_from=333.1007.0.0'
              }
            }
          },
          {
            opcode: 'openInNewTab',
            blockType: Scratch.BlockType.COMMAND,
            text: '在新标签页打开网址 [URL]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://space.bilibili.com/1196118574?spm_id_from=333.1007.0.0'
              }
            }
          },
          {
            opcode: 'isOnline',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '连接网络？'
          },
          {
            opcode: 'isMobileNetwork',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '连接的是移动网络？'
          },
          {
            opcode: 'screenResolution',
            blockType: Scratch.BlockType.REPORTER,
            text: '屏幕分辨率 [DIMENSION]',
            arguments: {
              DIMENSION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'dimension'
              }
            }
          },
          
          '---',
          
          // 弹窗板块
          {
            blockType: 'label',
            text: '弹窗板块',
          },
          {
            opcode: 'showAlert',
            blockType: Scratch.BlockType.COMMAND,
            text: '弹出提示框 [MESSAGE]',
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello!'
              }
            }
          },
          {
            opcode: 'showPrompt',
            blockType: Scratch.BlockType.REPORTER,
            text: '弹出输入框 [MESSAGE]',
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '请输入内容:'
              }
            }
          },
          {
            opcode: 'showConfirm',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '弹出确认框 [MESSAGE]',
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '确定吗?'
              }
            }
          },
          
          '---',
          
          // 文件板块
          {
            blockType: 'label',
            text: '文件板块',
          },
          {
            opcode: 'stageSnapshot',
            blockType: Scratch.BlockType.REPORTER,
            text: '舞台截图 [FORMAT]',
            arguments: {
              FORMAT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'imageFormat'
              }
            }
          },
          {
            opcode: 'openSingleFile',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开单个文件'
          },
          {
            opcode: 'openMultipleFiles',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开多个文件'
          },
          {
            opcode: 'getFileCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开文件数量'
          },
          {
            opcode: 'getAllFileNames',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开文件所有的名称'
          },
          {
            opcode: 'getFileInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开的第 [INDEX] 个文件的 [PROPERTY]',
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              PROPERTY: {
                type: Scratch.ArgumentType.STRING,
                menu: 'fileProperty'
              }
            }
          },
          {
            opcode: 'downloadText',
            blockType: Scratch.BlockType.COMMAND,
            text: '下载文本 [TEXT] 名字为 [FILENAME]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello World'
              },
              FILENAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'document.txt'
              }
            }
          },
          {
            opcode: 'downloadDataUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '下载DATAURL [DATA_URL] 名字为 [FILENAME]',
            arguments: {
              DATA_URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data:text/plain;base64,SGVsbG8='
              },
              FILENAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'image.png'
              }
            }
          },
          
          '---',
          
          // 角色造型声音板块
          {
            blockType: 'label',
            text: '角色造型声音板块',
          },
          {
            opcode: 'addSpriteFromUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL [URL] 加载角色',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/sprite.json'
              }
            }
          },
          {
            opcode: 'addCostumeFromUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL [URL] 加载造型命名为 [NAME]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/costume.png'
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1'
              }
            }
          },
          {
            opcode: 'addSoundFromUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL [URL] 加载声音命名为 [NAME]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/sound.mp3'
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1'
              }
            }
          },
          {
            opcode: 'deleteSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除角色 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'deleteAllSprites',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部角色'
          },
          {
            opcode: 'deleteAllSpritesExcept',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部角色除了包含 [CONTAINS] 字符的角色',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'keep'
              }
            }
          },
          {
            opcode: 'deleteSpritesContaining',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除名字包含 [CONTAINS] 的所有角色',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'keep'
              }
            }
          },
          {
            opcode: 'deleteCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除造型 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1'
              }
            }
          },
          {
            opcode: 'deleteAllCostumes',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部造型'
          },
          {
            opcode: 'deleteAllCostumesExcept',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部造型除了包含 [CONTAINS] 字符的造型',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'keep'
              }
            }
          },
          {
            opcode: 'deleteSound',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除声音 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1'
              }
            }
          },
          {
            opcode: 'deleteAllSounds',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部声音'
          },
          {
            opcode: 'deleteAllSoundsExcept',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除全部声音除了包含 [CONTAINS] 字符的声音',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'keep'
              }
            }
          },
          {
            opcode: 'getAllSprites',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有角色 [INFO]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'assetInfo'
              }
            }
          },
          {
            opcode: 'getAllCostumes',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有造型 [INFO]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'assetInfo'
              }
            }
          },
          {
            opcode: 'getAllSounds',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有声音 [INFO]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'assetInfo'
              }
            }
          },
          {
            opcode: 'getTargetInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: '角色 [INFO]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targetInfo'
              }
            }
          },
          {
            opcode: 'renameSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: '修改角色 [OLD_NAME] 的名称为 [NEW_NAME]',
            arguments: {
              OLD_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
              },
              NEW_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'NewSprite'
              }
            }
          },
          {
            opcode: 'renameSound',
            blockType: Scratch.BlockType.COMMAND,
            text: '修改声音 [OLD_NAME] 的名称为 [NEW_NAME]',
            arguments: {
              OLD_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1'
              },
              NEW_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'newSound'
              }
            }
          },
          {
            opcode: 'renameCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: '修改造型 [OLD_NAME] 的名称为 [NEW_NAME]',
            arguments: {
              OLD_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1'
              },
              NEW_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'newCostume'
              }
            }
          }
        ],
        menus: {
          trigFunctions: {
            items: [
              { text: 'sin', value: 'sin' },
              { text: 'cos', value: 'cos' },
              { text: 'tan', value: 'tan' }
            ]
          },
          timeUnits: {
            items: [
              { text: '毫秒', value: 'milliseconds' },
              { text: '秒', value: 'seconds' },
              { text: '分钟', value: 'minutes' },
              { text: '小时', value: 'hours' }
            ]
          },
          timeUnitsExtended: {
            items: [
              { text: '毫秒', value: 'milliseconds' },
              { text: '秒', value: 'seconds' },
              { text: '分钟', value: 'minutes' },
              { text: '小时', value: 'hours' },
              { text: '天', value: 'days' }
            ]
          },
          timeAdditionUnits: {
            items: [
              { text: '年', value: 'years' },
              { text: '月', value: 'months' },
              { text: '日', value: 'days' },
              { text: '时', value: 'hours' },
              { text: '分', value: 'minutes' },
              { text: '秒', value: 'seconds' }
            ]
          },
          timeFormat: {
            items: [
              { text: '12小时制', value: '12hour' },
              { text: '24小时制', value: '24hour' }
            ]
          },
          tempUnit: {
            items: [
              { text: '华氏度', value: 'fahrenheit' },
              { text: '摄氏度', value: 'celsius' }
            ]
          },
          varInfo: {
            items: [
              { text: '名称', value: 'names' },
              { text: '数量', value: 'count' }
            ]
          },
          position: {
            items: [
              { text: '最前面', value: 'start' },
              { text: '最后面', value: 'end' }
            ]
          },
          dataType: {
            items: [
              { text: 'XML', value: 'xml' },
              { text: 'JSON', value: 'json' }
            ]
          },
          codeLanguage: {
            items: [
              { text: 'JavaScript', value: 'js' },
              { text: 'Python', value: 'py' }
            ]
          },
          charType: {
            items: [
              { text: '数字', value: 'digits' },
              { text: '字母', value: 'letters' },
              { text: '汉字', value: 'chinese' }
            ]
          },
          mouseButton: {
            items: [
              { text: '左', value: 'left' },
              { text: '中', value: 'middle' },
              { text: '右', value: 'right' }
            ]
          },
          timeUnit: {
            items: [
              { text: '分', value: 'minutes' },
              { text: '小时', value: 'hours' },
              { text: '天', value: 'days' }
            ]
          },
          dimension: {
            items: [
              { text: '宽', value: 'width' },
              { text: '高', value: 'height' }
            ]
          },
          imageFormat: {
            items: [
              { text: 'DATAURL', value: 'dataurl' }
            ]
          },
          audioFormat: {
            items: [
              { text: 'WAV', value: 'wav' },
              { text: 'MP3', value: 'mp3' }
            ]
          },
          fileProperty: {
            items: [
              { text: '文件名字', value: 'name' },
              { text: '大小', value: 'size' },
              { text: '修改时间', value: 'mtime' },
              { text: '创建时间', value: 'ctime' },
              { text: '文件后缀', value: 'extension' },
              { text: 'DATAURL', value: 'dataurl' },
              { text: '文本内容', value: 'text' },
              { text: 'JSON内容', value: 'json' },
              { text: 'XML内容', value: 'xml' },
              { text: '图片分辨率宽', value: 'img_width' },
              { text: '图片分辨率高', value: 'img_height' },
              { text: '媒体时长', value: 'duration' }
            ]
          },
          assetInfo: {
            items: [
              { text: '名字', value: 'names' },
              { text: '数量', value: 'count' }
            ]
          },
          targetInfo: {
            items: [
              { text: '名字', value: 'name' },
              { text: 'DATAURL', value: 'dataurl' }
            ]
          }
        }
      };
    }

    // 计时器相关函数
    createTimer(args) {
      const name = args.NAME;
      if (!this.timers[name]) {
        this.timers[name] = {
          startTime: Date.now(),
          paused: false,
          pauseTime: 0,
          totalPaused: 0
        };
        this.timerCount++;
      }
    }

    pauseTimer(args) {
      const name = args.NAME;
      if (this.timers[name] && !this.timers[name].paused) {
        this.timers[name].pauseTime = Date.now();
        this.timers[name].paused = true;
      }
    }

    getTimerTime(args) {
      const name = args.NAME;
      const unit = args.UNIT;
      
      if (!this.timers[name]) return 0;
      
      let elapsed;
      if (this.timers[name].paused) {
        elapsed = this.timers[name].pauseTime - this.timers[name].startTime - this.timers[name].totalPaused;
      } else {
        elapsed = Date.now() - this.timers[name].startTime - this.timers[name].totalPaused;
      }
      
      switch (unit) {
        case 'milliseconds':
          // 限制毫秒为最多两位数（即十位毫秒）
          return Math.round(elapsed / 10) * 10;
        case 'seconds': return Math.floor(elapsed / 1000);
        case 'minutes': return Math.floor(elapsed / 60000);
        case 'hours': return Math.floor(elapsed / 3600000);
        default: return elapsed;
      }
    }

    deleteTimer(args) {
      const name = args.NAME;
      if (this.timers[name]) {
        delete this.timers[name];
        this.timerCount--;
      }
    }

    getTimerCount() {
      return this.timerCount;
    }

    deleteAllTimers() {
      this.timers = {};
      this.timerCount = 0;
    }

    // 倒计时相关函数 - 重写
    createCountdown(args) {
      const name = args.NAME;
      const hours = Number(args.HOUR) || 0;
      const minutes = Number(args.MINUTE) || 0;
      const seconds = Number(args.SECOND) || 0;
      
      // 计算总毫秒数
      const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
      
      if (!this.countdowns[name]) {
        this.countdowns[name] = {
          startTime: Date.now(),
          duration: totalMilliseconds,
          paused: false,
          pauseTime: 0,
          totalPaused: 0
        };
        this.countdownCount++;
      }
    }

    deleteCountdown(args) {
      const name = args.NAME;
      if (this.countdowns[name]) {
        delete this.countdowns[name];
        this.countdownCount--;
      }
    }

    getCountdownCount() {
      return this.countdownCount;
    }

    getAllCountdownNames() {
      return JSON.stringify(Object.keys(this.countdowns));
    }

    deleteAllCountdowns() {
      this.countdowns = {};
      this.countdownCount = 0;
    }

    getCountdownTime(args) {
      const name = args.NAME;
      const unit = args.UNIT;
      
      if (!this.countdowns[name]) return 0;
      
      let remaining;
      if (this.countdowns[name].paused) {
        remaining = this.countdowns[name].duration - 
                   (this.countdowns[name].pauseTime - this.countdowns[name].startTime - this.countdowns[name].totalPaused);
      } else {
        remaining = this.countdowns[name].duration - 
                   (Date.now() - this.countdowns[name].startTime - this.countdowns[name].totalPaused);
      }
      
      if (remaining < 0) remaining = 0;
      
      switch (unit) {
        case 'milliseconds':
          // 限制毫秒为最多两位数（即十位毫秒）
          return Math.round(remaining / 10) * 10;
        case 'seconds': return Math.floor(remaining / 1000);
        case 'minutes': return Math.floor(remaining / 60000);
        case 'hours': return Math.floor(remaining / 3600000);
        case 'days': return Math.floor(remaining / 86400000);
        default: return remaining;
      }
    }

    // 三角函数相关函数
    trigFunction(args) {
      const func = args.FUNC;
      const angle = parseFloat(args.ANGLE);
      const radians = angle * Math.PI / 180;

      switch(func) {
        case 'sin':
          return Math.sin(radians);
        case 'cos':
          return Math.cos(radians);
        case 'tan':
          return Math.tan(radians);
        default:
          return 0;
      }
    }

    trigFraction(args) {
      const func = args.FUNC;
      const angle = parseInt(args.ANGLE);

      const specialValues = {
        sin: {
          0: "0",
          30: "1/2",
          45: "√2/2",
          60: "√3/2",
          90: "1",
          120: "√3/2",
          135: "√2/2",
          150: "1/2",
          180: "0",
          210: "-1/2",
          225: "-√2/2",
          270: "-1",
          315: "-√2/2",
          330: "-1/2"
        },
        cos: {
          0: "1",
          30: "√3/2",
          45: "√2/2",
          60: "1/2",
          90: "0",
          120: "-1/2",
          135: "-√2/2",
          150: "-√3/2",
          180: "-1",
          210: "-√3/2",
          225: "-√2/2",
          270: "0",
          315: "√2/2",
          330: "√3/2"
        },
        tan: {
          0: "0",
          30: "√3/3",
          45: "1",
          60: "√3",
          90: "undefined",
          120: "-√3",
          135: "-1",
          150: "-√3/3",
          180: "0",
          210: "√3/3",
          225: "1",
          270: "undefined",
          315: "-1",
          330: "-√3/3"
        }
      };

      if (specialValues[func] && specialValues[func][angle] !== undefined) {
        return specialValues[func][angle];
      } else {
        const radians = angle * Math.PI / 180;
        let value;
        switch(func) {
          case 'sin':
            value = Math.sin(radians);
            break;
          case 'cos':
            value = Math.cos(radians);
            break;
          case 'tan':
            value = Math.tan(radians);
            break;
          default:
            value = 0;
        }
        return value.toFixed(6);
      }
    }

    // 数学运算相关函数
    powerFunction(args) {
      const base = parseFloat(args.BASE);
      const exponent = parseFloat(args.EXPONENT);
      return Math.pow(base, exponent);
    }

    // 闹钟相关函数
    setAlarmWeek(args) {
      const name = args.NAME;
      if (!this.alarms[name]) {
        this.alarms[name] = {
          type: 'weekly',
          startDay: args.START_DAY,
          endDay: args.END_DAY,
          hour: args.HOUR,
          minute: args.MINUTE,
          second: args.SECOND,
          createdTime: Date.now()
        };
        this.alarmCount++;
        this._startAlarmChecker(name);
      } else {
        this.alarms[name] = {
          type: 'weekly',
          startDay: args.START_DAY,
          endDay: args.END_DAY,
          hour: args.HOUR,
          minute: args.MINUTE,
          second: args.SECOND,
          createdTime: Date.now()
        };
        this._stopAlarmChecker(name);
        this._startAlarmChecker(name);
      }
    }

    setAlarmDate(args) {
      const name = args.NAME;
      if (!this.alarms[name]) {
        this.alarms[name] = {
          type: 'date',
          year: args.YEAR,
          month: args.MONTH,
          day: args.DAY,
          hour: args.HOUR,
          minute: args.MINUTE,
          second: args.SECOND,
          createdTime: Date.now()
        };
        this.alarmCount++;
        this._startAlarmChecker(name);
      } else {
        this.alarms[name] = {
          type: 'date',
          year: args.YEAR,
          month: args.MONTH,
          day: args.DAY,
          hour: args.HOUR,
          minute: args.MINUTE,
          second: args.SECOND,
          createdTime: Date.now()
        };
        this._stopAlarmChecker(name);
        this._startAlarmChecker(name);
      }
    }

    deleteAlarm(args) {
      const name = args.NAME;
      if (this.alarms[name]) {
        this._stopAlarmChecker(name);
        delete this.alarms[name];
        delete this.alarmStates[name];
        delete this.alarmExceeded[name];
        this.alarmCount--;
      }
    }

    deleteAllAlarms() {
      for (const name in this.alarms) {
        this._stopAlarmChecker(name);
      }
      this.alarms = {};
      this.alarmStates = {};
      this.alarmExceeded = {};
      this.alarmCount = 0;
    }

    getAllAlarms() {
      return JSON.stringify(this.alarms);
    }

    getAlarmCount() {
      return this.alarmCount;
    }

    isAlarmExceeded(args) {
      const name = args.NAME;
      if (!this.alarms[name]) return false;
      
      // 检查是否超过了设定时间
      const alarm = this.alarms[name];
      const now = new Date();
      
      if (alarm.type === 'weekly') {
        // 获取当前是星期几（0-6，0为周日）
        const currentDay = now.getDay();
        // 如果是周日，将其转换为7
        const currentDayNormalized = currentDay === 0 ? 7 : currentDay;
        
        // 检查是否在有效日期范围内
        const isInRange = currentDayNormalized >= alarm.startDay && currentDayNormalized <= alarm.endDay;
        
        // 如果不在有效日期范围内，则未超过
        if (!isInRange) {
          return false;
        }
        
        // 在有效日期范围内，检查是否超过时间点
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // 比较时间
        if (currentHour > alarm.hour) {
          return true;
        } else if (currentHour === alarm.hour) {
          if (currentMinute > alarm.minute) {
            return true;
          } else if (currentMinute === alarm.minute) {
            if (currentSecond > alarm.second) {
              return true;
            }
          }
        }
        
        return false;
      } else if (alarm.type === 'date') {
        // 检查年月日
        if (now.getFullYear() > alarm.year) {
          return true;
        } else if (now.getFullYear() === alarm.year) {
          if (now.getMonth() + 1 > alarm.month) {
            return true;
          } else if (now.getMonth() + 1 === alarm.month) {
            if (now.getDate() > alarm.day) {
              return true;
            } else if (now.getDate() === alarm.day) {
              // 检查时分秒
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentSecond = now.getSeconds();
              
              if (currentHour > alarm.hour) {
                return true;
              } else if (currentHour === alarm.hour) {
                if (currentMinute > alarm.minute) {
                  return true;
                } else if (currentMinute === alarm.minute) {
                  if (currentSecond > alarm.second) {
                    return true;
                  }
                }
              }
            }
          }
        }
        
        return false;
      }
      
      return false;
    }

    exportAlarmData() {
      return JSON.stringify(this.alarms);
    }

    importAlarmData(args) {
      try {
        const data = JSON.parse(args.DATA);
        this.alarms = {...data};
        this.alarmCount = Object.keys(this.alarms).length;
        
        for (const name in this.alarms) {
          this._stopAlarmChecker(name);
          this._startAlarmChecker(name);
        }
      } catch (e) {
        console.error('Error importing alarm data:', e);
      }
    }

    _startAlarmChecker(name) {
      if (this.alarmIntervals[name]) {
        clearInterval(this.alarmIntervals[name]);
      }

      this.alarmIntervals[name] = setInterval(() => {
        if (this._checkAlarm(name)) {
          this.alarmStates[name] = true;
        } else {
          this.alarmStates[name] = false;
        }
      }, 1000);
    }

    _stopAlarmChecker(name) {
      if (this.alarmIntervals[name]) {
        clearInterval(this.alarmIntervals[name]);
        delete this.alarmIntervals[name];
      }
      delete this.alarmStates[name];
      delete this.alarmExceeded[name];
    }

    _checkAlarm(name) {
      const alarm = this.alarms[name];
      if (!alarm) return false;

      const now = new Date();

      if (alarm.type === 'weekly') {
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        const isWithinDays = currentDay >= alarm.startDay && currentDay <= alarm.endDay;
        const isCorrectTime = now.getHours() === alarm.hour &&
                             now.getMinutes() === alarm.minute &&
                             now.getSeconds() === alarm.second;
        return isWithinDays && isCorrectTime;
      } else if (alarm.type === 'date') {
        const isCorrectDate = now.getFullYear() === alarm.year &&
                              (now.getMonth() + 1) === alarm.month &&
                              now.getDate() === alarm.day;
        const isCorrectTime = now.getHours() === alarm.hour &&
                             now.getMinutes() === alarm.minute &&
                             now.getSeconds() === alarm.second;
        return isCorrectDate && isCorrectTime;
      }

      return false;
    }

    // 文本处理相关函数
    textContainsRange(args) {
      const text = args.TEXT;
      const start = Math.max(0, args.START - 1);
      const end = Math.min(text.length, args.END);
      const rangeText = text.substring(start, end);
      return rangeText.includes(args.SEARCH);
    }

    orCondition(args) {
      return Scratch.Cast.toBoolean(args.A) || Scratch.Cast.toBoolean(args.B);
    }

    andCondition(args) {
      return Scratch.Cast.toBoolean(args.A) && Scratch.Cast.toBoolean(args.B);
    }

    countInText(args) {
      const text = args.TEXT;
      const subtext = args.SUBTEXT;
      if (!subtext) return 0;
      
      let count = 0;
      let pos = 0;
      
      while (true) {
        pos = text.indexOf(subtext, pos);
        if (pos === -1) break;
        count++;
        pos += subtext.length;
      }
      
      return count;
    }

    getTextRange(args) {
      const text = args.TEXT;
      const start = Math.max(0, args.START - 1);
      const end = Math.min(text.length, args.END);
      return text.substring(start, end);
    }

    removeTextRange(args) {
      const text = args.TEXT;
      const start = Math.max(0, args.START - 1);
      const end = Math.min(text.length, args.END);
      return text.substring(0, start) + text.substring(end);
    }

    calculateExpression(args) {
      try {
        const expr = args.EXPR
          .replace(/\^/g, '**')
          .replace(/[^-()\d/*+.]/g, '');
        
        return new Function('return ' + expr)();
      } catch (e) {
        return 0;
      }
    }

    reverseText(args) {
      return args.TEXT.split('').reverse().join('');
    }

    toUpper(args) {
      return args.TEXT.toUpperCase();
    }

    toLower(args) {
      return args.TEXT.toLowerCase();
    }

    greaterOrEqual(args) {
      return Number(args.A) >= Number(args.B);
    }

    lessOrEqual(args) {
      return Number(args.A) <= Number(args.B);
    }

    notEqual(args) {
      return args.A != args.B;
    }

    getTextRangeSimple(args) {
      const text = args.TEXT;
      const start = Math.max(0, args.START - 1);
      const end = Math.min(text.length, args.END);
      return text.substring(start, end);
    }

    replaceTextAtPosition(args) {
      const text = args.TEXT;
      const oldStr = args.OLD;
      const newStr = args.NEW;
      const pos = args.POS;
      
      let index = -1;
      for (let i = 0; i < pos; i++) {
        index = text.indexOf(oldStr, index + 1);
        if (index === -1) break;
      }
      
      if (index === -1) return text;
      
      return text.substring(0, index) + newStr + text.substring(index + oldStr.length);
    }

    getJsonValue(args) {
      try {
        const obj = JSON.parse(args.JSON);
        return obj[args.KEY] || '';
      } catch (e) {
        return '';
      }
    }

    getTextAfter(args) {
      const text = args.TEXT;
      const substring = args.SUBSTRING;
      const index = text.indexOf(substring);
      if (index === -1) return '';
      return text.substring(index + substring.length);
    }

    getTextBefore(args) {
      const text = args.TEXT;
      const substring = args.SUBSTRING;
      const index = text.indexOf(substring);
      if (index === -1) return text;
      return text.substring(0, index);
    }

    removeTextAfter(args) {
      const text = args.TEXT;
      const substring = args.SUBSTRING;
      const index = text.indexOf(substring);
      if (index === -1) return text;
      return text.substring(0, index + substring.length);
    }

    removeTextBefore(args) {
      const text = args.TEXT;
      const substring = args.SUBSTRING;
      const index = text.indexOf(substring);
      if (index === -1) return text;
      return text.substring(index);
    }

    splitTextAndGetSegment(args) {
      const text = args.TEXT;
      const segments = Math.max(1, Math.floor(Number(args.SEGMENTS)));
      const index = Math.max(1, Math.floor(Number(args.INDEX)));
      
      const segmentLength = Math.ceil(text.length / segments);
      const splitResults = [];
      
      for (let i = 0; i < segments; i++) {
        const start = i * segmentLength;
        const end = Math.min((i + 1) * segmentLength, text.length);
        splitResults.push(text.substring(start, end));
      }
      
      if (index > segments) {
        return '';
      }
      
      return splitResults[index - 1];
    }

    // 时间相关函数
    getTimeFormat(args) {
      const now = new Date();
      if (args.FORMAT === '12hour') {
        return now.toLocaleTimeString('zh-CN', { hour12: true });
      } else {
        return now.toLocaleTimeString('zh-CN', { hour12: false });
      }
    }

    getTodayDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      return `${year}年${month}月${day}日`;
    }

    getYesterdayDay() {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      return days[yesterday.getDay()];
    }

    getTomorrowDay() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      return days[tomorrow.getDay()];
    }

    getTodayDay() {
      const today = new Date();
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      return days[today.getDay()];
    }

    getDayOfWeek(args) {
      const date = new Date(args.YEAR, args.MONTH - 1, args.DAY);
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      return days[date.getDay()];
    }

    daysUntilDate(args) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(args.YEAR, args.MONTH - 1, args.DAY);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    daysUntilDateFromTomorrow(args) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const target = new Date(args.YEAR, args.MONTH - 1, args.DAY);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - tomorrow;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    daysUntilDateFromYesterday(args) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const target = new Date(args.YEAR, args.MONTH - 1, args.DAY);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - yesterday;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    daysBetweenDates(args) {
      const start = new Date(args.START_YEAR, args.START_MONTH - 1, args.START_DAY);
      const end = new Date(args.END_YEAR, args.END_MONTH - 1, args.END_DAY);
      const diffTime = end - start;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    addTime(args) {
      const amount = Number(args.AMOUNT);
      const unit = args.UNIT;
      const now = new Date();
      
      switch(unit) {
        case 'years':
          now.setFullYear(now.getFullYear() + amount);
          break;
        case 'months':
          now.setMonth(now.getMonth() + amount);
          break;
        case 'days':
          now.setDate(now.getDate() + amount);
          break;
        case 'hours':
          now.setHours(now.getHours() + amount);
          break;
        case 'minutes':
          now.setMinutes(now.getMinutes() + amount);
          break;
        case 'seconds':
          now.setSeconds(now.getSeconds() + amount);
          break;
      }
      
      return now.toLocaleString('zh-CN');
    }

    // 转换相关函数
    convertTemperature(args) {
      const temp = Number(args.TEMP);
      if (args.UNIT === 'fahrenheit') {
        return (temp * 9/5) + 32;
      } else {
        return (temp - 32) * 5/9;
      }
    }

    insertAtStart(args) {
      return args.INSERT + args.TEXT;
    }

    insertAtEnd(args) {
      return args.TEXT + args.INSERT;
    }

    insertAtPosition(args) {
      const pos = Math.max(0, Math.min(args.POS - 1, args.TEXT.length));
      return args.TEXT.substring(0, pos) + args.INSERT + args.TEXT.substring(pos);
    }

    insertAtPositionAfter(args) {
      const pos = Math.max(0, Math.min(args.POS, args.TEXT.length));
      return args.TEXT.substring(0, pos) + args.INSERT + args.TEXT.substring(pos);
    }

    splitAndExtract(args) {
      const parts = args.TEXT.split(args.SEPARATOR);
      const index = Math.max(0, Math.min(args.INDEX - 1, parts.length - 1));
      return parts[index] || '';
    }

    removeAllOccurrences(args) {
      return args.TEXT.split(args.REMOVE).join('');
    }

    countOccurrences(args) {
      const text = args.TEXT;
      const search = args.SEARCH;
      if (!search) return 0;
      
      let count = 0;
      let pos = 0;
      
      while (true) {
        pos = text.indexOf(search, pos);
        if (pos === -1) break;
        count++;
        pos += search.length;
      }
      
      return count;
    }

    // 变量相关函数
    createVariable(args) {
      const name = args.NAME;
      if (!this.variables.hasOwnProperty(name)) {
        this.variables[name] = '';
      }
    }

    deleteVariable(args) {
      const name = args.NAME;
      if (this.variables.hasOwnProperty(name)) {
        delete this.variables[name];
      }
    }

    setVariable(args) {
      const name = args.NAME;
      this.variables[name] = args.VALUE;
    }

    changeVariableBy(args) {
      const name = args.NAME;
      const value = Number(this.variables[name] || 0);
      const change = Number(args.VALUE);
      this.variables[name] = (value + change).toString();
    }

    getVariablesInfo(args) {
      if (args.INFO === 'names') {
        return JSON.stringify(Object.keys(this.variables));
      } else {
        return Object.keys(this.variables).length;
      }
    }

    getVariableValue(args) {
      const name = args.NAME;
      return this.variables[name] || '';
    }

    getVariableLength(args) {
      const name = args.NAME;
      return (this.variables[name] || '').length;
    }

    insertVariable(args) {
      const name = args.NAME;
      const text = args.TEXT;
      if (!this.variables.hasOwnProperty(name)) {
        this.variables[name] = '';
      }
      
      if (args.POSITION === 'start') {
        this.variables[name] = text + this.variables[name];
      } else {
        this.variables[name] = this.variables[name] + text;
      }
    }

    variableExists(args) {
      const name = args.NAME;
      return this.variables.hasOwnProperty(name);
    }

    parseDataUrl(args) {
      const dataUrl = args.DATA_URL;
      try {
        const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match) return '';
        
        const mimeType = match[1];
        const base64Data = match[2];
        const binaryData = atob(base64Data);
        
        if (args.TYPE === 'json') {
          return JSON.parse(binaryData);
        } else if (args.TYPE === 'xml') {
          return binaryData;
        }
      } catch (e) {
        return '';
      }
    }

    parseCodeFromDataUrl(args) {
      const dataUrl = args.DATA_URL;
      try {
        const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match) return '';
        
        const base64Data = match[2];
        const code = atob(base64Data);
        
        // 根据语言类型返回代码内容
        if (args.LANGUAGE === 'js' || args.LANGUAGE === 'py') {
          return code;
        }
      } catch (e) {
        return '';
      }
    }

    exportVariableData() {
      return JSON.stringify(this.variables);
    }

    importVariableData(args) {
      try {
        const data = JSON.parse(args.DATA);
        this.variables = {...data};
      } catch (e) {
        console.error('Error importing variable data:', e);
      }
    }

    // 随机相关函数
    randomNumberString(args) {
      const length = Math.max(1, Math.floor(args.LENGTH));
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10);
      }
      return result;
    }

    randomAlphaNumString(args) {
      const length = Math.max(1, Math.floor(args.LENGTH));
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    removeChar(args) {
      return args.TEXT.split(args.CHAR).join('');
    }

    convertTempSimple(args) {
      const temp = Number(args.TEMP);
      if (args.UNIT === 'fahrenheit') {
        return (temp * 9/5) + 32;
      } else {
        return (temp - 32) * 5/9;
      }
    }

    getDaysInMonth(args) {
      const year = args.YEAR;
      const month = args.MONTH;
      return new Date(year, month, 0).getDate();
    }

    isOnlyType(args) {
      const text = args.TEXT;
      if (args.TYPE === 'digits') {
        return /^\d+$/.test(text);
      } else if (args.TYPE === 'letters') {
        return /^[a-zA-Z]+$/.test(text);
      } else if (args.TYPE === 'chinese') {
        return /^[\u4e00-\u9fa5]+$/.test(text);
      }
      return false;
    }

    // 音频录制相关函数
    async startMicrophone() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/wav'
        });
        this.recorder.startRecording();
        this.recordingStartTime = new Date();
        return true;
      } catch (error) {
        console.error('无法启动麦克风:', error);
        return false;
      }
    }

    stopMicrophone() {
      if (this.recorder) {
        this.recorder.stopRecording(() => {
          this.recordingBlob = this.recorder.getBlob();
        });
      }
    }

    isMicrophoneReady() {
      return !!this.recorder;
    }

    getRecordingDuration() {
      if (!this.recordingStartTime) return 0;
      const currentTime = new Date();
      return Math.floor((currentTime - this.recordingStartTime) / 1000);
    }

    exportRecording(args) {
      if (!this.recordingBlob) return '';
      
      const format = args.FORMAT;
      let mimeType;
      
      if (format === 'mp3') {
        mimeType = 'audio/mp3';
      } else {
        mimeType = 'audio/wav';
      }
      
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(this.recordingBlob);
      });
    }

    // 语音识别相关函数
    startSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('浏览器不支持语音识别');
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'zh-CN';
      
      this.speechRecognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        this.recognizedText = finalTranscript;
        this.isRecognizing = true;
      };
      
      this.speechRecognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        this.isRecognizing = false;
      };
      
      this.speechRecognition.start();
    }

    stopSpeechRecognition() {
      if (this.speechRecognition) {
        this.speechRecognition.stop();
        this.isRecognizing = false;
      }
    }

    getSpeechResult() {
      return this.recognizedText || '';
    }

    isSpeechRecognizing() {
      return this.isRecognizing;
    }

    // 系统信息相关函数
    getOSName() {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Win')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
      return 'Unknown';
    }

    isTablet() {
      const userAgent = navigator.userAgent;
      return /iPad|Android.*Mobile|iPhone|Windows Phone|BlackBerry|BB10|PlayBook|IEMobile|Mobile|mobile/i.test(userAgent);
    }

    isLaptop() {
      const userAgent = navigator.userAgent;
      // 简单判断：不是移动端设备就认为是笔记本/台式机
      return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent);
    }

    getBatteryLevel() {
      return this.batteryLevel;
    }

    isCharging() {
      return this.chargingStatus;
    }

    getLastChargedTime() {
      return this.lastChargedTime.toLocaleString('zh-CN');
    }

    // 网络相关函数
    async httpRequest(args) {
      try {
        const response = await Scratch.fetch(args.URL);
        return await response.text();
      } catch (e) {
        return '';
      }
    }

    // 输入相关函数
    whenMouseDown(args) {
      if (args.BUTTON === 'left') {
        return this.mouseDown.left;
      } else if (args.BUTTON === 'middle') {
        return this.mouseDown.middle;
      } else if (args.BUTTON === 'right') {
        return this.mouseDown.right;
      }
      return false;
    }

    waitTimeUnit(args) {
      const time = Number(args.TIME);
      let milliseconds = 0;
      
      if (args.UNIT === 'minutes') {
        milliseconds = time * 60 * 1000;
      } else if (args.UNIT === 'hours') {
        milliseconds = time * 60 * 60 * 1000;
      } else if (args.UNIT === 'days') {
        milliseconds = time * 24 * 60 * 60 * 1000;
      }
      
      return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
      });
    }

    whenKeyPressed(args) {
      return this.keyPressed[args.KEY] === true;
    }

    goToWebpage(args) {
      window.location.href = args.URL;
    }

    openInNewTab(args) {
      window.open(args.URL, '_blank');
    }

    isOnline() {
      return navigator.onLine;
    }

    isMobileNetwork() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        const type = connection.effectiveType || connection.type;
        return ['cellular', 'wifi', 'bluetooth', 'wimax', 'ethernet'].includes(type);
      }
      return false;
    }

    screenResolution(args) {
      if (args.DIMENSION === 'width') {
        return window.screen.width;
      } else {
        return window.screen.height;
      }
    }

    // 弹窗相关函数
    showAlert(args) {
      alert(args.MESSAGE);
    }

    showPrompt(args) {
      return prompt(args.MESSAGE) || '';
    }

    showConfirm(args) {
      return confirm(args.MESSAGE);
    }

    // 文件相关函数
    stageSnapshot(args) {
      return new Promise(resolve => {
        Scratch.vm.runtime.renderer.requestSnapshot(dataUri => {
          resolve(dataUri);
        });
      });
    }

    openSingleFile() {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            this.selectedFiles = [file];
            resolve(file.name);
          } else {
            resolve('');
          }
        };
        input.click();
      });
    }

    openMultipleFiles() {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
          const files = Array.from(e.target.files);
          this.selectedFiles = files;
          resolve(files.length);
        };
        input.click();
      });
    }

    getFileCount() {
      return this.selectedFiles.length;
    }

    getAllFileNames() {
      return this.selectedFiles.map(f => f.name).join(',');
    }

    getFileInfo(args) {
      const index = args.INDEX - 1;
      if (index < 0 || index >= this.selectedFiles.length) return '';
      
      const file = this.selectedFiles[index];
      const property = args.PROPERTY;
      
      switch (property) {
        case 'name': return file.name;
        case 'size': 
          const size = file.size;
          if (size < 1024) return size + ' B';
          if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
          if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
          return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        case 'mtime': return new Date(file.lastModified).toLocaleString();
        case 'ctime': return new Date(file.lastModified).toLocaleString();
        case 'extension': return file.name.split('.').pop();
        case 'dataurl':
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        case 'text':
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsText(file);
          });
        case 'json':
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                resolve(JSON.stringify(JSON.parse(reader.result)));
              } catch (e) {
                resolve('');
              }
            };
            reader.readAsText(file);
          });
        case 'xml':
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsText(file);
          });
        case 'img_width':
        case 'img_height':
          return new Promise(resolve => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                  resolve(property === 'img_width' ? img.width : img.height);
                };
                img.src = reader.result;
              };
              reader.readAsDataURL(file);
            } else {
              resolve(0);
            }
          });
        case 'duration':
          return new Promise(resolve => {
            if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
              const reader = new FileReader();
              reader.onload = () => {
                const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
                media.preload = 'metadata';
                media.onloadedmetadata = () => {
                  resolve(media.duration);
                };
                media.src = reader.result;
              };
              reader.readAsDataURL(file);
            } else {
              resolve(0);
            }
          });
        default: return '';
      }
    }

    downloadText(args) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(args.TEXT));
      element.setAttribute('download', args.FILENAME);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    downloadDataUrl(args) {
      const element = document.createElement('a');
      element.setAttribute('href', args.DATA_URL);
      element.setAttribute('download', args.FILENAME);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    // 角色造型声音相关函数
    async addSpriteFromUrl(args) {
      try {
        const response = await Scratch.fetch(args.URL);
        const arrayBuffer = await response.arrayBuffer();
        await Scratch.vm.addSprite(arrayBuffer);
      } catch (e) {
        console.error('Error adding sprite:', e);
      }
    }

    async addCostumeFromUrl(args) {
      try {
        const response = await Scratch.fetch(args.URL);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        const assetType = blob.type.startsWith('image/svg') ? 
          Scratch.vm.runtime.storage.AssetType.ImageVector : 
          Scratch.vm.runtime.storage.AssetType.ImageBitmap;
          
        const dataFormat = blob.type.startsWith('image/svg') ? 
          Scratch.vm.runtime.storage.DataFormat.SVG : 
          Scratch.vm.runtime.storage.DataFormat.PNG;
          
        const asset = Scratch.vm.runtime.storage.createAsset(
          assetType,
          dataFormat,
          new Uint8Array(arrayBuffer),
          null,
          true
        );
        
        await Scratch.vm.addCostume(
          `${asset.assetId}.${dataFormat}`,
          {
            asset,
            name: args.NAME
          },
          Scratch.vm.editingTarget.id
        );
      } catch (e) {
        console.error('Error adding costume:', e);
      }
    }

    async addSoundFromUrl(args) {
      try {
        const response = await Scratch.fetch(args.URL);
        const arrayBuffer = await response.arrayBuffer();
        
        const asset = Scratch.vm.runtime.storage.createAsset(
          Scratch.vm.runtime.storage.AssetType.Sound,
          Scratch.vm.runtime.storage.DataFormat.MP3,
          new Uint8Array(arrayBuffer),
          null,
          true
        );
        
        await Scratch.vm.addSound(
          {
            asset,
            name: args.NAME
          },
          Scratch.vm.editingTarget.id
        );
      } catch (e) {
        console.error('Error adding sound:', e);
      }
    }

    deleteSprite(args) {
      const target = Scratch.vm.runtime.getSpriteTargetByName(args.NAME);
      if (target && !target.isStage) {
        Scratch.vm.deleteSprite(target.id);
      }
    }

    deleteAllSprites() {
      const targets = [...Scratch.vm.runtime.targets];
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          Scratch.vm.deleteSprite(target.id);
        }
      }
    }

    deleteAllSpritesExcept(args) {
      const targets = [...Scratch.vm.runtime.targets];
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          if (!target.sprite.name.includes(args.CONTAINS)) {
            Scratch.vm.deleteSprite(target.id);
          }
        }
      }
    }

    deleteSpritesContaining(args) {
      const targets = [...Scratch.vm.runtime.targets];
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          if (target.sprite.name.includes(args.CONTAINS)) {
            Scratch.vm.deleteSprite(target.id);
          }
        }
      }
    }

    deleteCostume(args) {
      const target = Scratch.vm.editingTarget;
      const costumeIndex = target.getCostumeIndexByName(args.NAME);
      if (costumeIndex !== -1) {
        target.deleteCostume(costumeIndex);
      }
    }

    deleteAllCostumes() {
      const target = Scratch.vm.editingTarget;
      while (target.sprite.costumes.length > 1) {
        target.deleteCostume(0);
      }
    }

    deleteAllCostumesExcept(args) {
      const target = Scratch.vm.editingTarget;
      const costumesToDelete = [];
      
      for (let i = 0; i < target.sprite.costumes.length; i++) {
        if (!target.sprite.costumes[i].name.includes(args.CONTAINS)) {
          costumesToDelete.unshift(i);
        }
      }
      
      for (const index of costumesToDelete) {
        target.deleteCostume(index);
      }
    }

    deleteSound(args) {
      const target = Scratch.vm.editingTarget;
      const soundIndex = this._getSoundIndexByName(args.NAME, target);
      if (soundIndex !== -1) {
        target.deleteSound(soundIndex);
      }
    }

    deleteAllSounds() {
      const target = Scratch.vm.editingTarget;
      while (target.sprite.sounds.length > 0) {
        target.deleteSound(0);
      }
    }

    deleteAllSoundsExcept(args) {
      const target = Scratch.vm.editingTarget;
      const soundsToDelete = [];
      
      for (let i = 0; i < target.sprite.sounds.length; i++) {
        if (!target.sprite.sounds[i].name.includes(args.CONTAINS)) {
          soundsToDelete.unshift(i);
        }
      }
      
      for (const index of soundsToDelete) {
        target.deleteSound(index);
      }
    }

    getAllSprites(args) {
      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          spriteNames.push(target.sprite.name);
        }
      }
      
      if (args.INFO === 'names') {
        return JSON.stringify(spriteNames);
      } else {
        return spriteNames.length;
      }
    }

    getAllCostumes(args) {
      const costumeNames = [];
      const target = Scratch.vm.editingTarget;
      for (const costume of target.sprite.costumes) {
        costumeNames.push(costume.name);
      }
      
      if (args.INFO === 'names') {
        return JSON.stringify(costumeNames);
      } else {
        return costumeNames.length;
      }
    }

    getAllSounds(args) {
      const soundNames = [];
      const target = Scratch.vm.editingTarget;
      for (const sound of target.sprite.sounds) {
        soundNames.push(sound.name);
      }
      
      if (args.INFO === 'names') {
        return JSON.stringify(soundNames);
      } else {
        return soundNames.length;
      }
    }

    getTargetInfo(args) {
      const target = Scratch.vm.editingTarget;
      if (args.INFO === 'name') {
        return target.sprite.name;
      } else {
        return new Promise(resolve => {
          Scratch.vm.exportSprite(target.id).then(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        });
      }
    }

    renameSprite(args) {
      const target = Scratch.vm.runtime.getSpriteTargetByName(args.OLD_NAME);
      if (target && !target.isStage) {
        target.sprite.name = args.NEW_NAME;
      }
    }

    renameSound(args) {
      const target = Scratch.vm.editingTarget;
      const soundIndex = this._getSoundIndexByName(args.OLD_NAME, target);
      if (soundIndex !== -1) {
        target.renameSound(soundIndex, args.NEW_NAME);
      }
    }

    renameCostume(args) {
      const target = Scratch.vm.editingTarget;
      const costumeIndex = target.getCostumeIndexByName(args.OLD_NAME);
      if (costumeIndex !== -1) {
        target.renameCostume(costumeIndex, args.NEW_NAME);
      }
    }

    // 辅助函数
    _getSoundIndexByName(soundName, target) {
      for (let i = 0; i < target.sprite.sounds.length; i++) {
        if (target.sprite.sounds[i].name === soundName) {
          return i;
        }
      }
      return -1;
    }
  }

  Scratch.extensions.register(new ZxTools4());
})(Scratch);