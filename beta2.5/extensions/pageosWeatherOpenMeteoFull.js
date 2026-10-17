(function (Scratch) {
  "use strict";

  /**
   * zxOS Weather — Open-Meteo 完整增强版
   * - 自动地理编码（Open-Meteo）-> fallback IP 定位 ipapi.co -> fallback ipwho.is
   * - Open-Meteo forecast: current_weather + hourly + daily（包含今天的 max/min / pressure / dewpoint / visibility）
   * - 无需 Token
   */

  const CACHE_EXPIRY = 3600000; // 1小时缓存
  const cache = {}; // key -> { data, timestamp, meta }

  class PageOSWeatherFull {
    constructor() {
      this.lastKey = "";
      this.lastRequestSuccess = false;
      this.lastRequestDuration = 0;
      this.lastRawData = "";
      this.lastUpdateISO = "";
      this.lastPing = { url: "", ok: false, duration: 0, code: null };
    }

    getInfo() {
      return {
        id: "pageosWeatherOpenMeteoFull",
        name: "zxOS 天气1.0",
        color1: "#0b81d6",
        color2: "#066fb2",
        color3: "#044c7a",
        unsandboxed: true,
        blocks: [
          // 请求
          {
            opcode: "fetchWeather",
            blockType: Scratch.BlockType.COMMAND,
            text: "获取城市 [CITY] 的天气（留空用 IP 定位）",
            arguments: { CITY: { type: Scratch.ArgumentType.STRING, defaultValue: "" } },
          },

          // 状态
          { opcode: "getRequestStatus", blockType: Scratch.BlockType.BOOLEAN, text: "上次天气请求是否成功？" },
          { opcode: "getRequestDuration", blockType: Scratch.BlockType.REPORTER, text: "上次天气请求耗时 (ms)" },
          { opcode: "getRawWeatherJson", blockType: Scratch.BlockType.REPORTER, text: "上次返回的天气 JSON 数据" },
          { opcode: "getDataUpdateTime", blockType: Scratch.BlockType.REPORTER, text: "天气数据更新时间（ISO）" },

          // 当前实时
          { opcode: "getCurrentTemperature", blockType: Scratch.BlockType.REPORTER, text: "当前温度 (°C)" },
          { opcode: "getCurrentWindSpeed", blockType: Scratch.BlockType.REPORTER, text: "当前风速 (km/h)" },
          { opcode: "getCurrentWindDir", blockType: Scratch.BlockType.REPORTER, text: "当前风向 (°)" },
          { opcode: "getCurrentWeatherCode", blockType: Scratch.BlockType.REPORTER, text: "当前天气代码 (WMO)" },
          { opcode: "getCurrentWeatherDesc", blockType: Scratch.BlockType.REPORTER, text: "当前天气描述" },

          // 今日指标（新增）
          { opcode: "getTodayMaxTemp", blockType: Scratch.BlockType.REPORTER, text: "今日最高温 (°C)" },
          { opcode: "getTodayMinTemp", blockType: Scratch.BlockType.REPORTER, text: "今日最低温 (°C)" },
          { opcode: "getTodayPressure", blockType: Scratch.BlockType.REPORTER, text: "今日平均气压 (hPa)" },
          { opcode: "getTodayDewpoint", blockType: Scratch.BlockType.REPORTER, text: "今日平均露点 (°C)" },
          { opcode: "getTodayVisibility", blockType: Scratch.BlockType.REPORTER, text: "今日平均能见度 (km)" },

          // 日出日落
          { opcode: "getSunrise", blockType: Scratch.BlockType.REPORTER, text: "今日日出时间" },
          { opcode: "getSunset", blockType: Scratch.BlockType.REPORTER, text: "今日日落时间" },

          // 小时/未来数据
          {
            opcode: "getTemperature",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的温度 (°C)",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },
          {
            opcode: "getRelativeHumidity",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的相对湿度 (%)",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },
          {
            opcode: "getPrecipitation",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的降水量 (mm)",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },
          {
            opcode: "getWeatherDescription",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的天气描述",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },

          // 分类与图标（emoji）
          {
            opcode: "getWeatherCategory",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的天气分类",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },
          {
            opcode: "getWeatherIcon",
            blockType: Scratch.BlockType.REPORTER,
            text: "[HOURS] 小时后的天气图标 (emoji)",
            arguments: { HOURS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } },
          },

          // 位置与元数据
          { opcode: "getLastLocationName", blockType: Scratch.BlockType.REPORTER, text: "最后查询的地点名称" },
          { opcode: "getLastCoords", blockType: Scratch.BlockType.REPORTER, text: "最后查询的经纬度" },

          // 任意 JSON 路径读取
          {
            opcode: "getJsonPath",
            blockType: Scratch.BlockType.REPORTER,
            text: "天气数据路径 [PATH] 的值",
            arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: "hourly.temperature_2m.0" } },
          },

          // 网站检测
          {
            opcode: "checkUrlResponsive",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "检查网址 [URL] 是否响应（超时 s: [TIMEOUT]）",
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: "https://api.open-meteo.com" },
              TIMEOUT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 6 },
            },
          },
          { opcode: "getLastPingDuration", blockType: Scratch.BlockType.REPORTER, text: "上次网站检测耗时 (ms)" },
          { opcode: "getLastPingUrl", blockType: Scratch.BlockType.REPORTER, text: "上次检测的网址" },
        ],
      };
    }

    // -----------------------
    // fetch with timeout helper
    // -----------------------
    _fetchWithTimeout(url, options = {}, timeoutSec = 8) {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = Math.max(1, Number(timeoutSec || 8)) * 1000;
      const start = performance.now();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          controller.abort();
          const dur = Math.floor(performance.now() - start);
          reject({ name: "TimeoutError", message: "请求超时", duration: dur });
        }, timeout);

        fetch(url, Object.assign({}, options, { signal }))
          .then((resp) => {
            clearTimeout(timer);
            const dur = Math.floor(performance.now() - start);
            resolve({ response: resp, duration: dur });
          })
          .catch((err) => {
            clearTimeout(timer);
            const dur = Math.floor(performance.now() - start);
            reject({ name: err.name || "FetchError", message: err.message || String(err), duration: dur });
          });
      });
    }

    // -----------------------
    // 主流程：获取天气
    // - 输入 city（可空）
    // - geocoding（Open-Meteo）-> fallback ipapi.co -> fallback ipwho.is
    // - 请求 Open-Meteo（包含 daily 指标：max/min temp、visibility_mean、dewpoint_2m_mean、surface_pressure_mean 等）
    // -----------------------
    fetchWeather(args, util) {
      const city = (args.CITY || "").trim();
      const startAll = performance.now();
      const that = this;

      return new Promise(async (resolve) => {
        try {
          const key = city || "__ip__";
          this.lastKey = key;

          // 缓存命中
          if (cache[key] && Date.now() - cache[key].timestamp < CACHE_EXPIRY) {
            that.lastRawData = JSON.stringify(cache[key].data, null, 2);
            that.lastRequestSuccess = true;
            that.lastRequestDuration = Math.floor(performance.now() - startAll);
            that.lastUpdateISO = cache[key].meta && cache[key].meta.updateISO ? cache[key].meta.updateISO : new Date().toISOString();
            resolve();
            return;
          }

          // geocode if city provided
          let lat = null, lon = null, locationName = "", country = "";

          if (city) {
            try {
              const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`;
              const g = await this._fetchWithTimeout(geoUrl, {}, 6);
              if (g.response.ok) {
                const geoJson = await g.response.json();
                if (geoJson && geoJson.results && geoJson.results.length > 0) {
                  const r = geoJson.results[0];
                  lat = Number(r.latitude);
                  lon = Number(r.longitude);
                  locationName = r.name || city;
                  country = r.country || "";
                }
              }
            } catch (e) {
              console.warn("Open-Meteo geocoding 错误，尝试 IP 定位：", e && e.message ? e.message : e);
            }
          }

          // if no coords yet -> IP定位优先 ipapi.co/json
          if (lat === null || lon === null) {
            try {
              const ipapi = await this._fetchWithTimeout("https://ipapi.co/json/", {}, 6);
              if (ipapi.response.ok) {
                const ipjson = await ipapi.response.json();
                if (ipjson && (ipjson.latitude || ipjson.latitude === 0)) {
                  lat = Number(ipjson.latitude);
                  lon = Number(ipjson.longitude);
                  locationName = ipjson.city || ipjson.region || ipjson.country_name || "";
                  country = ipjson.country || ipjson.country_name || "";
                }
              }
            } catch (e) {
              console.warn("ipapi.co 定位失败，尝试 ipwho.is：", e && e.message ? e.message : e);
            }
          }

          // fallback ipwho.is
          if (lat === null || lon === null) {
            try {
              const ipwho = await this._fetchWithTimeout("https://ipwho.is/", {}, 6);
              if (ipwho.response.ok) {
                const ipjson = await ipwho.response.json();
                if (ipjson && ipjson.success !== false && (ipjson.latitude || ipjson.latitude === 0)) {
                  lat = Number(ipjson.latitude);
                  lon = Number(ipjson.longitude);
                  locationName = ipjson.city || ipjson.region || ipjson.country || "";
                  country = ipjson.country || "";
                }
              }
            } catch (e) {
              console.warn("ipwho.is 定位也失败：", e && e.message ? e.message : e);
            }
          }

          // still not coords -> fail
          if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) {
            that.lastRequestSuccess = false;
            that.lastRequestDuration = Math.floor(performance.now() - startAll);
            that.lastRawData = "";
            that.lastUpdateISO = "";
            console.error("无法确定经纬度，天气请求失败。");
            resolve();
            return;
          }

          // build forecast URL with rich daily variables
          const hourlyVars = [
            "temperature_2m",
            "apparent_temperature",
            "relativehumidity_2m",
            "dewpoint_2m",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "weathercode",
            "surface_pressure",
            "visibility",
            "windspeed_10m",
            "winddirection_10m",
            "windgusts_10m",
            "cloudcover",
            "shortwave_radiation"
          ].join(",");

          const dailyVars = [
            "weathercode",
            "sunrise",
            "sunset",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "visibility_mean",
            "dewpoint_2m_mean",
            "surface_pressure_mean"
          ].join(",");

          const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=${encodeURIComponent(hourlyVars)}&daily=${encodeURIComponent(dailyVars)}&timezone=auto`;

          try {
            const f = await this._fetchWithTimeout(forecastUrl, {}, 12);
            if (!f.response.ok) throw new Error("Open-Meteo 返回非 2xx: " + f.response.status);
            const forecastJson = await f.response.json();

            // store cache
            cache[key] = {
              data: forecastJson,
              timestamp: Date.now(),
              meta: { lat: lat, lon: lon, locationName: locationName, country: country, updateISO: new Date().toISOString() }
            };

            that.lastRawData = JSON.stringify(forecastJson, null, 2);
            that.lastRequestSuccess = true;
            that.lastRequestDuration = f.duration;
            that.lastUpdateISO = cache[key].meta.updateISO;
            that.lastKey = key;

            resolve();
            return;
          } catch (e) {
            console.error("请求 Open-Meteo 失败：", e && e.message ? e.message : e);
            that.lastRequestSuccess = false;
            that.lastRequestDuration = Math.floor(performance.now() - startAll);
            that.lastRawData = "";
            that.lastUpdateISO = "";
            resolve();
            return;
          }
        } catch (err) {
          console.error("fetchWeather 未处理异常：", err);
          that.lastRequestSuccess = false;
          that.lastRequestDuration = Math.floor(performance.now() - startAll);
          that.lastRawData = "";
          that.lastUpdateISO = "";
          resolve();
        }
      });
    }

    // -----------------------
    // 状态与原始数据
    // -----------------------
    getRequestStatus() { return !!this.lastRequestSuccess; }
    getRequestDuration() { return Math.floor(this.lastRequestDuration || 0); }
    getRawWeatherJson() { return this.lastRawData || ""; }
    getDataUpdateTime() { return this.lastUpdateISO || ""; }

    // -----------------------
    // cache helper
    // -----------------------
    _getCache(keyOrCity) {
      const key = keyOrCity || this.lastKey || "__ip__";
      return cache[key] || null;
    }

    // get nearest hourly entry for hours offset
    _getHourlyForHours(hours) {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data || !cached.data.hourly || !Array.isArray(cached.data.hourly.time)) return null;
      const hoursArr = cached.data.hourly.time;
      const now = new Date();
      const target = new Date(now.getTime() + Number(hours || 0) * 3600 * 1000);
      const targetDate = target.toISOString().slice(0, 10);
      const targetHour = target.getHours();

      // iterate to find same date & hour (using timezone=auto returned times)
      for (let i = 0; i < hoursArr.length; i++) {
        const t = hoursArr[i];
        if (!t) continue;
        try {
          const localD = new Date(t);
          if (localD.toISOString().slice(0, 10) === targetDate && localD.getHours() === targetHour) {
            const out = {};
            for (const k in cached.data.hourly) {
              if (Array.isArray(cached.data.hourly[k])) out[k] = cached.data.hourly[k][i];
            }
            out.time = t;
            return out;
          }
        } catch (e) {}
      }

      // fallback nearest
      let bestIdx = 0, bestDiff = Infinity;
      const targetMs = target.getTime();
      for (let i = 0; i < hoursArr.length; i++) {
        const tms = new Date(hoursArr[i]).getTime();
        const diff = Math.abs(tms - targetMs);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      }
      const out = {};
      for (const k in cached.data.hourly) {
        if (Array.isArray(cached.data.hourly[k])) out[k] = cached.data.hourly[k][bestIdx];
      }
      out.time = hoursArr[bestIdx];
      return out;
    }

    // -----------------------
    // current / hourly / daily getters
    // -----------------------
    _getCurrent() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data) return null;
      return cached.data.current_weather || null;
    }
    getCurrentTemperature() {
      const cur = this._getCurrent();
      return cur ? Number(cur.temperature || 0) : 0;
    }
    getCurrentWindSpeed() {
      const cur = this._getCurrent();
      return cur ? Number(cur.windspeed || 0) : 0;
    }
    getCurrentWindDir() {
      const cur = this._getCurrent();
      return cur ? Number(cur.winddirection || 0) : 0;
    }
    getCurrentWeatherCode() {
      const cur = this._getCurrent();
      return cur && cur.weathercode !== undefined ? String(cur.weathercode) : "";
    }
    getCurrentWeatherDesc() {
      const code = this.getCurrentWeatherCode();
      return code === "" ? "" : this._weatherCodeToDesc(Number(code));
    }

    // today daily getters (new)
    _getTodayIndexInDaily() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data || !cached.data.daily || !Array.isArray(cached.data.daily.time)) return -1;
      const ds = cached.data.daily.time; // dates as strings YYYY-MM-DD
      const today = new Date().toISOString().slice(0, 10);
      for (let i = 0; i < ds.length; i++) {
        if (ds[i].slice(0, 10) === today) return i;
      }
      return 0; // fallback first day
    }
    getTodayMaxTemp() {
      const cached = this._getCache(this.lastKey);
      const idx = this._getTodayIndexInDaily();
      if (!cached || !cached.data || idx < 0) return 0;
      if (cached.data.daily && Array.isArray(cached.data.daily.temperature_2m_max)) {
        return Number(cached.data.daily.temperature_2m_max[idx] || 0);
      }
      return 0;
    }
    getTodayMinTemp() {
      const cached = this._getCache(this.lastKey);
      const idx = this._getTodayIndexInDaily();
      if (!cached || !cached.data || idx < 0) return 0;
      if (cached.data.daily && Array.isArray(cached.data.daily.temperature_2m_min)) {
        return Number(cached.data.daily.temperature_2m_min[idx] || 0);
      }
      return 0;
    }
    getTodayPressure() {
      const cached = this._getCache(this.lastKey);
      const idx = this._getTodayIndexInDaily();
      if (!cached || !cached.data || idx < 0) return 0;
      if (cached.data.daily && Array.isArray(cached.data.daily.surface_pressure_mean)) {
        return Number(cached.data.daily.surface_pressure_mean[idx] || 0);
      }
      // fallback: try to use current (surface pressure may be in hourly.surface_pressure)
      const curHourly = this._getHourlyForHours(0);
      if (curHourly && curHourly.surface_pressure !== undefined) return Number(curHourly.surface_pressure);
      return 0;
    }
    getTodayDewpoint() {
      const cached = this._getCache(this.lastKey);
      const idx = this._getTodayIndexInDaily();
      if (!cached || !cached.data || idx < 0) return 0;
      if (cached.data.daily && Array.isArray(cached.data.daily.dewpoint_2m_mean)) {
        return Number(cached.data.daily.dewpoint_2m_mean[idx] || 0);
      }
      // fallback hourly dewpoint at current hour
      const cur = this._getHourlyForHours(0);
      if (cur && cur.dewpoint_2m !== undefined) return Number(cur.dewpoint_2m);
      return 0;
    }
    getTodayVisibility() {
      const cached = this._getCache(this.lastKey);
      const idx = this._getTodayIndexInDaily();
      if (!cached || !cached.data || idx < 0) return 0;
      if (cached.data.daily && Array.isArray(cached.data.daily.visibility_mean)) {
        return Number(cached.data.daily.visibility_mean[idx] || 0);
      }
      // fallback hourly visibility
      const cur = this._getHourlyForHours(0);
      if (cur && cur.visibility !== undefined) return Number(cur.visibility);
      return 0;
    }

    // sunrise / sunset
    getSunrise() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data || !cached.data.daily) return "";
      return (cached.data.daily.sunrise && cached.data.daily.sunrise[0]) || "";
    }
    getSunset() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data || !cached.data.daily) return "";
      return (cached.data.daily.sunset && cached.data.daily.sunset[0]) || "";
    }

    // hourly getters
    getTemperature(args) {
      const hd = this._getHourlyForHours(args.HOURS);
      return hd && hd.temperature_2m !== undefined ? Number(hd.temperature_2m) : 0;
    }
    getRelativeHumidity(args) {
      const hd = this._getHourlyForHours(args.HOURS);
      return hd && hd.relativehumidity_2m !== undefined ? Number(hd.relativehumidity_2m) : 0;
    }
    getPrecipitation(args) {
      const hd = this._getHourlyForHours(args.HOURS);
      return hd && hd.precipitation !== undefined ? Number(hd.precipitation) : 0;
    }
    getWeatherDescription(args) {
      const hd = this._getHourlyForHours(args.HOURS);
      if (!hd) return "";
      const wc = hd.weathercode !== undefined ? Number(hd.weathercode) : null;
      if (wc === null) return "";
      return this._weatherCodeToDesc(wc);
    }

    // weather code mapping
    _weatherCodeToDesc(code) {
      const map = {
        0: "晴朗",1:"主要晴朗",2:"部分多云",3:"多云",
        45:"雾/薄雾",48:"霜雾",
        51:"小雨（微弱）",53:"小雨（适中）",55:"小雨（稠密）",
        56:"冻雨（轻）",57:"冻雨（强）",
        61:"降水（弱）",63:"降水（中）",65:"降水（强）",
        66:"冻降水（轻）",67:"冻降水（强）",
        71:"小雪（轻）",73:"小雪（中）",75:"小雪（强）",
        77:"降雪（碎屑）",
        80:"阵雨（弱）",81:"阵雨（中）",82:"阵雨（强）",
        85:"阵雪（轻）",86:"阵雪（强）",
        95:"雷暴（含雨）",96:"含冰雹的雷暴（轻）",99:"含冰雹的雷暴（强）"
      };
      return map[code] || ("代码 " + String(code));
    }
    _weatherCodeToCategory(code) {
      if (code === 0 || code === 1 || code === 2 || code === 3) return "晴/多云";
      if (code >= 45 && code <= 48) return "雾";
      if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "雨";
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "雪";
      if (code >= 95 && code <= 99) return "雷暴";
      return "其他";
    }
    _weatherCategoryToEmoji(cat) {
      const map = { "晴/多云":"⛅", "雾":"🌫️", "雨":"🌧️", "雪":"❄️", "雷暴":"⛈️", "其他":"🌥️" };
      return map[cat] || "❓";
    }
    getWeatherCategory(args) {
      const hd = this._getHourlyForHours(args.HOURS);
      if (hd && hd.weathercode !== undefined) return this._weatherCodeToCategory(Number(hd.weathercode));
      const desc = this.getWeatherDescription(args);
      if (!desc) return "未知";
      const d = desc.toLowerCase();
      if (d.includes("雨") || d.includes("rain")) return "雨";
      if (d.includes("雪") || d.includes("snow")) return "雪";
      if (d.includes("雷") || d.includes("thunder")) return "雷暴";
      if (d.includes("雾") || d.includes("fog")) return "雾";
      return "晴/多云";
    }
    getWeatherIcon(args) {
      const cat = this.getWeatherCategory(args);
      return this._weatherCategoryToEmoji(cat);
    }

    // location meta
    getLastLocationName() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.meta) return "";
      return cached.meta.locationName || `${cached.meta.lat || ""},${cached.meta.lon || ""}`;
    }
    getLastCoords() {
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.meta) return "";
      return `${cached.meta.lat || ""},${cached.meta.lon || ""}`;
    }

    // 任意 JSON 路径读取
    getJsonPath(args) {
      const path = (args.PATH || "").trim();
      if (!path) return "";
      const cached = this._getCache(this.lastKey);
      if (!cached || !cached.data) return "";
      const parts = path.split(".");
      let cur = cached.data;
      for (let p of parts) {
        if (cur === undefined || cur === null) return "";
        if (/^\d+$/.test(p)) {
          const idx = parseInt(p, 10);
          if (!Array.isArray(cur) || idx >= cur.length) return "";
          cur = cur[idx];
        } else {
          cur = cur[p];
        }
      }
      if (typeof cur === "object") {
        try { return JSON.stringify(cur); } catch (e) { return String(cur); }
      }
      return String(cur);
    }

    // 网站检测
    checkUrlResponsive(args) {
      const url = (args.URL || "").trim();
      const timeout = Math.max(1, Number(args.TIMEOUT || 6));
      if (!url) {
        this.lastPing = { url: "", ok: false, duration: 0, code: null };
        return false;
      }
      const that = this;
      return new Promise((resolve) => {
        this._fetchWithTimeout(url, { method: "HEAD" }, timeout)
          .then((resObj) => {
            const ok = !!(resObj.response && (resObj.response.ok || (resObj.response.status >= 200 && resObj.response.status < 400)));
            that.lastPing = { url: url, ok: ok, duration: resObj.duration, code: resObj.response.status };
            resolve(ok);
          })
          .catch((err) => {
            // try GET once if HEAD fails
            that._fetchWithTimeout(url, { method: "GET" }, Math.min(timeout, 4))
              .then((r2) => {
                const ok2 = !!(r2.response && (r2.response.ok || (r2.response.status >= 200 && r2.response.status < 400)));
                that.lastPing = { url: url, ok: ok2, duration: r2.duration, code: r2.response.status };
                resolve(ok2);
              })
              .catch((err2) => {
                that.lastPing = { url: url, ok: false, duration: err && err.duration ? err.duration : 0, code: null };
                resolve(false);
              });
          });
      });
    }
    getLastPingDuration() { return Math.floor(this.lastPing.duration || 0); }
    getLastPingUrl() { return this.lastPing.url || ""; }
  }

  Scratch.extensions.register(new PageOSWeatherFull());
})(Scratch);
