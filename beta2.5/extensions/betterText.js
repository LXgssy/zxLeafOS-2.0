(function (Scratch) {
  "use strict";

  const blockIconURI =
    "data:image/svg+xml;,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22284.242%22%20height%3D%22284.242%22%3E%3Cg%20fill-rule%3D%22evenodd%22%20stroke-miterlimit%3D%2210%22%20data-paper-data%3D%22%7B%26quot%3BisPaintingLayer%26quot%3B%3Atrue%7D%22%20style%3D%22mix-blend-mode%3Anormal%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M188.894%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.48%209.888a1671.47%201671.47%200%200%200-4.174%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.83%20522.83%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.329%20157.508H225.43l-9.636-26.111h-54.08l-9.636%2026.11h-43.432l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22%2396f%22%20stroke%3D%22%237240d6%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%2229%22%20d%3D%22M188.894%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.48%209.888a1671.47%201671.47%200%200%200-4.174%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.83%20522.83%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.329%20157.508H225.43l-9.636-26.111h-54.08l-9.636%2026.11h-43.432l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M188.894%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.48%209.888a1671.47%201671.47%200%200%200-4.174%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.302%20408.302%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.329%20157.508H225.43l-9.636-26.111h-54.08l-9.636%2026.11h-43.432l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22%23ffa24d%22%20stroke%3D%22%23fff%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%229%22%20d%3D%22M188.894%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.48%209.888a1671.47%201671.47%200%200%200-4.174%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.302%20408.302%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.329%20157.508H225.43l-9.636-26.111h-54.08l-9.636%2026.11h-43.432l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M143.696%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888a1671.47%201671.47%200%200%200-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.33%20157.508h-44.312l-9.637-26.111h-54.08l-9.636%2026.11H63.448l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22%2396f%22%20stroke%3D%22%237240d6%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%2229%22%20d%3D%22M143.696%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888a1671.47%201671.47%200%200%200-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.33%20157.508h-44.312l-9.637-26.111h-54.08l-9.636%2026.11H63.448l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M143.696%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888a1671.47%201671.47%200%200%200-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.33%20157.508h-44.312l-9.637-26.111h-54.08l-9.636%2026.11H63.448l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22%23ff774d%22%20stroke%3D%22%23fff%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%229%22%20d%3D%22M143.696%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888a1671.47%201671.47%200%200%200-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.827%20522.827%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.519-56.092%2062.33%20157.508h-44.312l-9.637-26.111h-54.08l-9.636%2026.11H63.448l62.768-157.507Z%22%2F%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M94.748%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888-1.27%203.442-2.66%207.263-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.885%20522.885%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.52-56.092%2062.328%20157.508h-44.311l-9.637-26.111h-54.08l-9.635%2026.11H14.5L77.269%2063.368Z%22%2F%3E%3Cpath%20fill%3D%22%2396f%22%20stroke%3D%22%237240d6%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%2229%22%20d%3D%22M94.748%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888-1.27%203.442-2.66%207.263-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.885%20522.885%200%200%201-4.065-11.242%20408.343%20408.343%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.52-56.092%2062.328%20157.508h-44.311l-9.637-26.111h-54.08l-9.635%2026.11H14.5L77.269%2063.368Z%22%2F%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M94.748%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888-1.27%203.442-2.66%207.263-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.885%20522.885%200%200%201-4.065-11.242%20408.302%20408.302%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.52-56.092%2062.328%20157.508h-44.311l-9.637-26.111h-54.08l-9.635%2026.11H14.5L77.269%2063.368Z%22%2F%3E%3Cpath%20fill%3D%22%23ff4c4c%22%20stroke%3D%22%23fff%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%229%22%20d%3D%22M94.748%20119.459c-.706%202.378-1.43%204.69-2.172%206.933-1.05%203.15-2.21%206.445-3.479%209.888-1.27%203.442-2.66%207.263-4.175%2011.462l-5.73%2015.528h30.833l-5.73-15.528a522.885%20522.885%200%200%201-4.065-11.242%20408.302%20408.302%200%200%201-3.37-10.108%20350.767%20350.767%200%200%201-2.112-6.933zm18.52-56.092%2062.328%20157.508h-44.311l-9.637-26.111h-54.08l-9.635%2026.11H14.5L77.269%2063.368Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

  const CUSTOM_STATE_KEY = Symbol();

  const ALIGN_LEFT = 0;
  const ALIGN_RIGHT = 1;
  const ALIGN_CENTER = 2;

  const vm = Scratch.vm;
  const renderer = vm.renderer;
  const gl = renderer.gl;

  const FONTS = [
    "Sans Serif",
    "Serif",
    "Handwriting",
    "Marker",
    "Curly",
    "Pixel",
    "Scratch",
  ];

  const DEFAULT_COLOR = "#575e75";
  const DEFAULT_FONT = "Handwriting";
  const DEFAULT_ALIGN = ALIGN_CENTER;
  const DEFAULT_FONT_SIZE = 24;
  const DEFAULT_OUTLINE_WIDTH = 0; // 0 = no outline
  const DEFAULT_OUTLINE_COLOR = "#000000";

  const DEFAULT_TYPE_DELAY = 1000 / 15;

  const RAINBOW_TIME_PER = 1000;
  const DEFAULT_RAINBOW_DURATION = 2000;

  const DEFAULT_ZOOM_DURATION = 500;

  const DEFAULT_SHAKE_INTENSITY = 100;
  const DEFAULT_SHAKE_DURATION = 500;

  let globalFrameTime = 0;

  if (!renderer.exports || !renderer.exports.Skin || !vm.exports) {
    alert("VM is too old for animated text extension");
    throw new Error("VM is too old");
  }

  const Skin = renderer.exports.Skin;
  const CanvasMeasurementProvider = renderer.exports.CanvasMeasurementProvider;
  const twgl = renderer.exports.twgl;
  const RenderedTarget = vm.exports.RenderedTarget;

  const formatComponent = (c) => Math.round(c).toString(16).padStart(2, "0");

  const formatColor = (color) =>
    `#${formatComponent(color[0])}${formatComponent(color[1])}${formatComponent(
      color[2]
    )}`;

  const hsvToRGB = (h, s, v) => {
    var r, g, b;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        ((r = v), (g = t), (b = p));
        break;
      case 1:
        ((r = q), (g = v), (b = p));
        break;
      case 2:
        ((r = p), (g = v), (b = t));
        break;
      case 3:
        ((r = p), (g = q), (b = v));
        break;
      case 4:
        ((r = t), (g = p), (b = v));
        break;
      case 5:
        ((r = v), (g = p), (b = q));
        break;
    }
    return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
  };

  const addRainbowStops = (gradient, offset) => {
    const NUMBER_STOPS = 20;
    for (let i = 0; i < NUMBER_STOPS; i++) {
      const exactPosition = i / NUMBER_STOPS;
      let offsetPosition = (exactPosition - offset) % 1;
      if (offsetPosition < 0) {
        offsetPosition += 1;
      }
      const rgb = hsvToRGB(offsetPosition, 1, 1);
      gradient.addColorStop(exactPosition, formatColor(rgb));
    }
  };

  class TextCostumeSkin extends Skin {
    constructor(id, drawable) {
      super(id, renderer);

      this.drawable = drawable;
      this._previousDrawableXScale = 100;

      this.canvas = document.createElement("canvas");
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.ctx = this.canvas.getContext("2d");

      this.text = "";
      this.color = DEFAULT_COLOR;
      this.textWidth = vm.runtime.stageWidth;
      this.fontFamily = DEFAULT_FONT;
      this.baseFontSize = DEFAULT_FONT_SIZE;
      this.align = DEFAULT_ALIGN;
      this.outlineWidth = DEFAULT_OUTLINE_WIDTH;
      this.outlineColor = DEFAULT_OUTLINE_COLOR;

      this.lines = [];
      this._size = [0, 0];
      this._rotationCenter = [0, 0];

      this.calculatedFontSize = 0;
      this.lineHeight = 0;
      this.verticalPadding = 0;
      this.wrapWidth = 0;

      this._textDirty = false;
      this._textureDirty = false;
      this._renderedAtScale = 1;
      this._renderTime = 0;
      this._reflowTime = 0;

      this.isTyping = false;
      this.typeAnimationInterval = null;
      this.typeDelay = DEFAULT_TYPE_DELAY;

      this.isRainbow = false;
      this.rainbowStartTime = 0;
      this.rainbowTimeout = null;
      this.rainbowDuration = DEFAULT_RAINBOW_DURATION;

      this.isZooming = false;
      this.zoomStartTime = 0;
      this.zoomTimeout = null;
      this.zoomDuration = DEFAULT_ZOOM_DURATION;

      this.isShaking = false;
      this.shakeStartTime = 0;
      this.shakeTimeout = null;
      this.shakeDuration = DEFAULT_SHAKE_DURATION;
      this.shakeIntensity = DEFAULT_SHAKE_INTENSITY;

      this.codeHighlightEnabled = false;
      this.codeLanguage = "js";

      this.resolveOngoingAnimation = null;
    }

    dispose() {
      if (this._texture) {
        gl.deleteTexture(this._texture);
        this._texture = null;
      }
      this.canvas = null;
      this.ctx = null;
      super.dispose();
    }

    get size() {
      if (this._needsReflow()) {
        this._reflowText();
      }
      return this._size;
    }

    useNearest() {
      return false;
    }

    _needsReflow() {
      return (
        this._textDirty ||
        (this.isZooming && this._reflowTime !== globalFrameTime) ||
        (this.isShaking && this._reflowTime !== globalFrameTime) ||
        this._previousDrawableXScale !== Math.abs(this.drawable.scale[0])
      );
    }

    _updateFontDimensions() {
      this.calculatedFontSize = this.baseFontSize;
      if (this.isZooming) {
        const time = globalFrameTime - this.zoomStartTime;
        const progress = Math.max(0, Math.min(1, time / this.zoomDuration));
        this.calculatedFontSize *= progress;
      }
      this.lineHeight = (this.baseFontSize * 8) / 7;
      this.verticalPadding = this.baseFontSize / 7;
      this.wrapWidth =
        this.textWidth / (Math.abs(this.drawable.scale[0]) / 100);
    }

    _getFontStyle() {
      return `${this.calculatedFontSize}px ${this.fontFamily}, sans-serif`;
    }

    _reflowText() {
      this._textDirty = false;
      this._textureDirty = true;
      this._reflowTime = globalFrameTime;
      this._previousDrawableXScale = Math.abs(this.drawable.scale[0]);

      this._updateFontDimensions();
      this.ctx.font = this._getFontStyle();

      const measurementProvider = new CanvasMeasurementProvider(this.ctx);
      const textWrapper = renderer.createTextWrapper(measurementProvider);

      const lines = textWrapper.wrapText(this.wrapWidth, this.text);
      this.lines = lines.map((line) => {
        const trimmed = line.trimEnd();
        return {
          text: trimmed,
          width: measurementProvider.measureText(trimmed),
        };
      });

      this._size[0] = this.wrapWidth + 2 * this.outlineWidth;
      this._size[1] =
        this.lines.length * this.lineHeight +
        2 * this.verticalPadding +
        2 * this.outlineWidth;

      this._rotationCenter[0] = this._size[0] / 2;
      this._rotationCenter[1] =
        this.calculatedFontSize * 0.9 +
        this.verticalPadding +
        this.outlineWidth;

      if (this.isShaking) {
        const padding = Math.max(0, this.shakeIntensity / 20);
        this._rotationCenter[0] += 2 * Math.random() * padding - padding;
        this._rotationCenter[1] += 2 * Math.random() * padding - padding;
      }
    }

    _renderAtScale(requestedScale) {
      this._renderedAtScale = requestedScale;
      this._textureDirty = false;
      this._renderTime = globalFrameTime;

      const scratchWidth = this._size[0];
      const scratchHeight = this._size[1];

      this.canvas.width = Math.ceil(scratchWidth * requestedScale);
      this.canvas.height = Math.ceil(scratchHeight * requestedScale);
      this.ctx.scale(requestedScale, requestedScale);

      this.ctx.translate(this.outlineWidth, this.outlineWidth);

      const rainbowOffset = this.isRainbow
        ? (globalFrameTime - this.rainbowStartTime) / RAINBOW_TIME_PER
        : 0;
      this.ctx.fillStyle = this.color;
      this.ctx.font = this._getFontStyle();
      
      for (let i = 0; i < this.lines.length; i++) {
        const line = this.lines[i];
        const text = line.text;
        const lineWidth = line.width;

        let xOffset;
        const yOffset =
          this.verticalPadding + i * this.lineHeight + this.baseFontSize;
        if (this.align === ALIGN_LEFT) {
          xOffset = 0;
        } else if (this.align === ALIGN_CENTER) {
          xOffset = (this.wrapWidth - lineWidth) / 2;
        } else {
          xOffset = this.wrapWidth - lineWidth;
        }

        if (this.isRainbow) {
          const gradient = this.ctx.createLinearGradient(
            xOffset,
            0,
            xOffset + lineWidth,
            0
          );
          addRainbowStops(gradient, rainbowOffset);
          this.ctx.fillStyle = gradient;
        }

        if (this.outlineWidth > 0) {
          this.ctx.lineWidth = this.outlineWidth;
          this.ctx.strokeStyle = this.outlineColor;
          this.ctx.lineCap = "round";
          this.ctx.lineJoin = "round";
          this.ctx.strokeText(text, xOffset, yOffset);
        }

        this.ctx.fillText(text, xOffset, yOffset);
      }

      if (!this._texture) {
        this._texture = twgl.createTexture(gl, {
          auto: false,
          wrap: gl.CLAMP_TO_EDGE,
        });
      }
      this._setTexture(this.canvas);
    }

    _invalidateTexture() {
      this._textureDirty = true;
      this._renderTime = 0;
      this.emitWasAltered();
    }

    _invalidateText() {
      this._textDirty = true;
      this._textureDirty = true;
      this._reflowTime = 0;
      this.emitWasAltered();
    }

    setText(text) {
      if (text !== this.text) {
        this.text = text;
        this._invalidateText();
      }
    }

    setColor(color) {
      if (color !== this.color) {
        this.color = color;
        this._invalidateTexture();
      }
    }

    setOutlineColor(color) {
      if (color !== this.color) {
        this.outlineColor = color;
        this._invalidateTexture();
      }
    }

    setOutlineWidth(width) {
      this.outlineWidth = width;
      this._invalidateText();
    }

    setAlign(align) {
      if (align !== this.align) {
        this.align = align;
        this._invalidateTexture();
      }
    }

    setWidth(width) {
      if (width !== this.textWidth) {
        this.textWidth = width;
        this._invalidateText();
      }
    }

    setFontFamily(font) {
      if (font !== this.fontFamily) {
        this.fontFamily = font;
        this._invalidateText();
      }
    }

    getFontFamily() {
      return this.fontFamily;
    }

    getColor() {
      return this.color;
    }

    getWidth() {
      return this.textWidth;
    }

    getOutlineColor() {
      return this.outlineColor;
    }

    getOutlineWidth() {
      return this.outlineWidth;
    }

    getAlign() {
      return this.align;
    }

    _oneAnimationAtATime(newCallback) {
      this.cancelAnimation();
      return new Promise((resolve) => {
        this.resolveOngoingAnimation = () => {
          this.resolveOngoingAnimation = null;
          resolve();
        };
        newCallback(this.resolveOngoingAnimation);
      });
    }

    startTypeAnimation() {
      return this._oneAnimationAtATime((resolve) => {
        this.isTyping = true;
        const originalText = this.text;
        let i = 1;
        const update = () => {
          this.setText(originalText.substring(0, i));
        };
        update();

        this.typeAnimationInterval = setInterval(() => {
          i++;
          update();
          if (i >= originalText.length) {
            clearInterval(this.typeAnimationInterval);
            this.isTyping = false;
            resolve();
          }
        }, this.typeDelay);
      });
    }

    setTypeDelay(delay) {
      this.typeDelay = delay;
    }

    startRainbowAnimation() {
      return this._oneAnimationAtATime((resolve) => {
        this.isRainbow = true;
        this.rainbowStartTime = Date.now();
        this._invalidateTexture();
        this.rainbowTimeout = setTimeout(() => {
          this.isRainbow = false;
          resolve();
          this._invalidateTexture();
        }, this.rainbowDuration);
      });
    }

    setRainbowDuration(duration) {
      this.rainbowDuration = duration;
    }

    startZoomAnimation() {
      return this._oneAnimationAtATime((resolve) => {
        this.isZooming = true;
        this.zoomStartTime = Date.now();
        this._invalidateText();
        this.zoomTimeout = setTimeout(() => {
          this.isZooming = false;
          resolve();
          this._invalidateText();
        }, this.zoomDuration);
      });
    }

    setZoomDuration(duration) {
      this.zoomDuration = duration;
    }

    startShakeAnimation() {
      return this._oneAnimationAtATime((resolve) => {
        this.isShaking = true;
        this.shakeStartTime = Date.now();
        this._invalidateText();
        this.shakeTimeout = setTimeout(() => {
          this.isShaking = false;
          resolve();
          this._invalidateText();
        }, this.shakeDuration);
      });
    }

    setShakeDuration(duration) {
      this.shakeDuration = duration;
    }

    setShakeIntensity(intensity) {
      this.shakeIntensity = intensity;
    }

    setCodeHighlight(enabled) {
      this.codeHighlightEnabled = enabled;
    }

    setCodeLanguage(lang) {
      this.codeLanguage = lang;
    }

    cancelAnimation() {
      if (this.resolveOngoingAnimation) {
        this.resolveOngoingAnimation();
        this.resolveOngoingAnimation = null;

        this.isTyping = false;
        clearInterval(this.typeAnimationInterval);

        this.isRainbow = false;
        clearTimeout(this.rainbowTimeout);

        this.isZooming = false;
        clearTimeout(this.zoomTimeout);

        this.isShaking = false;
        clearTimeout(this.shakeTimeout);

        this._invalidateText();
      }
    }

    updateSilhouette(scale) {
      this.getTexture(scale);
      this._silhouette.unlazy();
    }

    getTexture(scale) {
      const MAX_SCALE = 10;
      const upperScale = scale
        ? Math.max(Math.abs(scale[0]), Math.abs(scale[1]))
        : 100;
      const calculatedScale = Math.min(MAX_SCALE, upperScale / 100);

      if (this._needsReflow()) {
        this._reflowText();
      }
      if (
        this._textureDirty ||
        (this.isRainbow && this._renderTime !== globalFrameTime) ||
        calculatedScale !== this._renderedAtScale
      ) {
        this._renderAtScale(calculatedScale);
      }

      return this._texture;
    }

    isMetricsReady() {
      if (this._needsReflow()) {
        this._reflowText();
      }
      return true;
    }
  }

  const createTextCostumeSkin = (target) => {
    const drawable = renderer._allDrawables[target.drawableID];
    const id = renderer._nextSkinId++;
    const skin = new TextCostumeSkin(id, drawable);
    renderer._allSkins[id] = skin;
    return skin;
  };

  vm.runtime.on("BEFORE_EXECUTE", () => {
    globalFrameTime = Date.now();

    for (let i = 0; i < renderer._allSkins.length; i++) {
      const skin = renderer._allSkins[i];
      if (
        skin instanceof TextCostumeSkin &&
        (skin.isRainbow || skin.isZooming || skin.isShaking)
      ) {
        skin.emitWasAltered();
      }
    }
  });

  class BetterAnimatedText {
    constructor() {
      vm.runtime.on("PROJECT_START", () => {
        this._hideAllText();
      });

      vm.runtime.on("PROJECT_STOP_ALL", () => {
        this._hideAllText();
      });

      const extension = this;
      const originalMakeClone = RenderedTarget.prototype.makeClone;
      RenderedTarget.prototype.makeClone = function () {
        const newClone = originalMakeClone.call(this);
        if (extension._hasState(this)) {
          const originalSkin = extension._getState(this).skin;
          const newSkin = extension._getState(newClone).skin;
          newSkin.setAlign(originalSkin.align);
          newSkin.setColor(originalSkin.color);
          newSkin.setFontFamily(originalSkin.fontFamily);
          newSkin.setWidth(originalSkin.textWidth);
          newSkin.setText(originalSkin.text);
          newSkin.setRainbowDuration(originalSkin.rainbowDuration);
          newSkin.setZoomDuration(originalSkin.zoomDuration);
          newSkin.setTypeDelay(originalSkin.typeDelay);
          newSkin.setCodeHighlight(originalSkin.codeHighlightEnabled);
          newSkin.setCodeLanguage(originalSkin.codeLanguage);
          if (
            renderer._allDrawables[this.drawableID].skin instanceof
            TextCostumeSkin
          ) {
            renderer.updateDrawableSkinId(newClone.drawableID, newSkin.id);
          }
        }
        return newClone;
      };

      vm.runtime.on("targetWasRemoved", (target) => {
        if (this._hasState(target)) {
          const state = this._getState(target);
          renderer.destroySkin(state.skin.id);
        }
      });
    }

    getInfo() {
      return {
        id: "betterText",
        name: "更好的艺术字",
        color1: "#c28bff",
        blockIconURI: blockIconURI,
        blocks: [
          {
            opcode: "setText",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示文本 [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "欢迎来到我的项目！",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "animateText",
            blockType: Scratch.BlockType.COMMAND,
            text: "[ANIMATE] 文本 [TEXT]",
            arguments: {
              ANIMATE: {
                type: Scratch.ArgumentType.STRING,
                menu: "animate",
                defaultValue: "rainbow",
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "现在出发！",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "clearText",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示角色",
            extensions: ["colours_looks"],
          },
          "---",
          {
            opcode: "setFont",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置字体为 [FONT]",
            arguments: {
              FONT: {
                type: Scratch.ArgumentType.STRING,
                menu: "font",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "setColor",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置文本颜色为 [COLOR]",
            arguments: {
              COLOR: {
                type: Scratch.ArgumentType.COLOR,
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "setWidth",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置宽度为 [WIDTH] 对齐方式 [ALIGN]",
            arguments: {
              WIDTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "200",
              },
              ALIGN: {
                type: Scratch.ArgumentType.STRING,
                menu: "align",
              },
            },
            extensions: ["colours_looks"],
          },
          "---",
          
          // 新增的积木
          {
            opcode: "hideTargetText",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏该角色的文本",
            extensions: ["colours_looks"],
          },
          {
            opcode: "hideAllText",
            blockType: Scratch.BlockType.COMMAND,
            text: "隐藏所有文本",
            extensions: ["colours_looks"],
          },
          {
            opcode: "showAllText",
            blockType: Scratch.BlockType.COMMAND,
            text: "显示所有文本",
            extensions: ["colours_looks"],
          },
          {
            opcode: "getTargetTextInfo",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取这个角色的文字的 [ATTRIBUTE]",
            arguments: {
              ATTRIBUTE: {
                type: Scratch.ArgumentType.STRING,
                menu: "textAttribute",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "enableCodeHighlight",
            blockType: Scratch.BlockType.COMMAND,
            text: "启动代码语法高亮",
            extensions: ["colours_looks"],
          },
          {
            opcode: "disableCodeHighlight",
            blockType: Scratch.BlockType.COMMAND,
            text: "关闭代码语法高亮",
            extensions: ["colours_looks"],
          },
          {
            opcode: "setCodeLanguage",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置代码高亮语法为 [LANG]",
            arguments: {
              LANG: {
                type: Scratch.ArgumentType.STRING,
                menu: "codeLang",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "addLine",
            blockType: Scratch.BlockType.COMMAND,
            text: "添加一行文本 [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "你好！",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "insertLineBefore",
            blockType: Scratch.BlockType.COMMAND,
            text: "在第 [LINE] 行上面添加一行文本 [TEXT]",
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "插入的文本",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "insertLineAfter",
            blockType: Scratch.BlockType.COMMAND,
            text: "在第 [LINE] 行下面添加一行文本 [TEXT]",
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "插入的文本",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "getLineContent",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取第 [LINE] 行文本内容",
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "setLineContent",
            blockType: Scratch.BlockType.COMMAND,
            text: "重新设置第 [LINE] 行文本内容为 [TEXT]",
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "新文本",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "deleteLine",
            blockType: Scratch.BlockType.COMMAND,
            text: "删除第 [LINE] 行文本",
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "getLineCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "文本有几行？",
            extensions: ["colours_looks"],
          },
          "---",
          
          // 获取时间相关积木
          {
            opcode: "getCurrentTime",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取当前时间",
            extensions: ["colours_looks"],
          },
          {
            opcode: "getCurrentDate",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取当前日期",
            extensions: ["colours_looks"],
          },
          {
            opcode: "copyText",
            blockType: Scratch.BlockType.COMMAND,
            text: "复制文本 [TEXT] 到剪贴板",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "要复制的文本",
              },
            },
            extensions: ["colours_looks"],
          },
          {
            opcode: "getClipboard",
            blockType: Scratch.BlockType.REPORTER,
            text: "获取剪贴板内容",
            extensions: ["colours_looks"],
          },
        ],
        menus: {
          animate: {
            acceptReporters: false,
            items: [
              {
                text: "逐字显示",
                value: "type",
              },
              {
                text: "彩虹色",
                value: "rainbow",
              },
              {
                text: "移动动画",
                value: "zoom",
              },
              {
                text: "抖动",
                value: "shake",
              },
            ],
          },
          font: {
            acceptReporters: false,
            items: "getFonts",
          },
          align: {
            acceptReporters: false,
            items: [
              {
                text: "居左",
                value: "left",
              },
              {
                text: "居中",
                value: "center",
              },
              {
                text: "居右",
                value: "right",
              },
            ],
          },
          textAttribute: {
            acceptReporters: false,
            items: [
              "字体",
              "内容",
            ],
          },
          codeLang: {
            acceptReporters: false,
            items: [
              "js",
              "py",
              "c",
              "cpp",
              "php",
              "go",
              "rust",
              "html",
              "css",
              "java",
            ],
          },
        },
      };
    }

    getFonts() {
      const customFonts = this._getFontsMap();
      return [
        ...FONTS,
        ...customFonts,
        {
          text: "随机字体",
          value: "Random",
        },
      ];
    }

    _getFontsMap() {
      return Scratch.vm.runtime.fontManager
        ? Scratch.vm.runtime.fontManager.getFonts().map((i) => ({
            text: i.name,
            value: i.family,
          }))
        : [];
    }

    _getState(target) {
      const state = target[CUSTOM_STATE_KEY];
      if (!state) {
        const newState = {
          skin: createTextCostumeSkin(target),
        };
        target[CUSTOM_STATE_KEY] = newState;
        return newState;
      }
      return state;
    }

    _hasState(target) {
      return !!target[CUSTOM_STATE_KEY];
    }

    _hideAllText() {
      for (const target of vm.runtime.targets) {
        if (this._hasState(target)) {
          this._hideText(target, this._getState(target));
        }
      }
    }

    _renderText(target, state) {
      state.skin.cancelAnimation();
      renderer.updateDrawableSkinId(target.drawableID, state.skin.id);
    }

    _hideText(target, state) {
      state.skin.cancelAnimation();
      target.setCostume(target.currentCostume);
    }

    setText({ TEXT }, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);
      state.skin.setText(Scratch.Cast.toString(TEXT));
      util.runtime.requestRedraw();
    }

    animateText({ ANIMATE, TEXT }, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      state.skin.setText(Scratch.Cast.toString(TEXT));
      state.skin.cancelAnimation();

      if (ANIMATE === "type") {
        return state.skin.startTypeAnimation();
      } else if (ANIMATE === "rainbow") {
        return state.skin.startRainbowAnimation();
      } else if (ANIMATE === "zoom") {
        return state.skin.startZoomAnimation();
      } else if (ANIMATE === "shake") {
        return state.skin.startShakeAnimation();
      } else {
        // Scratch does nothing here
      }
    }

    clearText(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        this._hideText(util.target, state);
      }
      util.runtime.requestRedraw();
    }

    setFont({ FONT }, util) {
      const font = Scratch.Cast.toString(FONT);
      const state = this._getState(util.target);

      if (font === "Random") {
        const possibleFonts = [
          ...FONTS,
          ...this._getFontsMap().map((i) => i.value),
        ].filter((i) => i !== state.skin.fontFamily);
        state.skin.setFontFamily(
          possibleFonts[Math.floor(Math.random() * possibleFonts.length)]
        );
      } else {
        state.skin.setFontFamily(font);
      }
    }

    setColor({ COLOR }, util) {
      const state = this._getState(util.target);
      state.skin.setColor(Scratch.Cast.toString(COLOR));
    }

    setWidth({ WIDTH, ALIGN }, util) {
      const state = this._getState(util.target);

      if (ALIGN === "center") {
        state.skin.setAlign(ALIGN_CENTER);
      } else if (ALIGN === "right") {
        state.skin.setAlign(ALIGN_RIGHT);
      } else {
        state.skin.setAlign(ALIGN_LEFT);
      }

      state.skin.setWidth(Scratch.Cast.toNumber(WIDTH));
    }

    // 新增功能
    hideTargetText(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        this._hideText(util.target, state);
      }
    }

    hideAllText(args, util) {
      this._hideAllText();
    }

    showAllText(args, util) {
      for (const target of vm.runtime.targets) {
        if (this._hasState(target)) {
          const state = this._getState(target);
          this._renderText(target, state);
        }
      }
    }

    getTargetTextInfo(args, util) {
      const state = this._getState(util.target);
      if (args.ATTRIBUTE === "字体") {
        return state.skin.getFontFamily();
      } else if (args.ATTRIBUTE === "内容") {
        return state.skin.text;
      }
      return "";
    }

    enableCodeHighlight(args, util) {
      const state = this._getState(util.target);
      state.skin.setCodeHighlight(true);
    }

    disableCodeHighlight(args, util) {
      const state = this._getState(util.target);
      state.skin.setCodeHighlight(false);
    }

    setCodeLanguage(args, util) {
      const state = this._getState(util.target);
      state.skin.setCodeLanguage(Scratch.Cast.toString(args.LANG));
    }

    addLine(args, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      const originalText = state.skin.text;
      const addingText = Scratch.Cast.toString(args.TEXT);
      state.skin.setText(
        originalText ? `${originalText}\n${addingText}` : addingText
      );
      util.runtime.requestRedraw();
    }

    insertLineBefore(args, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      const lineNum = Scratch.Cast.toNumber(args.LINE);
      const newText = Scratch.Cast.toString(args.TEXT);
      const lines = state.skin.text.split('\n');
      
      if (lineNum <= 0 || lineNum > lines.length + 1) {
        return; // 不合法的行号
      }
      
      lines.splice(lineNum - 1, 0, newText);
      state.skin.setText(lines.join('\n'));
      util.runtime.requestRedraw();
    }

    insertLineAfter(args, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      const lineNum = Scratch.Cast.toNumber(args.LINE);
      const newText = Scratch.Cast.toString(args.TEXT);
      const lines = state.skin.text.split('\n');
      
      if (lineNum <= 0 || lineNum > lines.length) {
        return; // 不合法的行号
      }
      
      lines.splice(lineNum, 0, newText);
      state.skin.setText(lines.join('\n'));
      util.runtime.requestRedraw();
    }

    getLineContent(args, util) {
      const state = this._getState(util.target);
      const lineNum = Scratch.Cast.toNumber(args.LINE);
      const lines = state.skin.text.split('\n');
      
      if (lineNum <= 0 || lineNum > lines.length) {
        return ""; // 不合法的行号
      }
      
      return lines[lineNum - 1];
    }

    setLineContent(args, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      const lineNum = Scratch.Cast.toNumber(args.LINE);
      const newText = Scratch.Cast.toString(args.TEXT);
      const lines = state.skin.text.split('\n');
      
      if (lineNum <= 0 || lineNum > lines.length) {
        return; // 不合法的行号
      }
      
      lines[lineNum - 1] = newText;
      state.skin.setText(lines.join('\n'));
      util.runtime.requestRedraw();
    }

    deleteLine(args, util) {
      const state = this._getState(util.target);
      this._renderText(util.target, state);

      const lineNum = Scratch.Cast.toNumber(args.LINE);
      const lines = state.skin.text.split('\n');
      
      if (lineNum <= 0 || lineNum > lines.length) {
        return; // 不合法的行号
      }
      
      lines.splice(lineNum - 1, 1);
      state.skin.setText(lines.join('\n'));
      util.runtime.requestRedraw();
    }

    getLineCount(args, util) {
      const state = this._getState(util.target);
      const lines = state.skin.text.split('\n');
      return lines.length;
    }

    getCurrentTime(args, util) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    getCurrentDate(args, util) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}年${month}月${day}日`;
    }

    async copyText(args, util) {
      const text = Scratch.Cast.toString(args.TEXT);
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        // 如果浏览器不支持 navigator.clipboard，使用备用方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }

    async getClipboard(args, util) {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        // 如果浏览器不支持 navigator.clipboard，返回空字符串
        return '';
      }
    }
  }

  Scratch.extensions.register(new BetterAnimatedText());
})(Scratch);