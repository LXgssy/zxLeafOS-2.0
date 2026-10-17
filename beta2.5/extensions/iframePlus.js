// Name: Iframe Plus
// ID: iframePlus
// Description: 显示网页或HTML覆盖舞台，支持多窗口管理和高级控制
// License: MIT AND MPL-2.0

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

  class IframeExtension {
    getInfo() {
      return {
        name: "Iframe Plus",
        id: "iframePlus",
        color1: "#4B8BBE",
        color2: "#306998",
        blocks: [
          {
            opcode: "display",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示来自URL [URL] 的网页并且命名成 [NAME]",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://extensions.turbowarp.org/hello.html",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          {
            opcode: "displayHTML",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示HTML [HTML] 并且命名成 [NAME]",
            arguments: {
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "<h1>你好!</h1>",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "HTML页面",
              }
            },
          },
          "---",
          {
            opcode: "show",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示名字为 [NAME] 的网页",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          {
            opcode: "hide",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏名字为 [NAME] 的网页",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          {
            opcode: "close",
            blockType: Scratch.BlockType.COMMAND,
            text: "退出名字为 [NAME] 的网页",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          "---",
          {
            opcode: "showUrl",
            blockType: Scratch.BlockType.REPORTER,
            text: "显示名字为 [NAME] 的网页的网址",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          {
            opcode: "refresh",
            blockType: Scratch.BlockType.COMMAND,
            text: "刷新名字为 [NAME] 的网页",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              }
            },
          },
          {
            opcode: "setUrl",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页网址为 [URL]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://example.com",
              }
            },
          },
          "---",
          {
            opcode: "closeAll",
            blockType: Scratch.BlockType.COMMAND,
            text: "退出所有网页",
          },
          {
            opcode: "hideAll",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏所有的网页",
          },
          {
            opcode: "getAllNames",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取所有网页名称",
          },
          "---",
          {
            opcode: "setUserAgent",
            blockType: Scratch.BlockType.COMMAND,
            text: "访问 [TYPE] 版网页",
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "userAgentMenu",
              },
            },
          },
          "---",
          {
            opcode: "setPosition",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页位置 x:[X] y:[Y]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
            },
          },
          {
            opcode: "setSize",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页尺寸 宽:[WIDTH] 高:[HEIGHT]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              WIDTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: Scratch.vm.runtime.stageWidth,
              },
              HEIGHT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: Scratch.vm.runtime.stageHeight,
              },
            },
          },
          {
            opcode: "setInteractive",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页交互性为 [INTERACTIVE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              INTERACTIVE: {
                type: Scratch.ArgumentType.STRING,
                menu: "interactiveMenu",
              },
            },
          },
          {
            opcode: "setResize",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页调整行为为 [RESIZE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              RESIZE: {
                type: Scratch.ArgumentType.STRING,
                menu: "resizeMenu",
              },
            },
          },
          {
            opcode: "setLayer",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置名字为 [NAME] 的网页层级为 [LAYER]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "网页1",
              },
              LAYER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1",
              },
            },
          },
        ],
        menus: {
          userAgentMenu: {
            acceptReporters: true,
            items: [
              {
                text: "电脑",
                value: "desktop",
              },
              {
                text: "手机",
                value: "mobile",
              },
              {
                text: "默认",
                value: "default",
              }
            ],
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
        },
      };
    }

    async display({ URL, NAME }) {
      const url = Scratch.Cast.toString(URL);
      const name = Scratch.Cast.toString(NAME);
      
      if (await Scratch.canEmbed(url)) {
        createFrame(url, name);
      }
    }

    async displayHTML({ HTML, NAME }) {
      const html = Scratch.Cast.toString(HTML);
      const name = Scratch.Cast.toString(NAME);
      const url = `data:text/html;,${encodeURIComponent(html)}`;
      
      if (await Scratch.canEmbed(url)) {
        createFrame(url, name);
      }
    }

    show({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = true;
        updateFrameAttributes(name);
      }
    }

    hide({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = false;
        updateFrameAttributes(name);
      }
    }

    close({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      closeFrame(name);
    }

    showUrl({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        return iframesMap.get(name).url;
      }
      return "";
    }

    refresh({ NAME }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        const iframe = frameInfo.iframe;
        try {
          iframe.contentWindow.location.reload();
        } catch (error) {
          const url = iframe.src;
          iframe.src = "";
          setTimeout(() => {
            iframe.src = url;
          }, 10);
        }
      }
    }

    setUrl({ NAME, URL }) {
      const name = Scratch.Cast.toString(NAME);
      const url = Scratch.Cast.toString(URL);
      
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.iframe.src = url;
        frameInfo.url = url;
      }
    }

    closeAll() {
      const names = Array.from(iframesMap.keys());
      for (const name of names) {
        closeFrame(name);
      }
    }

    hideAll() {
      for (const name of iframesMap.keys()) {
        const frameInfo = iframesMap.get(name);
        frameInfo.visible = false;
        updateFrameAttributes(name);
      }
    }

    getAllNames() {
      return Array.from(iframesMap.keys()).join(", ");
    }

    setUserAgent({ TYPE }) {
      // 实际应用中需要更复杂的实现
      // 这里仅作为示例
      console.log(`UserAgent设置为: ${TYPE}`);
    }

    setPosition({ NAME, X, Y }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.x = Scratch.Cast.toNumber(X);
        frameInfo.y = Scratch.Cast.toNumber(Y);
        updateFrameAttributes(name);
      }
    }

    setSize({ NAME, WIDTH, HEIGHT }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.width = Scratch.Cast.toNumber(WIDTH);
        frameInfo.height = Scratch.Cast.toNumber(HEIGHT);
        updateFrameAttributes(name);
      }
    }

    setInteractive({ NAME, INTERACTIVE }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.interactive = Scratch.Cast.toBoolean(INTERACTIVE);
        updateFrameAttributes(name);
      }
    }

    setResize({ NAME, RESIZE }) {
      const name = Scratch.Cast.toString(NAME);
      if (iframesMap.has(name) && (RESIZE === "scale" || RESIZE === "viewport")) {
        const frameInfo = iframesMap.get(name);
        frameInfo.resizeBehavior = RESIZE;
        updateFrameAttributes(name);
      }
    }

    setLayer({ NAME, LAYER }) {
      const name = Scratch.Cast.toString(NAME);
      const layer = Scratch.Cast.toNumber(LAYER);
      
      if (iframesMap.has(name)) {
        const frameInfo = iframesMap.get(name);
        frameInfo.layer = layer;
        frameInfo.iframe.style.zIndex = layer;
      }
    }
  }

  Scratch.extensions.register(new IframeExtension());
})(Scratch);