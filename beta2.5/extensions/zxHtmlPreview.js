(function (Scratch) {
  "use strict";

  const iframesMap = new Map();
  const SANDBOX = [
    "allow-same-origin",
    "allow-scripts",
    "allow-forms",
    "allow-modals",
    "allow-popups",
  ];

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

  const getOverlayMode = (resizeBehavior) =>
    resizeBehavior === "scale" ? "scale-centered" : "manual";

  const createFrame = (src, name) => {
    if (iframesMap.has(name)) {
      closeFrame(name);
    }

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.position = "absolute";
    iframe.setAttribute("sandbox", SANDBOX.join(" "));
    iframe.setAttribute(
      "allow",
      Object.entries(featurePolicy)
        .map(([name, permission]) => `${name} ${permission}`)
        .join("; ")
    );
    iframe.setAttribute("allowtransparency", "true");

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
              iframe.contentWindow.location.href = href;
            }
          });

          link.removeAttribute("target");
        });
      } catch (error) {
        // 跨域问题
      }
    });

    iframe.setAttribute("src", src);

    const overlay = Scratch.renderer.addOverlay(iframe, getOverlayMode("scale"));

    iframesMap.set(name, {
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
      height: Scratch.vm.runtime.stageHeight,
      layer: 1
    });

    updateFrameAttributes(name);
  };

  const closeFrame = (name) => {
    if (iframesMap.has(name)) {
      const frameInfo = iframesMap.get(name);
      Scratch.renderer.removeOverlay(frameInfo.iframe);
      iframesMap.delete(name);
    }
  };

  const updateFrameAttributes = (name) => {
    if (!iframesMap.has(name)) return;

    const frameInfo = iframesMap.get(name);
    const { iframe, x, y, width, height, interactive, resizeBehavior } = frameInfo;

    iframe.style.pointerEvents = interactive ? "auto" : "none";
    iframe.style.display = frameInfo.visible ? "" : "none";

    const { stageWidth, stageHeight } = Scratch.vm.runtime;
    const effectiveWidth = width >= 0 ? width : stageWidth;
    const effectiveHeight = height >= 0 ? height : stageHeight;

    if (resizeBehavior === "scale") {
      iframe.style.width = `${effectiveWidth}px`;
      iframe.style.height = `${effectiveHeight}px`;

      iframe.style.transform = `translate(${-effectiveWidth / 2 + x}px, ${
        -effectiveHeight / 2 - y
      }px)`;
      iframe.style.top = "0";
      iframe.style.left = "0";
    } else {
      iframe.style.width = `${(effectiveWidth / stageWidth) * 100}%`;
      iframe.style.height = `${(effectiveHeight / stageHeight) * 100}%`;

      iframe.style.transform = "";
      iframe.style.top = `${
        (0.5 - effectiveHeight / 2 / stageHeight - y / stageHeight) * 100
      }%`;
      iframe.style.left = `${
        (0.5 - effectiveWidth / 2 / stageWidth + x / stageWidth) * 100
      }%`;
    }

    if (frameInfo.overlay) {
      frameInfo.overlay.mode = getOverlayMode(resizeBehavior);
      Scratch.renderer._updateOverlays();
    }
  };

  const updateAllFrames = () => {
    for (const name of iframesMap.keys()) {
      updateFrameAttributes(name);
    }
  };

  Scratch.vm.on("STAGE_SIZE_CHANGED", updateAllFrames);

  Scratch.vm.runtime.on("RUNTIME_DISPOSED", () => {
    for (const name of iframesMap.keys()) {
      closeFrame(name);
    }
  });

  class ZxHtmlPreview {
    getInfo() {
      return {
        name: "zx的HTML预览",
        id: "zxHtmlPreview",
        color1: "#88A3C2",
        color2: "#6B8BA4",
        blocks: [
          {
            opcode: "displayFromDataURL",
            blockType: Scratch.BlockType.COMMAND,
            text: "从文件的dataURL [DATAURL] 读取里面的HTML并显示且命名为 [NAME]",
            arguments: {
              DATAURL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data:text/html,<h1>Hello World!</h1>",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          "---",
          {
            opcode: "showAll",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示所有的HTML",
          },
          {
            opcode: "hideAll",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏所有的HTML",
          },
          {
            opcode: "closeAll",
            blockType: Scratch.BlockType.COMMAND,
            text: "删除所有的HTML",
          },
          "---",
          {
            opcode: "showByName",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示名字为 [NAME] 的HTML",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          {
            opcode: "hideByName",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏名字为 [NAME] 的HTML",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          {
            opcode: "closeByName",
            blockType: Scratch.BlockType.COMMAND,
            text: "删除名字为 [NAME] 的HTML",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          "---",
          {
            opcode: "setPosition",
            blockType: Scratch.BlockType.COMMAND,
            text: "将名字为 [NAME] 的HTML的[PROPERTY]设置为 [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              },
              PROPERTY: {
                type: Scratch.ArgumentType.STRING,
                menu: "positionPropertyMenu",
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0,
              }
            },
          },
          {
            opcode: "changePosition",
            blockType: Scratch.BlockType.COMMAND,
            text: "将名字为 [NAME] 的HTML的[PROPERTY]增加 [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              },
              PROPERTY: {
                type: Scratch.ArgumentType.STRING,
                menu: "positionPropertyMenu",
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10,
              }
            },
          },
          {
            opcode: "getSize",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取名字为 [NAME] 的[PROPERTY]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              },
              PROPERTY: {
                type: Scratch.ArgumentType.STRING,
                menu: "sizePropertyMenu",
              }
            },
          },
          {
            opcode: "setHtmlContent",
            blockType: Scratch.BlockType.COMMAND,
            text: "将名字为 [NAME] 的HTML页面代码重新设置为 [CONTENT]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              },
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "<h1>New Content</h1>",
              }
            },
          },
          "---",
          {
            opcode: "getAllNames",
            blockType: Scratch.BlockType.REPORTER,
            text: "所有的HTML名字",
          },
          {
            opcode: "getCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "HTML数量",
          },
          "---",
          {
            opcode: "executeJS1",
            blockType: Scratch.BlockType.COMMAND,
            text: "执行JS代码 [CODE] 在HTML [NAME] 中",
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "console.log('Hello');",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          {
            opcode: "executeJS2",
            blockType: Scratch.BlockType.COMMAND,
            text: "执行JS代码 [CODE] 在HTML [NAME] 中",
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "alert('Test');",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          {
            opcode: "executeJS3",
            blockType: Scratch.BlockType.COMMAND,
            text: "执行JS代码 [CODE] 在HTML [NAME] 中",
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "document.body.style.backgroundColor='red';",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面1",
              }
            },
          },
          "---",
          {
            opcode: "readCodeFile",
            blockType: Scratch.BlockType.REPORTER,
            text: "从文件的dataURL [DATAURL] 读取里面的代码（支持.JS.PY.C.JAVA这些常见代码文件）",
            arguments: {
              DATAURL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data:text/plain;base64,Y29uc29sZS5sb2coJ0hlbGxvIFdvcmxkJyk7",
              }
            },
          },
          {
            opcode: "readHtmlFile",
            blockType: Scratch.BlockType.REPORTER,
            text: "从文件的dataURL [DATAURL] 读取里面的HTML代码",
            arguments: {
              DATAURL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data:text/html,<h1>Sample HTML</h1>",
              }
            },
          },
        ],
        menus: {
          positionPropertyMenu: {
            acceptReporters: true,
            items: [
              { text: "x", value: "x" },
              { text: "y", value: "y" },
              { text: "宽", value: "width" },
              { text: "高", value: "height" }
            ]
          },
          sizePropertyMenu: {
            acceptReporters: true,
            items: [
              { text: "X", value: "x" },
              { text: "Y", value: "y" },
              { text: "宽", value: "width" },
              { text: "高", value: "height" }
            ]
          }
        },
      };
    }

    async displayFromDataURL({ DATAURL, NAME }) {
      const dataUrl = Scratch.Cast.toString(DATAURL);
      const name = Scratch.Cast.toString(NAME);

      if (await Scratch.canEmbed(dataUrl)) {
        createFrame(dataUrl, name);
      }
    }

    showAll() {
      for (const name of iframesMap.keys()) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = true;
        updateFrameAttributes(name);
      }
    }

    hideAll() {
      for (const name of iframesMap.keys()) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = false;
        updateFrameAttributes(name);
      }
    }

    closeAll() {
      const names = Array.from(iframesMap.keys());
      for (const name of names) {
        closeFrame(name);
      }
    }

    showByName({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = true;
        updateFrameAttributes(name);
      }
    }

    hideByName({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = false;
        updateFrameAttributes(name);
      }
    }

    closeByName({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      closeFrame(name);
    }

    setPosition({ NAME, PROPERTY, VALUE }) {
      const name = Scratch.Cast.toString(NAME);
      const property = Scratch.Cast.toString(PROPERTY);
      const value = Scratch.Cast.toNumber(VALUE);

      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        
        switch(property) {
          case "x":
            frameInfo.x = value;
            break;
          case "y":
            frameInfo.y = value;
            break;
          case "width":
            frameInfo.width = value;
            break;
          case "height":
            frameInfo.height = value;
            break;
        }
        
        updateFrameAttributes(name);
      }
    }

    changePosition({ NAME, PROPERTY, VALUE }) {
      const name = Scratch.Cast.toString(NAME);
      const property = Scratch.Cast.toString(PROPERTY);
      const value = Scratch.Cast.toNumber(VALUE);

      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        
        switch(property) {
          case "x":
            frameInfo.x += value;
            break;
          case "y":
            frameInfo.y += value;
            break;
          case "width":
            frameInfo.width += value;
            break;
          case "height":
            frameInfo.height += value;
            break;
        }
        
        updateFrameAttributes(name);
      }
    }

    getSize({ NAME, PROPERTY }) {
      const name = Scratch.Cast.toString(NAME);
      const property = Scratch.Cast.toString(PROPERTY);

      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        
        switch(property) {
          case "x":
            return frameInfo.x;
          case "y":
            return frameInfo.y;
          case "width":
            return frameInfo.width;
          case "height":
            return frameInfo.height;
        }
      }
      
      return 0;
    }

    setHtmlContent({ NAME, CONTENT }) {
      const name = Scratch.Cast.toString(NAME);
      const content = Scratch.Cast.toString(CONTENT);
      const url = `data:text/html;,${encodeURIComponent(content)}`;

      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.iframe.src = url;
        frameInfo.url = url;
      }
    }

    getAllNames() {
      return Array.from(iframesMap.keys()).join(", ");
    }

    getCount() {
      return iframesMap.size;
    }

    executeJS1({ CODE, NAME }) {
      const code = Scratch.Cast.toString(CODE);
      const name = Scratch.Cast.toString(NAME);
      this.executeJavaScript(code, name);
    }

    executeJS2({ CODE, NAME }) {
      const code = Scratch.Cast.toString(CODE);
      const name = Scratch.Cast.toString(NAME);
      this.executeJavaScript(code, name);
    }

    executeJS3({ CODE, NAME }) {
      const code = Scratch.Cast.toString(CODE);
      const name = Scratch.Cast.toString(NAME);
      this.executeJavaScript(code, name);
    }

    executeJavaScript(code, name) {
      if (iframesMap.has(name)) {
        try {
          const frameInfo = iframesMap.get(name);
          frameInfo.iframe.contentWindow.eval(code);
        } catch (error) {
          console.error(`Error executing JavaScript in iframe ${name}:`, error);
        }
      }
    }

    readCodeFile({ DATAURL }) {
      const dataUrl = Scratch.Cast.toString(DATAURL);
      
      // 解析 data URL
      if (dataUrl.startsWith('data:')) {
        const parts = dataUrl.split(',');
        if (parts.length === 2) {
          const header = parts[0];
          const encodedContent = parts[1];
          
          // 检查是否是 base64 编码
          if (header.includes(';base64')) {
            try {
              return atob(encodedContent);
            } catch(e) {
              return '解码失败';
            }
          } else {
            // URL 编码的情况
            try {
              return decodeURIComponent(encodedContent);
            } catch(e) {
              return '解码失败';
            }
          }
        }
      }
      
      return '';
    }

    readHtmlFile({ DATAURL }) {
      const dataUrl = Scratch.Cast.toString(DATAURL);
      
      // 解析 data URL
      if (dataUrl.startsWith('data:')) {
        const parts = dataUrl.split(',');
        if (parts.length === 2) {
          const header = parts[0];
          const encodedContent = parts[1];
          
          // 检查是否是 base64 编码
          if (header.includes(';base64')) {
            try {
              return atob(encodedContent);
            } catch(e) {
              return '解码失败';
            }
          } else {
            // URL 编码的情况
            try {
              return decodeURIComponent(encodedContent);
            } catch(e) {
              return '解码失败';
            }
          }
        }
      }
      
      return '';
    }
  }

  Scratch.extensions.register(new ZxHtmlPreview());
})(Scratch);