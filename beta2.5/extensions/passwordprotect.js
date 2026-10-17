(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("密码保护扩展必须作为无沙箱扩展运行。");
  }

  const PASSWORD_KEY = "tw_password_protection_hash";
  const SLOGAN_KEY = "tw_password_protection_slogans";
  const GUARD_KEY = "tw_password_protection_guard";
  const ENC_FLAG_KEY = "tw_password_protection_enclock";
  const SALT2_KEY = "tw_password_protection_enckdf";
  const PBKDF2_ITERATIONS = 500000;
  const OBF = "TwPr0t3ct!X0r9#2026";
  const DOM_ID = "tw-po-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const BLUR_STYLE_ID = "tw-bs-" + Math.random().toString(36).slice(2);
  const DEVTAB_LOCK = true;

  let hasPassword = false;
  let isUnlocked = false;
  let contentLockEnabled = false;
  let unlockedEncKey = null;
  let globalSloganIndex = -1;
  let sloganTimer = null;
  let observer = null;
  let hostObserver = null;
  let watchTimer = null;
  let debugTimer = null;
  let tamperCount = 0;
  let internalWrite = false;
  let overlayShadow = null;
  let lastTamperReason = "";

  function bytesToHex(bytes) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function generateSalt() {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return bytesToHex(salt);
  }

  function xorStr(str, key) {
    let out = "";
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }

  function obfuscate(str) {
    return btoa(xorStr(String(str), OBF));
  }

  function deobfuscate(str) {
    try {
      return xorStr(atob(String(str)), OBF);
    } catch (e) {
      return null;
    }
  }

  function mirrorName(key) {
    return "twx" + btoa(xorStr(key, OBF)).replace(/[^A-Za-z0-9]/g, "");
  }

  function cookieGet(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function cookieSet(name, value) {
    try {
      document.cookie = name + "=" + encodeURIComponent(value) + ";path=/;max-age=31536000;SameSite=Lax";
    } catch (e) {}
  }

  function idbSet(key, value) {
    return new Promise((res) => {
      try {
        const r = indexedDB.open("twpp_db", 1);
        r.onupgradeneeded = () => {
          try {
            r.result.createObjectStore("kv");
          } catch (e) {}
        };
        r.onsuccess = () => {
          try {
            const tx = r.result.transaction("kv", "readwrite");
            tx.objectStore("kv").put(value, key);
            tx.oncomplete = () => res(true);
            tx.onerror = () => res(false);
          } catch (e) {
            res(false);
          }
        };
        r.onerror = () => res(false);
      } catch (e) {
        res(false);
      }
    });
  }

  function idbGet(key) {
    return new Promise((res) => {
      try {
        const r = indexedDB.open("twpp_db", 1);
        r.onupgradeneeded = () => {
          try {
            r.result.createObjectStore("kv");
          } catch (e) {}
        };
        r.onsuccess = () => {
          try {
            const tx = r.result.transaction("kv", "readonly");
            const g = tx.objectStore("kv").get(key);
            g.onsuccess = () => res(g.result || null);
            g.onerror = () => res(null);
          } catch (e) {
            res(null);
          }
        };
        r.onerror = () => res(null);
      } catch (e) {
        res(null);
      }
    });
  }

  function mirrorWrite(key, plainValue) {
    const name = mirrorName(key);
    const enc = obfuscate(plainValue);
    try {
      sessionStorage.setItem(name, enc);
    } catch (e) {}
    cookieSet(name, enc);
    idbSet(name, enc);
  }

  function mirrorReadSync(key) {
    const name = mirrorName(key);
    try {
      const s = sessionStorage.getItem(name);
      if (s) return deobfuscate(s);
    } catch (e) {}
    const c = cookieGet(name);
    if (c) return deobfuscate(c);
    return null;
  }

  async function mirrorReadFull(key) {
    const sync = mirrorReadSync(key);
    if (sync) return sync;
    const name = mirrorName(key);
    const stored = await idbGet(name);
    if (stored) return deobfuscate(stored);
    return null;
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    internalWrite = true;
    try {
      localStorage.setItem(key, value);
    } catch (e) {} finally {
      internalWrite = false;
    }
  }

  function safeRemove(key) {
    internalWrite = true;
    try {
      localStorage.removeItem(key);
    } catch (e) {} finally {
      internalWrite = false;
    }
  }

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return bytesToHex(new Uint8Array(hashBuffer));
  }

  async function pbkdf2(password, saltHex) {
    const salt = hexToBytes(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    return bytesToHex(new Uint8Array(bits));
  }

  async function deriveEncKey(password, saltHex) {
    const salt = hexToBytes(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }

  async function createPasswordRecord(password) {
    const salt = generateSalt();
    const hash = await pbkdf2(password, salt);
    return `${salt}:${hash}`;
  }

  async function verifyPassword(password, record) {
    if (!record) return false;
    if (record.includes(":")) {
      const parts = record.split(":");
      const salt = parts[0];
      const expected = parts[1];
      const actual = await pbkdf2(password, salt);
      return actual === expected;
    }
    const actual = await sha256(password);
    return actual === record;
  }

  function getSlogans() {
    try {
      const raw = localStorage.getItem(SLOGAN_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function saveSlogans(arr) {
    try {
      localStorage.setItem(SLOGAN_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function stopSloganTimer() {
    if (sloganTimer) {
      clearInterval(sloganTimer);
      sloganTimer = null;
    }
  }

  function isSkippable(el) {
    if (!el || !el.tagName) return true;
    const tag = el.tagName;
    return (
      el.id === DOM_ID ||
      tag === "SCRIPT" ||
      tag === "STYLE" ||
      tag === "LINK" ||
      tag === "META" ||
      tag === "TEMPLATE"
    );
  }

  function injectBlurStyle() {
    if (document.getElementById(BLUR_STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = BLUR_STYLE_ID;
    s.textContent = '[data-tw-blurred="1"]{filter:blur(30px)!important;pointer-events:none!important;}';
    (document.head || document.documentElement).appendChild(s);
  }

  function applyBlur() {
    if (!hasPassword || isUnlocked) return;
    injectBlurStyle();
    Array.from(document.body.children).forEach((child) => {
      if (isSkippable(child)) return;
      child.style.setProperty("filter", "blur(30px)", "important");
      child.style.setProperty("pointer-events", "none", "important");
      child.dataset.twBlurred = "1";
    });
    ["#app", "#root", "#project", "body > div"].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (isSkippable(el)) return;
        el.style.setProperty("filter", "blur(30px)", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.dataset.twBlurred = "1";
      });
    });
  }

  function removeBlur() {
    document.querySelectorAll('[data-tw-blurred="1"]').forEach((el) => {
      el.style.removeProperty("filter");
      el.style.removeProperty("pointer-events");
      delete el.dataset.twBlurred;
    });
    const bs = document.getElementById(BLUR_STYLE_ID);
    if (bs) bs.remove();
  }

  function assertHostVisible() {
    const host = document.getElementById(DOM_ID);
    if (!host) return;
    const cs = getComputedStyle(host);
    const hidden =
      cs.display === "none" ||
      cs.visibility === "hidden" ||
      parseFloat(cs.opacity) <= 0.01 ||
      (cs.filter && cs.filter !== "none") ||
      cs.transform !== "none" ||
      parseFloat(cs.zIndex) < 2147483000;
    if (hidden) {
      host.style.setProperty("display", "flex", "important");
      host.style.setProperty("visibility", "visible", "important");
      host.style.setProperty("opacity", "1", "important");
      host.style.setProperty("filter", "none", "important");
      host.style.setProperty("transform", "none", "important");
      host.style.setProperty("z-index", "2147483647", "important");
    }
  }

  function styleHost(host) {
    const props = {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      margin: "0",
      padding: "0",
      display: "flex",
      "flex-direction": "column",
      "align-items": "center",
      "justify-content": "center",
      background: "#0a0a14",
      "z-index": "2147483647",
      "font-family": "'Helvetica Neue', Arial, sans-serif",
      color: "#fff",
      filter: "none",
      "pointer-events": "auto",
    };
    Object.keys(props).forEach((k) => host.style.setProperty(k, props[k], "important"));
  }

  function attachHostObserver(host) {
    if (hostObserver) hostObserver.disconnect();
    hostObserver = new MutationObserver(() => {
      if (!hasPassword || isUnlocked) return;
      assertHostVisible();
    });
    hostObserver.observe(host, { attributes: true });
  }

  function createOverlay(reason) {
    if (!hasPassword || isUnlocked) return null;
    if (document.getElementById(DOM_ID)) return null;
    stopSloganTimer();
    const slogans = getSlogans();
    const host = document.createElement("div");
    host.id = DOM_ID;
    styleHost(host);
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        *{box-sizing:border-box}
        h2{margin:0 0 10px 0;font-size:22px;font-weight:500;color:#fff}
        .sub{margin:0 0 18px 0;font-size:15px;font-weight:600;color:#ffcc00}
        .hint{margin:0 0 10px 0;color:#9aa0b0;font-size:14px}
        #tw-password-slogan{margin:0 0 22px 0;color:#4a6cf7;font-size:15px;min-height:22px;text-align:center;max-width:80vw}
        #tw-password-input{padding:10px 16px;width:280px;border:1px solid #2a2f45;border-radius:6px;background:#161a2b;color:#fff;font-size:16px;outline:none}
        #tw-password-submit{margin-top:16px;padding:10px 32px;background:#4a6cf7;color:#fff;border:none;border-radius:6px;font-size:16px;cursor:pointer}
        #tw-password-submit:disabled{opacity:.6;cursor:default}
        #tw-password-error{margin-top:12px;color:#ff4d4d;font-size:13px;min-height:18px;text-align:center;max-width:80vw}
        #tw-password-progress{margin-top:6px;color:#666;font-size:12px;min-height:14px}
      </style>
      <h2>此作品已受密码保护</h2>
      <p class="sub">我加了作品锁你气不气</p>
      <p class="hint">请输入密码以继续编辑或查看</p>
      <p id="tw-password-slogan"></p>
      <input id="tw-password-input" type="password" placeholder="请输入密码" />
      <button id="tw-password-submit">解锁</button>
      <p id="tw-password-error"></p>
      <p id="tw-password-progress"></p>
    `;
    document.body.appendChild(host);
    overlayShadow = shadow;
    attachHostObserver(host);
    const input = shadow.getElementById("tw-password-input");
    const submit = shadow.getElementById("tw-password-submit");
    const errorEl = shadow.getElementById("tw-password-error");
    const sloganEl = shadow.getElementById("tw-password-slogan");
    const progressEl = shadow.getElementById("tw-password-progress");
    if (reason) {
      errorEl.textContent = "检测到篡改尝试（" + reason + "），已自动重新锁定";
    }
    if (slogans.length > 0) {
      globalSloganIndex = (globalSloganIndex + 1) % slogans.length;
      sloganEl.textContent = slogans[globalSloganIndex];
      sloganTimer = setInterval(() => {
        const cached = getSlogans();
        if (cached.length === 0) {
          sloganEl.textContent = "";
          return;
        }
        globalSloganIndex = (globalSloganIndex + 1) % cached.length;
        sloganEl.textContent = cached[globalSloganIndex];
      }, 3000);
    } else {
      sloganEl.style.display = "none";
    }
    let verifying = false;
    async function tryUnlock() {
      if (verifying) return;
      const entered = input.value;
      if (!entered) {
        errorEl.textContent = "请输入密码";
        return;
      }
      verifying = true;
      submit.disabled = true;
      input.disabled = true;
      errorEl.textContent = "";
      progressEl.textContent = "正在校验…";
      try {
        let storedHash = safeGet(PASSWORD_KEY);
        if (!storedHash) {
          const m = mirrorReadSync(PASSWORD_KEY);
          if (m) {
            safeSet(PASSWORD_KEY, m);
            storedHash = m;
          }
        }
        const ok = await verifyPassword(entered, storedHash);
        if (ok) {
          isUnlocked = true;
          lastTamperReason = "";
          stopSloganTimer();
          if (overlayShadow) overlayShadow = null;
          host.remove();
          if (hostObserver) {
            hostObserver.disconnect();
            hostObserver = null;
          }
          removeBlur();
          stopObserver();
          if (!storedHash.includes(":")) {
            const upgraded = await createPasswordRecord(entered);
            safeSet(PASSWORD_KEY, upgraded);
            mirrorWrite(PASSWORD_KEY, upgraded);
          }
          const s2 = safeGet(SALT2_KEY);
          if (s2) {
            try {
              unlockedEncKey = await deriveEncKey(entered, s2);
            } catch (e) {
              unlockedEncKey = null;
            }
          }
        } else {
          errorEl.textContent = "密码错误，请重试";
          input.value = "";
          input.focus();
          progressEl.textContent = "";
        }
      } catch (e) {
        errorEl.textContent = "校验出错：" + e.message;
        progressEl.textContent = "";
      } finally {
        verifying = false;
        submit.disabled = false;
        input.disabled = false;
      }
    }
    submit.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryUnlock();
    });
    setTimeout(() => input.focus(), 50);
    return host;
  }

  function removeOverlay() {
    const existing = document.getElementById(DOM_ID);
    if (existing) existing.remove();
    overlayShadow = null;
    if (hostObserver) {
      hostObserver.disconnect();
      hostObserver = null;
    }
  }

  function handleTamper(reason) {
    tamperCount += 1;
    lastTamperReason = reason;
    safeSet(GUARD_KEY, String(tamperCount));
    if (!hasPassword) return;
    isUnlocked = false;
    unlockedEncKey = null;
    stopSloganTimer();
    removeBlur();
    removeOverlay();
    applyBlur();
    createOverlay(reason);
    startObserver();
  }

  function installStorageGuard() {
    const SP = Storage.prototype;
    if (SP.setItem.__twpp) return;
    const oSet = SP.setItem;
    const oRem = SP.removeItem;
    const oClear = SP.clear;
    const oGet = SP.getItem;
    const guarded = (k) =>
      k === PASSWORD_KEY || k === GUARD_KEY || k === SALT2_KEY || k === ENC_FLAG_KEY;
    const newSet = function (k, v) {
      if (!internalWrite && guarded(k)) {
        let prev = null;
        try {
          prev = oGet.call(this, k);
        } catch (e) {}
        if (prev !== null && prev !== String(v)) {
          mirrorWrite(k, prev);
          handleTamper("setItem");
          return;
        }
      }
      return oSet.call(this, k, v);
    };
    newSet.__twpp = true;
    const newRem = function (k) {
      if (!internalWrite && guarded(k)) {
        let prev = null;
        try {
          prev = oGet.call(this, k);
        } catch (e) {}
        if (prev !== null || hasPassword) {
          if (prev !== null) mirrorWrite(k, prev);
          handleTamper("removeItem");
          return;
        }
      }
      return oRem.call(this, k);
    };
    newRem.__twpp = true;
    const newClear = function () {
      if (!internalWrite) {
        const saved = {};
        try {
          [PASSWORD_KEY, GUARD_KEY, SALT2_KEY, ENC_FLAG_KEY].forEach((kk) => {
            const v = oGet.call(this, kk);
            if (v !== null) {
              saved[kk] = v;
              mirrorWrite(kk, v);
            }
          });
        } catch (e) {}
        const had = Object.keys(saved).length > 0;
        const r = oClear.call(this);
        if (had) {
          Object.keys(saved).forEach((kk) => oSet.call(this, kk, saved[kk]));
          handleTamper("clear");
        }
        return r;
      }
      return oClear.call(this);
    };
    newClear.__twpp = true;
    SP.setItem = newSet;
    SP.removeItem = newRem;
    SP.clear = newClear;
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      if (!hasPassword || isUnlocked) return;
      if (!document.getElementById(DOM_ID)) {
        createOverlay(lastTamperReason);
        applyBlur();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    });
    if (!watchTimer) {
      watchTimer = setInterval(() => {
        if (!hasPassword || isUnlocked) return;
        if (!document.getElementById(DOM_ID)) createOverlay(lastTamperReason);
        else assertHostVisible();
        applyBlur();
        if (!Storage.prototype.setItem.__twpp || !Storage.prototype.removeItem.__twpp) {
          installStorageGuard();
          handleTamper("hook");
        }
      }, 200);
    }
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (watchTimer) {
      clearInterval(watchTimer);
      watchTimer = null;
    }
  }

  function detectDebugger() {
    if (!DEVTAB_LOCK) return;
    const t = performance.now();
    (function () {
      debugger;
    })();
    if (performance.now() - t > 150) {
      handleTamper("debugger");
    }
  }

  function startDebugGuard() {
    if (debugTimer) return;
    debugTimer = setInterval(() => {
      if (!hasPassword || isUnlocked) return;
      try {
        detectDebugger();
      } catch (e) {}
    }, 3000);
  }

  function isInEditor() {
    return !!(
      document.querySelector(".blocklySvg") ||
      document.querySelector(".blocklyToolboxDiv") ||
      document.querySelector('[class*="blockly"]') ||
      document.querySelector(".gui_editor") ||
      document.querySelector('[class*="gui_editor"]')
    );
  }

  async function init() {
    installStorageGuard();
    startDebugGuard();
    let storedHash = safeGet(PASSWORD_KEY);
    if (!storedHash) {
      const m = await mirrorReadFull(PASSWORD_KEY);
      if (m) {
        storedHash = m;
        safeSet(PASSWORD_KEY, m);
        tamperCount += 1;
        safeSet(GUARD_KEY, "1");
      }
    }
    contentLockEnabled = safeGet(ENC_FLAG_KEY) === "1";
    if (!storedHash) return;
    hasPassword = true;
    isUnlocked = false;
    if (isInEditor()) {
      applyBlur();
      createOverlay(lastTamperReason);
      setTimeout(applyBlur, 0);
      setTimeout(applyBlur, 300);
      setTimeout(applyBlur, 1000);
      startObserver();
    }
  }

  class PasswordProtection {
    getInfo() {
      return {
        id: "passwordprotect",
        name: "密码保护",
        color1: "#4a6cf7",
        color2: "#3a5ce7",
        color3: "#2a4cd7",
        blocks: [
          {
            opcode: "setPassword",
            blockType: Scratch.BlockType.COMMAND,
            text: "设置作品密码为 [PASSWORD]",
            arguments: {
              PASSWORD: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "123456",
              },
            },
          },
          {
            opcode: "addSlogan",
            blockType: Scratch.BlockType.COMMAND,
            text: "添加标语 [SLOGAN] 到轮播列表",
            arguments: {
              SLOGAN: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "别删了，删了也没用",
              },
            },
          },
          {
            opcode: "clearSlogans",
            blockType: Scratch.BlockType.COMMAND,
            text: "清空标语轮播列表",
          },
          {
            opcode: "getSloganCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "标语列表条数",
          },
          "---",
          {
            opcode: "setContentLock",
            blockType: Scratch.BlockType.COMMAND,
            text: "内容级加密锁 [ENABLED]",
            arguments: {
              ENABLED: {
                type: Scratch.ArgumentType.BOOLEAN,
                defaultValue: "false",
              },
            },
          },
          {
            opcode: "encryptText",
            blockType: Scratch.BlockType.REPORTER,
            text: "用密码加密文本 [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "秘密内容",
              },
            },
          },
          {
            opcode: "decryptText",
            blockType: Scratch.BlockType.REPORTER,
            text: "用密码解密 [DATA]",
            arguments: {
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "",
              },
            },
          },
          "---",
          {
            opcode: "hasPassword",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "作品已设置密码？",
            disableMonitor: true,
          },
          {
            opcode: "isUnlockedReporter",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "密码已验证通过？",
            disableMonitor: true,
          },
          {
            opcode: "getTamperCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "篡改尝试次数",
          },
          {
            opcode: "clearPassword",
            blockType: Scratch.BlockType.COMMAND,
            text: "清除作品密码",
          },
        ],
      };
    }

    async setPassword(args) {
      const password = String(args.PASSWORD);
      if (!password) return;
      const record = await createPasswordRecord(password);
      safeSet(PASSWORD_KEY, record);
      mirrorWrite(PASSWORD_KEY, record);
      if (!safeGet(SALT2_KEY)) {
        const s2 = generateSalt();
        safeSet(SALT2_KEY, s2);
        mirrorWrite(SALT2_KEY, s2);
      }
      safeSet(GUARD_KEY, String(tamperCount));
      hasPassword = true;
      isUnlocked = false;
    }

    addSlogan(args) {
      const slogan = String(args.SLOGAN);
      if (!slogan) return;
      const list = getSlogans();
      list.push(slogan);
      saveSlogans(list);
    }

    clearSlogans() {
      saveSlogans([]);
    }

    getSloganCount() {
      return getSlogans().length;
    }

    setContentLock(args) {
      const v = args.ENABLED === true || args.ENABLED === "true";
      contentLockEnabled = !!v;
      safeSet(ENC_FLAG_KEY, contentLockEnabled ? "1" : "0");
    }

    async encryptText(args) {
      if (!unlockedEncKey) return "";
      const text = String(args.TEXT);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, unlockedEncKey, new TextEncoder().encode(text))
      );
      const box = new Uint8Array(iv.length + ct.length);
      box.set(iv, 0);
      box.set(ct, iv.length);
      let s = "";
      for (let i = 0; i < box.length; i++) s += String.fromCharCode(box[i]);
      return "v1:" + btoa(s);
    }

    async decryptText(args) {
      if (!unlockedEncKey) return "";
      const data = String(args.DATA);
      if (!data.startsWith("v1:")) return "";
      try {
        const bin = atob(data.slice(3));
        const box = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) box[i] = bin.charCodeAt(i);
        const iv = box.slice(0, 12);
        const ct = box.slice(12);
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, unlockedEncKey, ct);
        return new TextDecoder().decode(pt);
      } catch (e) {
        return "";
      }
    }

    hasPassword() {
      hasPassword = !!safeGet(PASSWORD_KEY);
      return hasPassword;
    }

    isUnlockedReporter() {
      return isUnlocked;
    }

    getTamperCount() {
      return tamperCount;
    }

    clearPassword() {
      safeRemove(PASSWORD_KEY);
      safeRemove(GUARD_KEY);
      safeRemove(SALT2_KEY);
      try {
        sessionStorage.removeItem(mirrorName(PASSWORD_KEY));
        sessionStorage.removeItem(mirrorName(SALT2_KEY));
      } catch (e) {}
      try {
        document.cookie = mirrorName(PASSWORD_KEY) + "=;path=/;max-age=0";
        document.cookie = mirrorName(SALT2_KEY) + "=;path=/;max-age=0";
      } catch (e) {}
      hasPassword = false;
      isUnlocked = false;
      unlockedEncKey = null;
      stopObserver();
      stopSloganTimer();
      removeBlur();
      removeOverlay();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(() => init(), 300));
  } else {
    setTimeout(() => init(), 300);
  }

  Scratch.extensions.register(new PasswordProtection());
})(Scratch);
