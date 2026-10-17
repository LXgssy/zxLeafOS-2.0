// Name: Advanced Monaco Code Editor with Custom Colors and Syntax Completion
// ID: advancedMonacoEditor
// Description: 基于 Monaco Editor 的高性能代码编辑器，支持自定义颜色、语法补全、精确坐标定位、多种语言运行等功能
// License: MIT
// 要求: unsandboxed

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("此扩展必须在非沙盒环境中运行");
  }

  // === 全局状态 ===
  const editors = new Map(); // 存储编辑器实例
  let monacoLoaded = false;
  let loadingPromise = null;
  const iframes = {}; // 存储HTML iframe实例
  let skulptLoaded = false;
  let skulptLoadStartTime = null;
  let skulptLoadComplete = false;
  let skulptLoadError = null;
  let skulptLoadTime = 0;
  
  // 运行结果存储
  const runResults = new Map();

  // === Material You 风格主题配置 ===
  const materialYouThemes = {
    "light": {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f0f0f0',
        'editor.selectionBackground': '#add8e6',
        'editorCursor.foreground': '#000000',
        'editor.lineNumbers': '#888888',
        'editorLineNumber.activeForeground': '#000000',
        'editorBracketMatch.background': '#ffff0022',
        'editorBracketMatch.border': '#d0d0d0'
      }
    },
    "dark": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#121212',
        'editor.foreground': '#e0e0e0',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#ffffff',
        'editor.lineNumbers': '#888888',
        'editorLineNumber.activeForeground': '#cccccc',
        'editorBracketMatch.background': '#404040',
        'editorBracketMatch.border': '#888888'
      }
    },
    "blue": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0D47A1',
        'editor.foreground': '#E3F2FD',
        'editor.lineHighlightBackground': '#1565C0',
        'editor.selectionBackground': '#1976D2',
        'editorCursor.foreground': '#FFEB3B',
        'editor.lineNumbers': '#BBDEFB',
        'editorLineNumber.activeForeground': '#E1F5FE',
        'editorBracketMatch.background': '#1E88E5',
        'editorBracketMatch.border': '#64B5F6'
      }
    },
    "green": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1B5E20',
        'editor.foreground': '#E8F5E8',
        'editor.lineHighlightBackground': '#2E7D32',
        'editor.selectionBackground': '#388E3C',
        'editorCursor.foreground': '#FFEB3B',
        'editor.lineNumbers': '#A5D6A7',
        'editorLineNumber.activeForeground': '#C8E6C9',
        'editorBracketMatch.background': '#4CAF50',
        'editorBracketMatch.border': '#81C784'
      }
    },
    "purple": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#4A148C',
        'editor.foreground': '#F3E5F5',
        'editor.lineHighlightBackground': '#6A1B9A',
        'editor.selectionBackground': '#7B1FA2',
        'editorCursor.foreground': '#FFEB3B',
        'editor.lineNumbers': '#CE93D8',
        'editorLineNumber.activeForeground': '#E1BEE7',
        'editorBracketMatch.background': '#9C27B0',
        'editorBracketMatch.border': '#BA68C8'
      }
    },
    "orange": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#E65100',
        'editor.foreground': '#FFF3E0',
        'editor.lineHighlightBackground': '#F57C00',
        'editor.selectionBackground': '#EF6C00',
        'editorCursor.foreground': '#212121',
        'editor.lineNumbers': '#FFCC80',
        'editorLineNumber.activeForeground': '#FFE0B2',
        'editorBracketMatch.background': '#FF9800',
        'editorBracketMatch.border': '#FFB74D'
      }
    },
    "pink": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#AD1457',
        'editor.foreground': '#FCE4EC',
        'editor.lineHighlightBackground': '#C2185B',
        'editor.selectionBackground': '#D81B60',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineNumbers': '#F48FB1',
        'editorLineNumber.activeForeground': '#F8BBD9',
        'editorBracketMatch.background': '#E91E63',
        'editorBracketMatch.border': '#F06292'
      }
    },
    "teal": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#004D40',
        'editor.foreground': '#E0F2F1',
        'editor.lineHighlightBackground': '#00695C',
        'editor.selectionBackground': '#00796B',
        'editorCursor.foreground': '#FFEB3B',
        'editor.lineNumbers': '#80CBC4',
        'editorLineNumber.activeForeground': '#A7FFEB',
        'editorBracketMatch.background': '#009688',
        'editorBracketMatch.border': '#26A69A'
      }
    },
    "brown": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#3E2723',
        'editor.foreground': '#EFEBE9',
        'editor.lineHighlightBackground': '#5D4037',
        'editor.selectionBackground': '#6D4C41',
        'editorCursor.foreground': '#FFEB3B',
        'editor.lineNumbers': '#BCAAA4',
        'editorLineNumber.activeForeground': '#D7CCC8',
        'editorBracketMatch.background': '#795548',
        'editorBracketMatch.border': '#A1887F'
      }
    },
    "highContrast": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#333333',
        'editor.selectionBackground': '#00FFFF',
        'editorCursor.foreground': '#FF0000',
        'editor.lineNumbers': '#AAAAAA',
        'editorLineNumber.activeForeground': '#FFFFFF',
        'editorBracketMatch.background': '#FFFF00',
        'editorBracketMatch.border': '#FFFFFF'
      }
    },
    "materialYou": {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#e0e0e0',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editor.selectionBackground': '#3a3d41',
        'editorCursor.foreground': '#5ac1a8', // Material You 绿松石色
        'editor.lineNumbers': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorBracketMatch.background': '#3a3d41',
        'editorBracketMatch.border': '#888888',
        'editorSuggestWidget.background': '#252526',
        'editorSuggestWidget.border': '#454545',
        'editorHoverWidget.background': '#252526',
        'editorHoverWidget.border': '#454545'
      }
    }
  };

  // === 默认配置 ===
  const defaultConfig = {
    language: 'javascript',
    theme: 'materialYou', // 默认Material You主题
    fontSize: 14,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    lineNumbers: true,
    highlightActiveLine: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    x: 0, // Scratch坐标系中的X位置
    y: 0, // Scratch坐标系中的Y位置
    width: 360, // 默认宽度
    height: 270, // 默认高度
    visible: true,
    zIndex: 1000,
    readOnly: false,
    showGutter: true,
    foldGutter: false,
    lint: false,
    autocomplete: true,
    lineHighlight: true,
    selectionPointer: true,
    dragScroll: true,
    allowDropFile: false,
    renderIndentGuides: true,
    folding: false,
    bracketPairColorization: false,
    minimap: false, // 默认关闭迷你地图
    mouseWheelZoom: false,
    zoomLevel: 1.0,
    maxLines: 10000, // ✅ 已改为 10000
    currentLine: 1,
    currentColumn: 1,
    value: '', // 创建时默认为空
    customBackground: null, // 自定义背景图片DataURL
    backgroundOpacity: 0.3, // 背景透明度
    customFontColor: '#e0e0e0', // 自定义字体颜色
    customBackgroundColor: null // 自定义背景颜色
  };

  // === 语言映射 ===
  const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'html': 'html',
    'css': 'css',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'sql': 'sql',
    'json': 'json',
    'xml': 'xml',
    'markdown': 'markdown',
    'typescript': 'typescript',
    'go': 'go',
    'ruby': 'ruby',
    'rust': 'rust',
    'shell': 'shell',
    'lua': 'lua',
    'yaml': 'yaml',
    'plaintext': 'plaintext'
  };

  // === 语法补全词典 ===
  const syntaxCompletions = {
    javascript: [
      { label: 'console.log()', insertText: 'console.log()', detail: '打印日志' },
      { label: 'function', insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}', detail: '函数声明' },
      { label: 'if', insertText: 'if (${1:condition}) {\n\t${2}\n}', detail: '条件判断' },
      { label: 'for', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3}\n}', detail: '循环' },
      { label: 'var', insertText: 'var ${1:name} = ${2:value};', detail: '变量声明' },
      { label: 'let', insertText: 'let ${1:name} = ${2:value};', detail: '变量声明' },
      { label: 'const', insertText: 'const ${1:name} = ${2:value};', detail: '常量声明' },
      { label: 'array.forEach', insertText: '${1:array}.forEach((${2:item}) => {\n\t${3}\n});', detail: '数组遍历' },
      { label: 'setTimeout', insertText: 'setTimeout(() => {\n\t${2}\n}, ${1:delay});', detail: '延时执行' },
      { label: 'addEventListener', insertText: '${1:element}.addEventListener(\'${2:event}\', function() {\n\t${3}\n});', detail: '事件监听' }
    ],
    python: [
      { label: 'print()', insertText: 'print(${1:text})', detail: '打印输出' },
      { label: 'def', insertText: 'def ${1:name}(${2:params}):\n\t${3}', detail: '函数定义' },
      { label: 'if', insertText: 'if ${1:condition}:\n\t${2}', detail: '条件判断' },
      { label: 'for', insertText: 'for ${1:item} in ${2:iterable}:\n\t${3}', detail: '循环' },
      { label: 'while', insertText: 'while ${1:condition}:\n\t${2}', detail: '循环' },
      { label: 'import', insertText: 'import ${1:module}', detail: '导入模块' },
      { label: 'class', insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:params}):\n\t\t${3}', detail: '类定义' },
      { label: 'try-except', insertText: 'try:\n\t${1}\nexcept ${2:Exception} as e:\n\t${3}', detail: '异常处理' },
      { label: 'list comprehension', insertText: '[${1:expression} for ${2:item} in ${3:iterable}]', detail: '列表推导式' },
      { label: 'with open', insertText: 'with open("${1:filename}", "${2:r}") as f:\n\t${3}', detail: '文件操作' },
      { label: 'from import', insertText: 'from ${1:module} import ${2:item}', detail: '从模块导入' },
      { label: 'for range', insertText: 'for ${1:i} in range(${2:start}, ${3:end}):\n\t${4}', detail: 'range循环' },
      { label: 'lambda', insertText: 'lambda ${1:x}: ${2:x}', detail: '匿名函数' },
      { label: 'try-except-finally', insertText: 'try:\n\t${1}\nexcept ${2:Exception} as e:\n\t${3}\nfinally:\n\t${4}', detail: '异常处理' },
      { label: 'if __name__ == "__main__"', insertText: 'if __name__ == "__main__":\n\t${1}', detail: '主程序入口' }
    ],
    html: [
      { label: '<div>', insertText: '<div>\n\t${1}\n</div>', detail: '块级元素' },
      { label: '<span>', insertText: '<span>${1}</span>', detail: '行内元素' },
      { label: '<p>', insertText: '<p>${1}</p>', detail: '段落' },
      { label: '<a>', insertText: '<a href="${1:url}">${2:text}</a>', detail: '链接' },
      { label: '<img>', insertText: '<img src="${1:src}" alt="${2:alt}">', detail: '图片' },
      { label: '<button>', insertText: '<button>${1:click me}</button>', detail: '按钮' },
      { label: '<ul>', insertText: '<ul>\n\t<li>${1}</li>\n</ul>', detail: '无序列表' },
      { label: '<ol>', insertText: '<ol>\n\t<li>${1}</li>\n</ol>', detail: '有序列表' },
      { label: '<table>', insertText: '<table>\n\t<tr>\n\t\t<td>${1}</td>\n\t</tr>\n</table>', detail: '表格' },
      { label: '<form>', insertText: '<form action="${1:action}" method="${2:post}">\n\t${3}\n</form>', detail: '表单' },
      { label: '<input>', insertText: '<input type="${1:text}" name="${2:name}" value="${3:value}">', detail: '输入框' },
      { label: '<header>', insertText: '<header>\n\t${1}\n</header>', detail: '页眉' },
      { label: '<nav>', insertText: '<nav>\n\t${1}\n</nav>', detail: '导航' },
      { label: '<footer>', insertText: '<footer>\n\t${1}\n</footer>', detail: '页脚' },
      { label: '<section>', insertText: '<section>\n\t${1}\n</section>', detail: '区域' },
      { label: '<article>', insertText: '<article>\n\t${1}\n</article>', detail: '文章' },
      { label: '<aside>', insertText: '<aside>\n\t${1}\n</aside>', detail: '侧边栏' },
      { label: '<main>', insertText: '<main>\n\t${1}\n</main>', detail: '主要内容' },
      { label: '<h1>', insertText: '<h1>${1}</h1>', detail: '标题1' },
      { label: '<h2>', insertText: '<h2>${1}</h2>', detail: '标题2' },
      { label: '<h3>', insertText: '<h3>${1}</h3>', detail: '标题3' }
    ],
    c: [
      { label: '#include', insertText: '#include <${1:stdio.h}>', detail: '头文件包含' },
      { label: 'main', insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', detail: '主函数' },
      { label: 'printf', insertText: 'printf("${1:format}", ${2:variables});', detail: '输出函数' },
      { label: 'scanf', insertText: 'scanf("${1:format}", &${2:variable});', detail: '输入函数' },
      { label: 'for loop', insertText: 'for(int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n\t${3}\n}', detail: 'for循环' },
      { label: 'while loop', insertText: 'while(${1:condition}) {\n\t${2}\n}', detail: 'while循环' },
      { label: 'if statement', insertText: 'if(${1:condition}) {\n\t${2}\n}', detail: 'if语句' },
      { label: 'function', insertText: '${1:int} ${2:function_name}(${3:parameters}) {\n\t${4}\n}', detail: '函数定义' },
      { label: 'struct', insertText: 'struct ${1:struct_name} {\n\t${2}\n};', detail: '结构体定义' },
      { label: 'typedef struct', insertText: 'typedef struct {\n\t${1}\n} ${2:type_name};', detail: '类型定义' },
      { label: 'enum', insertText: 'enum ${1:enum_name} {\n\t${2}\n};', detail: '枚举定义' },
      { label: 'switch', insertText: 'switch(${1:expression}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n}', detail: 'switch语句' },
      { label: 'malloc', insertText: '${1:type} *${2:ptr} = (${1:type}*)malloc(sizeof(${1:type}) * ${3:size});', detail: '内存分配' },
      { label: 'free', insertText: 'free(${1:pointer});', detail: '内存释放' },
      { label: 'do-while', insertText: 'do {\n\t${1}\n} while(${2:condition});', detail: 'do-while循环' }
    ],
    java: [
      { label: 'System.out.println', insertText: 'System.out.println("${1:text}");', detail: '打印输出' },
      { label: 'main method', insertText: 'public static void main(String[] args) {\n\t${1}\n}', detail: '主方法' },
      { label: 'class', insertText: 'public class ${1:ClassName} {\n\t${2}\n}', detail: '类定义' },
      { label: 'method', insertText: 'public ${1:void} ${2:methodName}(${3:parameters}) {\n\t${4}\n}', detail: '方法定义' },
      { label: 'if', insertText: 'if (${1:condition}) {\n\t${2}\n}', detail: '条件判断' },
      { label: 'for loop', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3}\n}', detail: 'for循环' },
      { label: 'enhanced for', insertText: 'for (${1:type} ${2:var} : ${3:collection}) {\n\t${4}\n}', detail: '增强for循环' },
      { label: 'while loop', insertText: 'while (${1:condition}) {\n\t${2}\n}', detail: 'while循环' },
      { label: 'try-catch', insertText: 'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3}\n}', detail: '异常处理' },
      { label: 'interface', insertText: 'public interface ${1:InterfaceName} {\n\t${2}\n}', detail: '接口定义' },
      { label: 'extends', insertText: 'public class ${1:SubClass} extends ${2:SuperClass} {\n\t${3}\n}', detail: '继承' },
      { label: 'implements', insertText: 'public class ${1:ClassName} implements ${2:InterfaceName} {\n\t${3}\n}', detail: '实现接口' },
      { label: 'constructor', insertText: 'public ${1:ClassName}() {\n\t${2}\n}', detail: '构造函数' },
      { label: 'getter/setter', insertText: 'public ${1:type} get${2:Property}() {\n\treturn ${3:property};\n}\n\npublic void set${2:Property}(${1:type} ${3:property}) {\n\tthis.${3:property} = ${3:property};\n}', detail: 'getter/setter' }
    ]
  };

  // === 加载 Monaco（带缓存，避免重复加载）===
  const loadMonaco = () => {
    if (monacoLoaded) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
      if (window.monaco) {
        monacoLoaded = true;
        return resolve();
      }

      // 预加载 CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/editor/editor.main.css';
      document.head.appendChild(cssLink);

      // 加载 RequireJS + Monaco
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
      script.onload = () => {
        window.require.config({
          paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' }
        });
        window.require(['vs/editor/editor.main'], () => {
          monacoLoaded = true;
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return loadingPromise;
  };

  // === 加载 Skulpt ===
  const loadSkulpt = () => {
    if (skulptLoaded) return Promise.resolve();
    if (skulptLoadComplete) return Promise.reject(skulptLoadError || new Error('Skulpt failed to load'));

    if (skulptLoadStartTime === null) {
      skulptLoadStartTime = Date.now();
    }

    return new Promise((resolve, reject) => {
      if (window.skulpt) {
        skulptLoaded = true;
        skulptLoadComplete = true;
        skulptLoadTime = Date.now() - skulptLoadStartTime;
        return resolve();
      }

      // 加载 Skulpt
      const skulptScript = document.createElement('script');
      skulptScript.src = 'https://cdn.jsdelivr.net/npm/skulpt@0.11.0/dist/skulpt.min.js';
      skulptScript.onload = () => {
        const skulptStdlib = document.createElement('script');
        skulptStdlib.src = 'https://cdn.jsdelivr.net/npm/skulpt@0.11.0/dist/skulpt-stdlib.min.js';
        skulptStdlib.onload = () => {
          skulptLoaded = true;
          skulptLoadComplete = true;
          skulptLoadTime = Date.now() - skulptLoadStartTime;
          resolve();
        };
        skulptStdlib.onerror = () => {
          skulptLoadComplete = true;
          skulptLoadError = 'Failed to load Skulpt stdlib';
          reject(new Error(skulptLoadError));
        };
        document.head.appendChild(skulptStdlib);
      };
      skulptScript.onerror = () => {
        skulptLoadComplete = true;
        skulptLoadError = 'Failed to load Skulpt';
        reject(new Error(skulptLoadError));
      };
      document.head.appendChild(skulptScript);
    });
  };

  // === 创建编辑器实例 ===
  const createEditorInstance = async (id, container, config) => {
    await loadMonaco();

    // 注册所有Material You主题
    for (const [themeName, themeData] of Object.entries(materialYouThemes)) {
      monaco.editor.defineTheme(themeName, themeData);
    }

    // 设置容器样式（关键：确保可交互）
    container.style.position = 'absolute';
    container.style.pointerEvents = 'auto';
    container.style.transformOrigin = 'top left';

    // 复用或创建模型
    const modelUri = monaco.Uri.parse(`scratch-monaco-model-${id}`);
    let model = monaco.editor.getModel(modelUri);
    if (!model) {
      model = monaco.editor.createModel(
        config.value || '',
        languageMap[config.language] || 'plaintext',
        modelUri
      );
    }

    // 创建编辑器
    const editor = monaco.editor.create(container, {
      model: model,
      theme: config.theme,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      lineHeight: 1.5,
      lineNumbers: config.lineNumbers ? 'on' : 'off',
      glyphMargin: config.foldGutter,
      readOnly: config.readOnly,
      wordWrap: config.lineWrapping ? 'on' : 'off',
      tabSize: config.tabSize,
      insertSpaces: !config.indentWithTabs,
      automaticLayout: true,
      highlightActiveLine: config.highlightActiveLine ? 'line' : 'none',
      matchBrackets: config.matchBrackets ? 'always' : 'never',
      autoClosingBrackets: config.autoCloseBrackets ? 'languageDefined' : 'never',
      renderIndentGuides: config.renderIndentGuides,
      folding: config.folding,
      bracketPairColorization: { enabled: config.bracketPairColorization },
      minimap: { enabled: config.minimap },
      mouseWheelZoom: config.mouseWheelZoom,
      scrollBeyondLastLine: false,
      dragAndDrop: config.dragScroll,
      scrollbar: { vertical: 'auto', horizontal: 'auto' },
      overviewRulerLanes: 2,
      cursorBlinking: 'blink',
      occurrencesHighlight: 'single',
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showFields: true,
        showFiles: true,
        showReferences: true,
        showColors: true,
        showFolders: true,
        showTypeParameters: true,
        showIssues: true
      }
    });

    // 设置自定义背景
    if (config.customBackground) {
      container.style.backgroundImage = `url(${config.customBackground})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.backgroundRepeat = 'no-repeat';
      container.style.opacity = config.backgroundOpacity;
    }

    // 监听光标位置
    editor.onDidChangeCursorPosition((e) => {
      if (editors.has(id)) {
        const data = editors.get(id);
        data.config.currentLine = e.position.lineNumber;
        data.config.currentColumn = e.position.column;
      }
    });

    // 监听选择更改以跟踪选中文本
    editor.onDidChangeCursorSelection((e) => {
      if (editors.has(id)) {
        const data = editors.get(id);
        data.selectedText = e.selection.toString();
      }
    });

    // 限制最大行数（高效方式）
    editor.onDidChangeModelContent(() => {
      const data = editors.get(id);
      if (!data) return;
      const model = editor.getModel();
      const lineCount = model.getLineCount();
      if (lineCount > data.config.maxLines) {
        const range = new monaco.Range(data.config.maxLines + 1, 1, lineCount, model.getLineMaxColumn(lineCount));
        model.pushEditOperations([], [{ range, text: '' }], () => null);
      }
    });

    // 注册语法补全
    if (syntaxCompletions[config.language]) {
      monaco.languages.registerCompletionItemProvider(config.language, {
        provideCompletionItems: function(model, position) {
          const suggestions = syntaxCompletions[config.language].map(item => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: item.detail,
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
          }));
          return { suggestions: suggestions };
        }
      });
    }

    return { editor, model };
  };

  // === 更新编辑器样式与配置 ===
  const updateEditorDisplay = (id) => {
    const editorData = editors.get(id);
    if (!editorData) return;

    const { container, editor, config } = editorData;
    const { stageWidth, stageHeight } = Scratch.vm.runtime;

    const effectiveWidth = config.width >= 0 ? config.width : stageWidth;
    const effectiveHeight = config.height >= 0 ? config.height : stageHeight;

    // 容器尺寸与可见性
    container.style.width = `${effectiveWidth}px`;
    container.style.height = `${effectiveHeight}px`;
    container.style.display = config.visible ? 'block' : 'none';
    container.style.zIndex = String(config.zIndex);

    // --- 与Iframe Plus相同的坐标变换逻辑 ---
    // 保持与iframe扩展一致的定位方式
    if (config.resizeBehavior === "scale") {
      container.style.width = `${effectiveWidth}px`;
      container.style.height = `${effectiveHeight}px`;

      container.style.transform = `translate(${-effectiveWidth / 2 + config.x}px, ${-effectiveHeight / 2 - config.y}px)`;
      container.style.top = "0";
      container.style.left = "0";
    } else {
      container.style.width = `${(effectiveWidth / stageWidth) * 100}%`;
      container.style.height = `${(effectiveHeight / stageHeight) * 100}%`;

      container.style.transform = "";
      container.style.top = `${(0.5 - effectiveHeight / 2 / stageHeight - config.y / stageHeight) * 100}%`;
      container.style.left = `${(0.5 - effectiveWidth / 2 / stageWidth + config.x / stageWidth) * 100}%`;
    }

    // 更新编辑器选项
    editor.updateOptions({
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      lineNumbers: config.lineNumbers ? 'on' : 'off',
      wordWrap: config.lineWrapping ? 'on' : 'off',
      readOnly: config.readOnly,
      tabSize: config.tabSize,
      insertSpaces: !config.indentWithTabs,
      highlightActiveLine: config.highlightActiveLine ? 'line' : 'none',
      matchBrackets: config.matchBrackets ? 'always' : 'never',
      autoClosingBrackets: config.autoCloseBrackets ? 'languageDefined' : 'never',
      glyphMargin: config.foldGutter,
      renderIndentGuides: config.renderIndentGuides,
      folding: config.folding,
      bracketPairColorization: { enabled: config.bracketPairColorization },
      minimap: { enabled: config.minimap },
      mouseWheelZoom: config.mouseWheelZoom
    });

    // 切换语言
    if (config.language !== editorData._currentLanguage) {
      const newLang = languageMap[config.language] || 'plaintext';
      monaco.editor.setModelLanguage(editor.getModel(), newLang);
      editorData._currentLanguage = config.language;
    }

    // 应用主题
    monaco.editor.setTheme(config.theme);

    // 更新内部配置
    editors.set(id, { ...editorData, config });
  };

  // === 创建HTML iframe（参考iframe扩展）===
  const createHTMLFrame = (src, name, isHTMLContent = false) => {
    // 如果同名的iframe已存在，先关闭它
    if (iframes[name]) {
      closeHTMLFrame(name);
    }

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.position = "absolute";
    iframe.style.display = "block"; // 确保iframe显示
    
    // 设置sandbox属性，允许更多交互功能
    const SANDBOX = [
      "allow-same-origin",
      "allow-scripts",
      "allow-forms",
      "allow-modals",
      "allow-popups",
      "allow-downloads",
      "allow-pointer-lock"
    ];
    iframe.setAttribute("sandbox", SANDBOX.join(" "));

    // 特性策略
    const featurePolicy = {
      accelerometer: "'none'",
      "ambient-light-sensor": "'none'",
      battery: "'none'",
      camera: "'none'",
      "display-capture": "'none'",
      "document-domain": "'none'",
      "encrypted-media": "'none'",
      fullscreen: "'none'",
      geolocation: "'none'",
      gyroscope: "'none'",
      magnetometer: "'none'",
      microphone: "'none'",
      midi: "'none'",
      payment: "'none'",
      "picture-in-picture": "'none'",
      "publickey-credentials-get": "'none'",
      "speaker-selection": "'none'",
      usb: "'none'",
      vibrate: "'none'",
      vr: "'none'",
      "screen-wake-lock": "'none'",
      "web-share": "'none'",
      "interest-cohort": "'none'",
    };
    iframe.setAttribute("allow", Object.entries(featurePolicy)
      .map(([name, permission]) => `${name} ${permission}`)
      .join("; ")
    );

    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("allowfullscreen", "false");

    // 修复链接跳转问题
    iframe.addEventListener("load", () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const links = iframeDoc.querySelectorAll("a");
        
        links.forEach(link => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href) {
              // 在同一个iframe中打开链接
              iframe.contentWindow.location.href = href;
            }
          });
          
          // 移除target属性防止新窗口打开
          link.removeAttribute("target");
        });
      } catch (error) {
        // 跨域问题，无法访问iframe内部
      }
    });

    if (isHTMLContent) {
      // 对于HTML内容，使用srcdoc属性而不是src
      iframe.setAttribute("srcdoc", src);
      iframe.setAttribute("src", "about:blank"); // 防止某些浏览器的安全限制
    } else {
      iframe.setAttribute("src", src);
    }

    const overlay = Scratch.renderer.addOverlay(iframe, "scale-centered");
    
    iframes[name] = {
      iframe,
      overlay,
      name,
      url: src,
      visible: true,
      interactive: true,
      resizeBehavior: "scale",
      x: 0,
      y: 0,
      width: Scratch.vm.runtime.stageWidth,
      height: Scratch.vm.runtime.stageHeight
    };

    updateHTMLFrameAttributes(name);
  };

  const closeHTMLFrame = (name) => {
    if (iframes[name]) {
      Scratch.renderer.removeOverlay(iframes[name].iframe);
      delete iframes[name];
    }
  };

  const updateHTMLFrameAttributes = (name) => {
    if (!iframes[name]) return;

    const { iframe, x, y, width, height, interactive, resizeBehavior } = iframes[name];
    
    iframe.style.pointerEvents = interactive ? "auto" : "none";
    iframe.style.display = iframes[name].visible ? "block" : "none";

    const { stageWidth, stageHeight } = Scratch.vm.runtime;
    const effectiveWidth = width >= 0 ? width : stageWidth;
    const effectiveHeight = height >= 0 ? height : stageHeight;

    if (resizeBehavior === "scale") {
      iframe.style.width = `${effectiveWidth}px`;
      iframe.style.height = `${effectiveHeight}px`;

      iframe.style.transform = `translate(${-effectiveWidth / 2 + x}px, ${-effectiveHeight / 2 - y}px)`;
      iframe.style.top = "0";
      iframe.style.left = "0";
    } else {
      // As the stage is resized in fullscreen mode, only % can be relied upon
      iframe.style.width = `${(effectiveWidth / stageWidth) * 100}%`;
      iframe.style.height = `${(effectiveHeight / stageHeight) * 100}%`;

      iframe.style.transform = "";
      iframe.style.top = `${(0.5 - effectiveHeight / 2 / stageHeight - y / stageHeight) * 100}%`;
      iframe.style.left = `${(0.5 - effectiveWidth / 2 / stageWidth + x / stageWidth) * 100}%`;
    }
  };

  // === 运行代码功能 ===
  const runCode = async (code, language, id) => {
    // 检查Monaco是否已加载
    if (!monacoLoaded) {
      return { success: false, result: 'Monaco Editor 正在加载，请稍后再试', error: 'Monaco not loaded' };
    }

    try {
      if (language === 'javascript') {
        // 使用 iframe 沙箱运行 JS，防止污染全局环境
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        let output = '';
        const iframeConsole = {
          log: (...args) => {
            output += args.join(' ') + '\n';
          }
        };
        
        const iframeDoc = iframe.contentDocument;
        iframeDoc.open();
        iframeDoc.write(`
          <script>
            window.console = {
              log: function(...args) {
                parent.postMessage({type: 'log', id: '${id}', args: args}, '*');
              }
            };
            try {
              ${code}
            } catch(e) {
              parent.postMessage({type: 'error', id: '${id}', message: e.message}, '*');
            }
          </script>
        `);
        iframeDoc.close();
        
        // 监听消息
        return new Promise((resolve) => {
          const handleMessage = (event) => {
            if (event.data.id === id) {
              if (event.data.type === 'log') {
                output += event.data.args.join(' ') + '\n';
              } else if (event.data.type === 'error') {
                window.removeEventListener('message', handleMessage);
                document.body.removeChild(iframe);
                resolve({ success: false, result: output, error: event.data.message });
              }
            }
          };
          
          window.addEventListener('message', handleMessage);
          
          // 3秒后自动清理
          setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            document.body.removeChild(iframe);
            resolve({ success: true, result: output, error: '' });
          }, 3000);
        });
      } 
      else if (language === 'python') {
        // 使用Skulpt运行Python代码
        if (!skulptLoaded) {
          await loadSkulpt();
        }
        
        if (!skulptLoaded) {
          return { success: false, result: 'Skulpt 未能加载', error: 'Skulpt not loaded' };
        }
        
        let output = '';
        let error = '';
        let success = true;
        
        // 配置Skulpt输出和错误处理
        const myPre = document.createElement('pre');
        myPre.id = 'skulpt-output-' + id;
        myPre.style.display = 'none';
        document.body.appendChild(myPre);
        
        const builtinRead = function(x) {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
              throw "File not found: '" + x + "'";
          return Sk.builtinFiles["files"][x];
        };
        
        Sk.pre = "skulpt-output-" + id;
        Sk.configure({
          output: function(text) {
            output += text;
          },
          read: builtinRead,
          inputfun: function(prompt) {
            return window.prompt(prompt);
          },
          inputfunTakesPrompt: true
        });
        
        try {
          const prog = code;
          const module = await Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, prog, true);
          });
        } catch (e) {
          success = false;
          error = e.toString();
        }
        
        document.body.removeChild(myPre);
        return { success, result: output, error };
      } 
      else if (language === 'html') {
        // 在舞台中显示HTML，使用iframe扩展的方式
        createHTMLFrame(code, `html_output_${id}`, true);
        return { success: true, result: 'HTML rendered on stage', error: '' };
      } 
      else if (language === 'css') {
        // 创建临时页面应用 CSS
        const tempPage = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>${code}</style>
            </head>
            <body>
              <h1>Test Page for CSS</h1>
              <p>This is a test page to see your CSS in action.</p>
              <button onclick="alert('Button clicked!')">Click me</button>
            </body>
          </html>
        `;
        createHTMLFrame(tempPage, `css_output_${id}`, true);
        return { success: true, result: 'CSS applied to test page', error: '' };
      } 
      else if (['c', 'cpp', 'go', 'rust'].includes(language)) {
        // 使用 Runno API 运行 C/C++/Go/Rust
        const langMap = {
          'c': 'c',
          'cpp': 'cpp',
          'go': 'go',
          'rust': 'rust'
        };
        
        const response = await fetch('https://runno.dev/api/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language: langMap[language],
            code: code
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          return { success: true, result: result.output, error: '' };
        } else {
          return { success: false, result: '', error: result.error || 'Unknown error' };
        }
      } 
      else {
        return { success: false, result: '', error: `Language ${language} not supported` };
      }
    } catch (error) {
      return { success: false, result: '', error: error.message };
    }
  };

  // === 扩展类 ===
  class AdvancedMonacoEditor {
    getInfo() {
      return {
        id: 'advancedMonacoEditor',
        name: '高级代码编辑器 (Monaco)',
        color1: '#0055aa',
        color2: '#003388',
        color3: '#002266',
        blocks: [
          // 预加载
          {
            blockType: 'label',
            text: '环境预加载',
          },
          { opcode: 'preloadEnvironment', blockType: Scratch.BlockType.COMMAND, text: '预加载代码环境（后台）'},
          { opcode: 'isMonacoLoaded', blockType: Scratch.BlockType.BOOLEAN, text: 'Monaco加载完成？'},
          '---',
          // 创建和管理
          {
            blockType: 'label',
            text: '编辑器创建和管理',
          },
          { opcode: 'createEditor', blockType: Scratch.BlockType.COMMAND, text: '创建名字为 [ID] 的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'removeEditor', blockType: Scratch.BlockType.COMMAND, text: '移除名字为 [ID] 的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'closeAllEditors', blockType: Scratch.BlockType.COMMAND, text: '删除所有编辑器' },
          { opcode: 'showEditor', blockType: Scratch.BlockType.COMMAND, text: '显示名字包含【[ID]】的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'hideEditor', blockType: Scratch.BlockType.COMMAND, text: '隐藏名字包含【[ID]】的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'deleteEditor', blockType: Scratch.BlockType.COMMAND, text: '删除名字包含【[ID]】的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          '---',
          // 位置和大小设置
          {
            blockType: 'label',
            text: '位置和大小设置',
          },
          { opcode: 'setPosition', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器位置 x:[x] y:[y]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, x: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }, y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } } },
          { opcode: 'setSize', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器大小 宽:[width] 高:[height]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, width: { type: Scratch.ArgumentType.NUMBER, defaultValue: -1 }, height: { type: Scratch.ArgumentType.NUMBER, defaultValue: -1 } } },
          { opcode: 'setZoom', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器缩放级别 [zoom]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, zoom: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 } } },
          { opcode: 'increaseProperty', blockType: Scratch.BlockType.COMMAND, text: '增加名字为 [ID] 的编辑器的[X_PROPERTY]为[Y_VALUE]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, X_PROPERTY: { type: Scratch.ArgumentType.STRING, menu: 'propertyMenu' }, Y_VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 } } },
          '---',
          // 字体和颜色设置
          {
            blockType: 'label',
            text: '字体和颜色设置',
          },
          { opcode: 'setFontFamily', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器字体为 [FONT_FAMILY]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, FONT_FAMILY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Consolas, Monaco, "Courier New", monospace' } } },
          { opcode: 'setFontSize', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器字体大小为 [SIZE]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, SIZE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 14 } } },
          { opcode: 'setFontColor', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器字体颜色为 [COLOR]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: '#e0e0e0' } } },
          '---',
          // 代码设置
          {
            blockType: 'label',
            text: '代码设置',
          },
          { opcode: 'setCode', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器代码为 [code]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, code: { type: Scratch.ArgumentType.STRING, defaultValue: '// Hello' } } },
          { opcode: 'setLanguage', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器语言为 [language]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, language: { type: Scratch.ArgumentType.STRING, menu: 'languages' } } },
          { opcode: 'setMaxLines', blockType: Scratch.BlockType.COMMAND, text: '限制名字为 [ID] 的编辑器最大行数 [lines]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, lines: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10000 } } },
          { opcode: 'setInteractive', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器交互性为 [INTERACTIVE]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, INTERACTIVE: { type: Scratch.ArgumentType.STRING, menu: 'interactiveMenu' } } },
          { opcode: 'setResize', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器调整行为为 [RESIZE]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, RESIZE: { type: Scratch.ArgumentType.STRING, menu: 'resizeMenu' } } },
          { opcode: 'setLayer', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器层级为 [LAYER]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, LAYER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 } } },
          '---',
          // 代码获取
          {
            blockType: 'label',
            text: '代码获取',
          },
          { opcode: 'isEditorCreated', blockType: Scratch.BlockType.BOOLEAN, text: '名字为 [ID] 的编辑器创建成功？', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorX', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的X坐标', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorY', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的Y坐标', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorWidth', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的宽度', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorHeight', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的高度', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorZoom', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的缩放度', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorLanguage', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的语言', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorMaxLines', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器的最大行数', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorCharacterCount', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器字符数', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getEditorLineCount', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器行数', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          '---',
          // 代码操作
          {
            blockType: 'label',
            text: '代码操作',
          },
          { opcode: 'getCode', blockType: Scratch.BlockType.REPORTER, text: '名字为 [ID] 的编辑器代码', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'clearEditor', blockType: Scratch.BlockType.COMMAND, text: '清空名字为 [ID] 的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'undoEditor', blockType: Scratch.BlockType.COMMAND, text: '撤销名字为 [ID] 的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'redoEditor', blockType: Scratch.BlockType.COMMAND, text: '重做名字为 [ID] 的编辑器', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'exportToFile', blockType: Scratch.BlockType.COMMAND, text: '导出名字为 [ID] 的编辑器代码为文件名字为 [filename]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, filename: { type: Scratch.ArgumentType.STRING, defaultValue: 'code.txt' } } },
          { opcode: 'searchInEditor', blockType: Scratch.BlockType.COMMAND, text: '搜索名字为 [ID] 的编辑器的代码', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'searchText', blockType: Scratch.BlockType.REPORTER, text: '搜索名字为 [ID] 的编辑器中 [TEXT] 出现在第几行', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'text' } } },
          { opcode: 'goToLine', blockType: Scratch.BlockType.COMMAND, text: '名字为 [ID] 的编辑器跳转到第 [LINE] 行', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, LINE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 } } },
          { opcode: 'formatCode', blockType: Scratch.BlockType.COMMAND, text: '格式化名字为 [ID] 的编辑器代码', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          '---',
          // 光标操作
          {
            blockType: 'label',
            text: '光标操作',
          },
          { opcode: 'getCursorPosition', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器光标位置', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'setCursorPosition', blockType: Scratch.BlockType.COMMAND, text: '设置名字为 [ID] 的编辑器光标位置为 行:[line] 列:[column]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, line: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, column: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 } } },
          { opcode: 'getCursorLine', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器光标的行位置', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getCursorColumn', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器光标的列位置', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getSelectedText', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器选中文本', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getCurrentEditor', blockType: Scratch.BlockType.REPORTER, text: '当前激活的编辑器ID' },
          '---',
          // 代码编辑增强
          {
            blockType: 'label',
            text: '代码编辑增强',
          },
          { opcode: 'appendCode', blockType: Scratch.BlockType.COMMAND, text: '向名字为 [ID] 的编辑器追加代码 [code]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, code: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'insertCodeAtLine', blockType: Scratch.BlockType.COMMAND, text: '在名字为 [ID] 的编辑器第 [line] 行插入代码 [code]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, line: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, code: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'replaceTextInRange', blockType: Scratch.BlockType.COMMAND, text: '替换名字为 [ID] 的编辑器从第 [startLine] 行第 [startCol] 列到第 [endLine] 行第 [endCol] 列的内容为 [text]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, startLine: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, startCol: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, endLine: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, endCol: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, text: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          '---',
          // 代码运行功能
          {
            blockType: 'label',
            text: '代码运行功能',
          },
          { opcode: 'runCode', blockType: Scratch.BlockType.COMMAND, text: '运行名字为 [ID] 的编辑器代码，语言设置为 [LANGUAGE]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, LANGUAGE: { type: Scratch.ArgumentType.STRING, menu: 'languages' } } },
          { opcode: 'isRunSuccess', blockType: Scratch.BlockType.BOOLEAN, text: '名字为 [ID] 的编辑器运行成功？', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getRunError', blockType: Scratch.BlockType.REPORTER, text: '名字为 [ID] 的编辑器报错内容', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getRunResult', blockType: Scratch.BlockType.REPORTER, text: '名字为 [ID] 的编辑器运行结果', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getLastRunTime', blockType: Scratch.BlockType.REPORTER, text: '获取名字为 [ID] 的编辑器上次运行耗时（毫秒）', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          '---',
          // 主题和外观
          {
            blockType: 'label',
            text: '主题和外观',
          },
          { opcode: 'setCustomTheme', blockType: Scratch.BlockType.COMMAND, text: '设置编辑器 [ID] 主题为 [THEME]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, THEME: { type: Scratch.ArgumentType.STRING, menu: 'themeMenu' } } },
          { opcode: 'setCustomBackground', blockType: Scratch.BlockType.COMMAND, text: '设置编辑器 [ID] 背景为 [DATA_URL]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, DATA_URL: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'setBackgroundOpacity', blockType: Scratch.BlockType.COMMAND, text: '设置编辑器 [ID] 背景透明度 [OPACITY]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, OPACITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.3 } } },
          { opcode: 'setCustomColor', blockType: Scratch.BlockType.COMMAND, text: '设置编辑器 [ID] 背景颜色为 [COLOR]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' }, COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: '#9966ff' } } },
          { opcode: 'getBackgroundOpacity', blockType: Scratch.BlockType.REPORTER, text: '获取编辑器 [ID] 背景透明度', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          '---',
          // 迷你地图控制
          {
            blockType: 'label',
            text: '迷你地图控制',
          },
          { opcode: 'openMinimap', blockType: Scratch.BlockType.COMMAND, text: '打开名字为【[ID]】的编辑器的迷你地图', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'closeMinimap', blockType: Scratch.BlockType.COMMAND, text: '关闭名字为【[ID]】的编辑器的迷你地图', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'editor1' } } },
          { opcode: 'getOpenMinimaps', blockType: Scratch.BlockType.REPORTER, text: '有哪些编辑器打开模拟地图（返回JSON）' },
          '---',
          // HTML显示控制
          {
            blockType: 'label',
            text: 'HTML显示控制',
          },
          { opcode: 'showHTMLFrame', blockType: Scratch.BlockType.COMMAND, text: '显示名字为 [NAME] 的HTML页面', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'html_output_editor1' } } },
          { opcode: 'hideHTMLFrame', blockType: Scratch.BlockType.COMMAND, text: '隐藏名字为 [NAME] 的HTML页面', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'html_output_editor1' } } },
          { opcode: 'closeHTMLFrame', blockType: Scratch.BlockType.COMMAND, text: '关闭名字为 [NAME] 的HTML页面', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'html_output_editor1' } } },
          '---',
          // 批量操作
          {
            blockType: 'label',
            text: '批量操作',
          },
          { opcode: 'hideAllEditors', blockType: Scratch.BlockType.COMMAND, text: '隐藏所有编辑器' },
          { opcode: 'showAllEditors', blockType: Scratch.BlockType.COMMAND, text: '显示所有编辑器' },
          { opcode: 'getEditorCount', blockType: Scratch.BlockType.REPORTER, text: '编辑器数量' },
          { opcode: 'getAllEditorNames', blockType: Scratch.BlockType.REPORTER, text: '所有编辑器名称' },
          '---',
          // 文本与数据转换
          {
            blockType: 'label',
            text: '文本与数据转换',
          },
          { opcode: 'textToDataURL', blockType: Scratch.BlockType.REPORTER, text: '将文本【[TEXT]】转换为dataURL', arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello World' } } },
          { opcode: 'dataURLToText', blockType: Scratch.BlockType.REPORTER, text: '通过dataURL【[DATA_URL]】提取代码文件里面的文本', arguments: { DATA_URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:text/plain;base64,SGVsbG8gV29ybGQ=' } } }
        ],
        menus: {
          languages: {
            acceptReporters: true,
            items: Object.keys(languageMap).map(key => ({ text: key, value: key }))
          },
          interactiveMenu: {
            acceptReporters: true,
            items: ["true", "false"],
          },
          resizeMenu: {
            acceptReporters: true,
            items: [
              {
                text: "缩放",
                value: "scale",
              },
              {
                text: "视口",
                value: "viewport",
              },
            ],
          },
          propertyMenu: {
            acceptReporters: true,
            items: [
              { text: "X坐标", value: "x" },
              { text: "Y坐标", value: "y" },
              { text: "宽度", value: "width" },
              { text: "高度", value: "height" },
              { text: "缩放度", value: "zoom" }
            ],
          },
          themeMenu: {
            acceptReporters: true,
            items: [
              { text: "Material You", value: "materialYou" },
              { text: "浅色", value: "light" },
              { text: "深色", value: "dark" },
              { text: "蓝色", value: "blue" },
              { text: "绿色", value: "green" },
              { text: "紫色", value: "purple" },
              { text: "橙色", value: "orange" },
              { text: "粉色", value: "pink" },
              { text: "青色", value: "teal" },
              { text: "棕色", value: "brown" },
              { text: "高对比度", value: "highContrast" }
            ]
          }
        }
      };
    }

    // 检查Monaco是否加载完成
    isMonacoLoaded() {
      return monacoLoaded;
    }

    // 预加载环境
    async preloadEnvironment() {
      try {
        await loadMonaco();
        console.log('✅ Monaco 环境预加载成功！');
      } catch (error) {
        console.error('❌ 预加载失败:', error);
      }
    }

    // 创建编辑器
    async createEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      if (editors.has(id)) {
        this.removeEditor({ ID: id });
      }

      // 创建容器
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.pointerEvents = 'auto';

      // 添加到 Scratch 渲染层
      const overlay = Scratch.renderer.addOverlay(container, "scale-centered"); // 使用scale-centered模式

      const config = { ...defaultConfig, id, resizeBehavior: "scale" }; // 默认使用scale行为
      
      try {
        const { editor, model } = await createEditorInstance(id, container, config);
        editors.set(id, { container, editor, model, config, overlay, _currentLanguage: config.language, selectedText: '' });
        updateEditorDisplay(id);
      } catch (e) {
        console.error('创建 Monaco 编辑器失败:', e);
      }
    }

    // 移除编辑器
    removeEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.dispose();
        Scratch.renderer.removeOverlay(data.container); // 移除overlay
        editors.delete(id);
      }
    }

    // 删除所有编辑器
    closeAllEditors() {
      for (const id of editors.keys()) {
        this.removeEditor({ ID: id });
      }
    }

    // 显示名字包含指定ID的编辑器
    showEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      for (const [editorId, data] of editors.entries()) {
        if (editorId.includes(id)) {
          const newConfig = { ...data.config, visible: true };
          editors.set(editorId, { ...data, config: newConfig });
          updateEditorDisplay(editorId);
        }
      }
    }

    // 隐藏名字包含指定ID的编辑器
    hideEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      for (const [editorId, data] of editors.entries()) {
        if (editorId.includes(id)) {
          const newConfig = { ...data.config, visible: false };
          editors.set(editorId, { ...data, config: newConfig });
          updateEditorDisplay(editorId);
        }
      }
    }

    // 删除名字包含指定ID的编辑器
    deleteEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      for (const [editorId, data] of editors.entries()) {
        if (editorId.includes(id)) {
          this.removeEditor({ ID: editorId });
        }
      }
    }

    // 设置代码
    setCode(args) {
      const id = Scratch.Cast.toString(args.ID);
      const code = Scratch.Cast.toString(args.code);
      const data = editors.get(id);
      if (data) {
        data.editor.setValue(code);
      }
    }

    // 追加代码
    appendCode(args) {
      const id = Scratch.Cast.toString(args.ID);
      const code = Scratch.Cast.toString(args.code);
      const data = editors.get(id);
      if (data) {
        const currentValue = data.editor.getValue();
        data.editor.setValue(currentValue + '\n' + code);
      }
    }

    // 在指定行插入代码
    insertCodeAtLine(args) {
      const id = Scratch.Cast.toString(args.ID);
      const lineNum = Scratch.Cast.toNumber(args.line);
      const code = Scratch.Cast.toString(args.code);
      const data = editors.get(id);
      if (data) {
        const model = data.editor.getModel();
        const lineCount = model.getLineCount();
        const actualLine = Math.max(1, Math.min(lineNum, lineCount + 1));
        
        const editOp = {
          range: new monaco.Range(actualLine, 1, actualLine, 1),
          text: code + (actualLine <= lineCount ? '\n' : ''),
          forceMoveMarkers: true
        };
        model.pushEditOperations([], [editOp], () => []);
      }
    }

    // 替换指定范围的文本
    replaceTextInRange(args) {
      const id = Scratch.Cast.toString(args.ID);
      const startLine = Scratch.Cast.toNumber(args.startLine);
      const startCol = Scratch.Cast.toNumber(args.startCol);
      const endLine = Scratch.Cast.toNumber(args.endLine);
      const endCol = Scratch.Cast.toNumber(args.endCol);
      const text = Scratch.Cast.toString(args.text);
      const data = editors.get(id);
      if (data) {
        const model = data.editor.getModel();
        const range = new monaco.Range(startLine, startCol, endLine, endCol);
        model.pushEditOperations([], [{ range, text, forceMoveMarkers: true }], () => []);
      }
    }

    // 获取代码
    getCode(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.editor.getValue() : '';
    }

    // 清空编辑器
    clearEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.setValue('');
      }
    }

    // 设置位置
    setPosition(args) {
      const id = Scratch.Cast.toString(args.ID);
      const x = Scratch.Cast.toNumber(args.x);
      const y = Scratch.Cast.toNumber(args.y);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, x, y };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 设置大小
    setSize(args) {
      const id = Scratch.Cast.toString(args.ID);
      const width = Scratch.Cast.toNumber(args.width);
      const height = Scratch.Cast.toNumber(args.height);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, width, height };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 设置缩放级别
    setZoom(args) {
      const id = Scratch.Cast.toString(args.ID);
      const zoom = Math.max(0.1, Math.min(3.0, Scratch.Cast.toNumber(args.zoom)));
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, zoomLevel: zoom };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id); // 重新调用更新函数，虽然zoomLevel在旧版中未使用
      }
    }

    // 增加属性值
    increaseProperty(args) {
      const id = Scratch.Cast.toString(args.ID);
      const property = Scratch.Cast.toString(args.X_PROPERTY);
      const value = Scratch.Cast.toNumber(args.Y_VALUE);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config };
        switch(property) {
          case 'x':
            newConfig.x += value;
            break;
          case 'y':
            newConfig.y += value;
            break;
          case 'width':
            newConfig.width += value;
            break;
          case 'height':
            newConfig.height += value;
            break;
          case 'zoom':
            newConfig.zoomLevel = Math.max(0.1, Math.min(3.0, newConfig.zoomLevel + value));
            break;
        }
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 设置语言
    setLanguage(args) {
      const id = Scratch.Cast.toString(args.ID);
      const language = Scratch.Cast.toString(args.language);
      const data = editors.get(id);
      if (data && languageMap[language]) {
        const newConfig = { ...data.config, language };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 限制最大行数
    setMaxLines(args) {
      const id = Scratch.Cast.toString(args.ID);
      const lines = Math.max(1, Scratch.Cast.toNumber(args.lines));
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, maxLines: lines };
        editors.set(id, { ...data, config: newConfig });
      }
    }

    // 设置交互性
    setInteractive(args) {
      const id = Scratch.Cast.toString(args.ID);
      const interactive = Scratch.Cast.toBoolean(args.INTERACTIVE);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, interactive };
        editors.set(id, { ...data, config: newConfig });
        data.container.style.pointerEvents = interactive ? "auto" : "none";
      }
    }

    // 设置调整行为
    setResize(args) {
      const id = Scratch.Cast.toString(args.ID);
      const resize = args.RESIZE;
      const data = editors.get(id);
      if (data && (resize === "scale" || resize === "viewport")) {
        const newConfig = { ...data.config, resizeBehavior: resize };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 设置层级
    setLayer(args) {
      const id = Scratch.Cast.toString(args.ID);
      const layer = Scratch.Cast.toNumber(args.LAYER);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, zIndex: layer };
        editors.set(id, { ...data, config: newConfig });
        data.container.style.zIndex = layer;
      }
    }

    // 检查编辑器是否存在
    isEditorCreated(args) {
      const id = Scratch.Cast.toString(args.ID);
      return editors.has(id);
    }

    // 获取X坐标
    getEditorX(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.x : 0;
    }

    // 获取Y坐标
    getEditorY(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.y : 0;
    }

    // 获取宽度
    getEditorWidth(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.width : 0;
    }

    // 获取高度
    getEditorHeight(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.height : 0;
    }

    // 获取缩放度
    getEditorZoom(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.zoomLevel : 1.0;
    }

    // 获取语言
    getEditorLanguage(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.language : 'javascript';
    }

    // 获取最大行数
    getEditorMaxLines(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.maxLines : 10000;
    }

    // 获取字符数
    getEditorCharacterCount(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.editor.getValue().length : 0;
    }

    // 获取行数
    getEditorLineCount(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        const model = data.editor.getModel();
        return model ? model.getLineCount() : 0;
      }
      return 0;
    }

    // 撤销
    undoEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.trigger('source', 'undo', {});
      }
    }

    // 重做
    redoEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.trigger('source', 'redo', {});
      }
    }

    // 导出为文件
    exportToFile(args) {
      const id = Scratch.Cast.toString(args.ID);
      const filename = Scratch.Cast.toString(args.filename);
      const data = editors.get(id);
      if (data) {
        const code = data.editor.getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

    // 搜索功能
    searchText(args) {
      const id = Scratch.Cast.toString(args.ID);
      const searchText = Scratch.Cast.toString(args.TEXT);
      const data = editors.get(id);
      if (data) {
        const model = data.editor.getModel();
        const content = model.getValue();
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(searchText)) {
            return i + 1; // 返回行号（从1开始）
          }
        }
      }
      return 0; // 未找到
    }

    // 搜索
    searchInEditor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.trigger('keyboard', 'actions.find', {});
      }
    }

    // 跳转到指定行
    goToLine(args) {
      const id = Scratch.Cast.toString(args.ID);
      const line = Math.max(1, Scratch.Cast.toNumber(args.LINE));
      const data = editors.get(id);
      if (data) {
        data.editor.revealLineInCenter(line);
        data.editor.setPosition({ lineNumber: line, column: 1 });
      }
    }

    // 格式化代码
    formatCode(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        data.editor.getAction('editor.action.formatDocument').run();
      }
    }

    // 获取光标位置
    getCursorPosition(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        const position = data.editor.getPosition();
        return `行:${position.lineNumber},列:${position.column}`;
      }
      return '行:1,列:1';
    }

    // 获取光标行位置
    getCursorLine(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.currentLine : 1;
    }

    // 获取光标列位置
    getCursorColumn(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.currentColumn : 1;
    }

    // 设置光标位置
    setCursorPosition(args) {
      const id = Scratch.Cast.toString(args.ID);
      const line = Math.max(1, Scratch.Cast.toNumber(args.line));
      const column = Math.max(1, Scratch.Cast.toNumber(args.column));
      const data = editors.get(id);
      if (data) {
        data.editor.setPosition({ lineNumber: line, column: column });
        data.editor.revealPositionInCenter({ lineNumber: line, column: column });
      }
    }

    // 获取选中文本
    getSelectedText(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        const selection = data.editor.getSelection();
        if (selection.isEmpty()) {
          return data.selectedText || ''; // 返回之前保存的选中文本
        } else {
          const model = data.editor.getModel();
          return model.getValueInRange(selection);
        }
      }
      return '';
    }

    // 获取当前激活的编辑器
    getCurrentEditor() {
      // 遍历所有编辑器，找到当前有焦点的那个
      for (const [id, data] of editors.entries()) {
        if (data.editor.hasTextFocus()) {
          return id;
        }
      }
      return '';
    }

    // 运行代码
    async runCode(args) {
      const id = Scratch.Cast.toString(args.ID);
      const language = Scratch.Cast.toString(args.LANGUAGE);
      const data = editors.get(id);
      
      if (!data) {
        runResults.set(id, { success: false, error: '编辑器不存在', result: null, time: 0 });
        return;
      }

      const code = data.editor.getValue();
      const startTime = Date.now();
      
      try {
        const result = await runCode(code, language, id);
        const endTime = Date.now();
        result.time = endTime - startTime;
        runResults.set(id, result);
      } catch (error) {
        const endTime = Date.now();
        runResults.set(id, { success: false, error: error.message, result: null, time: endTime - startTime });
      }
    }

    // 检查运行是否成功
    isRunSuccess(args) {
      const id = Scratch.Cast.toString(args.ID);
      const result = runResults.get(id);
      return result ? result.success : false;
    }

    // 获取运行错误
    getRunError(args) {
      const id = Scratch.Cast.toString(args.ID);
      const result = runResults.get(id);
      return result ? result.error || '' : '';
    }

    // 获取运行结果
    getRunResult(args) {
      const id = Scratch.Cast.toString(args.ID);
      const result = runResults.get(id);
      return result ? result.result || '' : '';
    }

    // 获取上次运行耗时
    getLastRunTime(args) {
      const id = Scratch.Cast.toString(args.ID);
      const result = runResults.get(id);
      return result ? result.time || 0 : 0;
    }

    // 设置自定义主题
    setCustomTheme(args) {
      const id = Scratch.Cast.toString(args.ID);
      const themeName = Scratch.Cast.toString(args.THEME);
      const data = editors.get(id);
      if (data && materialYouThemes[themeName]) {
        const newConfig = { ...data.config, theme: themeName };
        editors.set(id, { ...data, config: newConfig });
        monaco.editor.setTheme(themeName);
      }
    }

    // 设置自定义背景
    setCustomBackground(args) {
      const id = Scratch.Cast.toString(args.ID);
      const dataUrl = Scratch.Cast.toString(args.DATA_URL);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, customBackground: dataUrl };
        editors.set(id, { ...data, config: newConfig });
        data.container.style.backgroundImage = `url(${dataUrl})`;
        data.container.style.backgroundSize = 'cover';
        data.container.style.backgroundPosition = 'center';
        data.container.style.backgroundRepeat = 'no-repeat';
      }
    }

    // 设置背景透明度
    setBackgroundOpacity(args) {
      const id = Scratch.Cast.toString(args.ID);
      const opacity = Math.max(0, Math.min(1, Scratch.Cast.toNumber(args.OPACITY)));
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, backgroundOpacity: opacity };
        editors.set(id, { ...data, config: newConfig });
        data.container.style.opacity = opacity;
      }
    }

    // 获取背景透明度
    getBackgroundOpacity(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      return data ? data.config.backgroundOpacity : 0.3;
    }

    // 设置自定义颜色
    setCustomColor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const color = Scratch.Cast.toString(args.COLOR); // 获取颜色字符串，如 #9966ff
      const data = editors.get(id);
      
      if (data) {
        // 1. 定义一个临时的动态主题
        const dynamicThemeName = 'dynamic-user-theme';
        
        // 获取当前配置的基础主题（是 vs 还是 vs-dark），以保持文字颜色协调
        // 这里为了简单，我们强制基于 vs-dark 修改，或者你可以做一个判断
        const baseTheme = 'vs-dark'; 
        
        monaco.editor.defineTheme(dynamicThemeName, {
          base: baseTheme,
          inherit: true,
          rules: [],
          colors: {
            'editor.background': color, // 使用你输入的颜色
            // 为了可读性，如果背景很深，光标和选中颜色可能需要调整
            'editorCursor.foreground': '#ffffff', 
            'editor.selectionBackground': '#ffffff33' 
          }
        });

        // 2. 应用主题
        monaco.editor.setTheme(dynamicThemeName);
        
        // 3. 更新配置记录
        const newConfig = { ...data.config, theme: dynamicThemeName };
        editors.set(id, { ...data, config: newConfig });
      }
    }

    // 设置字体族
    setFontFamily(args) {
      const id = Scratch.Cast.toString(args.ID);
      const fontFamily = Scratch.Cast.toString(args.FONT_FAMILY);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, fontFamily };
        editors.set(id, { ...data, config: newConfig });
        data.editor.updateOptions({ fontFamily });
      }
    }

    // 设置字体大小
    setFontSize(args) {
      const id = Scratch.Cast.toString(args.ID);
      const size = Math.max(8, Math.min(72, Scratch.Cast.toNumber(args.SIZE)));
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, fontSize: size };
        editors.set(id, { ...data, config: newConfig });
        data.editor.updateOptions({ fontSize: size });
      }
    }

    // 设置字体颜色
    setFontColor(args) {
      const id = Scratch.Cast.toString(args.ID);
      const color = Scratch.Cast.toString(args.COLOR);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, customFontColor: color };
        editors.set(id, { ...data, config: newConfig });
        // 创建一个临时的动态主题来更新字体颜色
        const dynamicThemeName = 'dynamic-font-color-theme';
        const baseTheme = data.config.theme || 'vs-dark';
        monaco.editor.defineTheme(dynamicThemeName, {
          base: baseTheme,
          inherit: true,
          rules: [],
          colors: {
            'editor.foreground': color,
            'editor.lineNumbers': color,
            'editorLineNumber.activeForeground': color
          }
        });
        monaco.editor.setTheme(dynamicThemeName);
      }
    }

    // 检查Skulpt是否加载完成
    isSkulptLoaded() {
      return skulptLoadComplete && skulptLoaded;
    }

    // 获取Skulpt加载耗时
    getSkulptLoadTime() {
      return skulptLoadTime / 1000; // 转换为秒
    }

    // 隐藏所有编辑器
    hideAllEditors() {
      for (const [id, data] of editors.entries()) {
        const newConfig = { ...data.config, visible: false };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 显示所有编辑器
    showAllEditors() {
      for (const [id, data] of editors.entries()) {
        const newConfig = { ...data.config, visible: true };
        editors.set(id, { ...data, config: newConfig });
        updateEditorDisplay(id);
      }
    }

    // 获取编辑器数量
    getEditorCount() {
      return editors.size;
    }

    // 获取所有编辑器名称
    getAllEditorNames() {
      return Array.from(editors.keys()).join(', ');
    }

    // 打开迷你地图
    openMinimap(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, minimap: true };
        editors.set(id, { ...data, config: newConfig });
        data.editor.updateOptions({ minimap: { enabled: true } });
      }
    }

    // 关闭迷你地图
    closeMinimap(args) {
      const id = Scratch.Cast.toString(args.ID);
      const data = editors.get(id);
      if (data) {
        const newConfig = { ...data.config, minimap: false };
        editors.set(id, { ...data, config: newConfig });
        data.editor.updateOptions({ minimap: { enabled: false } });
      }
    }

    // 获取开启迷你地图的编辑器列表
    getOpenMinimaps() {
      const openMinimaps = [];
      for (const [id, data] of editors.entries()) {
        if (data.config.minimap) {
          openMinimaps.push(id);
        }
      }
      return JSON.stringify(openMinimaps);
    }

    // HTML显示控制
    showHTMLFrame(args) {
      const name = Scratch.Cast.toString(args.NAME);
      if (iframes[name]) {
        iframes[name].visible = true;
        updateHTMLFrameAttributes(name);
      }
    }

    hideHTMLFrame(args) {
      const name = Scratch.Cast.toString(args.NAME);
      if (iframes[name]) {
        iframes[name].visible = false;
        updateHTMLFrameAttributes(name);
      }
    }

    closeHTMLFrame(args) {
      const name = Scratch.Cast.toString(args.NAME);
      closeHTMLFrame(name);
    }

    // 将文本转换为DataURL
    textToDataURL(args) {
      const text = Scratch.Cast.toString(args.TEXT);
      const encodedText = encodeURIComponent(text);
      return `data:text/plain;charset=utf-8,${encodedText}`;
    }

    // 从DataURL提取文本
    dataURLToText(args) {
      const dataURL = Scratch.Cast.toString(args.DATA_URL);
      try {
        if (dataURL.startsWith('data:')) {
          const parts = dataURL.split(',');
          const mimeAndEncoding = parts[0];
          const encodedData = parts[1];
          
          if (mimeAndEncoding.includes('base64')) {
            // Base64编码的数据
            const binaryString = atob(encodedData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            // 使用UTF-8解码以支持中文
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(bytes);
          } else {
            // URL编码的数据
            return decodeURIComponent(encodedData);
          }
        } else {
          return '';
        }
      } catch (e) {
        return '';
      }
    }
  }

  Scratch.extensions.register(new AdvancedMonacoEditor());
})(Scratch);