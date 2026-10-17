(function (Scratch) {
  "use strict";

  const cast = Scratch.Cast;

  function label(text) {
    return { blockType: Scratch.BlockType.LABEL, text: text };
  }

  class IndexedDB {
    constructor() {
      this.dbName = "scratchDB";
      this.dbVersion = 1;
      this.db;
      this.initialised = false;
    }

    getInfo() {
      return {
        id: 'mistiumindexeddb',
        name: 'Indexed DB',
        color1: '#C65B5B',
        blocks: [
          {
            opcode: 'setDBName',
            blockType: Scratch.BlockType.COMMAND,
            text: '设置数据库名称为 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "scratchDB"
              }
            }
          },
          {
            opcode: 'writeToDatabase',
            blockType: Scratch.BlockType.COMMAND,
            text: '设置键 [KEY] 的值为 [VALUE]',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "value"
              },
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data"
              }
            }
          },
          {
            opcode: 'deleteFromDatabase',
            blockType: Scratch.BlockType.COMMAND,
            text: '从数据库中删除键为 [KEY] 的值',
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data"
              }
            }
          },
          {
            opcode: 'readFromDatabase',
            blockType: Scratch.BlockType.REPORTER,
            text: '读取键 [KEY] 的值',
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data"
              }
            }
          },
          {
            opcode: 'keyExists',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '键 [KEY] 存在于数据库中？',
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data"
              }
            }
          },
          label('数据库信息'),
          {
            opcode: 'isinitialised',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '数据库已初始化？',
          },
          {
            opcode: 'getDatabaseSize',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取数据库大小（字节）',
            disableMonitor: true
          },
          {
            opcode: 'getDatabaseSizeMB',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取数据库大小（MB）',
            disableMonitor: true
          },
          {
            opcode: 'getKeySize',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取键 [KEY] 的大小',
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data"
              }
            }
          },
          {
            opcode: 'getAllKeys',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取数据库中的所有键',
            disableMonitor: true
          },
          label('数据管理'),
          {
            opcode: 'clearAllData',
            blockType: Scratch.BlockType.COMMAND,
            text: '清除当前数据库所有数据'
          },
          {
            opcode: 'deleteDatabase',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除名称为 [DBNAME] 的数据库',
            arguments: {
              DBNAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "scratchDB"
              }
            }
          },
          label('导出和导入'),
          {
            opcode: 'exportDatabaseAsJSON',
            blockType: Scratch.BlockType.REPORTER,
            text: '将数据库导出为JSON',
            disableMonitor: true
          },
          {
            opcode: 'importJSONToDatabase',
            blockType: Scratch.BlockType.COMMAND,
            text: '将 [jsonData] 导入数据库',
            arguments: {
              jsonData: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "{}"
              }
            }
          }
        ]
      };
    }

    setDBName({ NAME }) {
      this.dbName = cast.toString(NAME);
      this.initializeDatabase();
    }

    initializeDatabase() {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = function (event) {
        console.error("IndexedDB 错误:", event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialised = true;
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        const objectStore = this.db.createObjectStore("data", {
          keyPath: "key"
        });
      };
    }

    isinitialised() {
      return this.initialised;
    }

    writeToDatabase({ VALUE, KEY }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return;
      }
      const transaction = this.db.transaction(["data"], "readwrite");
      const objectStore = transaction.objectStore("data");
      objectStore.put({
        key: cast.toString(KEY),
        value: cast.toString(VALUE)
      });
    }

    async readFromDatabase({ KEY }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "";
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.get(cast.toString(KEY));
        request.onsuccess = function (event) {
          resolve(event.target.result ? event.target.result.value : "");
        };
        request.onerror = function (event) {
          reject("从数据库读取时出错");
        };
      });
    }

    async getAllKeys() {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "[]";
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.getAllKeys();
        request.onsuccess = function (event) {
          const keysArray = event.target.result;
          const keysJSON = JSON.stringify(keysArray);
          resolve(keysJSON);
        };
        request.onerror = function (event) {
          reject("从数据库获取键时出错");
        };
      });
    }

    async keyExists({ KEY }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return false;
      }
      const keys = await this.getAllKeys();
      const keysArray = JSON.parse(keys);
      return keysArray.includes(cast.toString(KEY));
    }

    deleteFromDatabase({ KEY }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return;
      }
      const transaction = this.db.transaction(["data"], "readwrite");
      const objectStore = transaction.objectStore("data");
      try {
        objectStore.delete(cast.toString(KEY));
      } catch (error) {
        console.error("从数据库删除键时出错");
      }
    }

    clearAllData() {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return;
      }
      const transaction = this.db.transaction(["data"], "readwrite");
      const objectStore = transaction.objectStore("data");
      const request = objectStore.clear();
      
      request.onsuccess = function () {
      };
      
      request.onerror = function (event) {
        console.error("清除数据时出错:", event.target.error);
      };
    }

    deleteDatabase({ DBNAME }) {
      const dbNameToDelete = cast.toString(DBNAME);
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase(dbNameToDelete);
        
        request.onsuccess = function () {
          if (dbNameToDelete === this.dbName) {
            this.initialised = false;
            this.db = null;
          }
          resolve();
        }.bind(this);
        
        request.onerror = function (event) {
          reject("删除数据库时出错");
        };
        
        request.onblocked = function () {
          reject("数据库被其他连接阻塞，无法删除");
        };
      });
    }

    async exportDatabaseAsJSON() {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "{}";
      }
      if (!this.db) {
        return Promise.reject("无数据库连接可用");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
          const data = event.target.result;
          try {
            const formattedData = {};
            data.forEach(entry => {
              formattedData[entry.key] = entry.value;
            });
            const jsonData = JSON.stringify(formattedData);
            resolve(jsonData);
          } catch (error) {
            reject("将数据转换为JSON时出错");
          }
        };

        request.onerror = function (event) {
          reject("将数据库导出为JSON时出错");
        };
      });
    }

    async importJSONToDatabase({ jsonData }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return;
      }
      if (!this.db) {
        return Promise.reject("无数据库连接可用");
      }

      return new Promise((resolve, reject) => {
        try {
          const data = JSON.parse(cast.toString(jsonData));
          const transaction = this.db.transaction(["data"], "readwrite");
          const objectStore = transaction.objectStore("data");

          Object.keys(data).forEach(key => {
            objectStore.put({ key: key, value: data[key] });
          });

          transaction.oncomplete = function () {
            resolve("数据导入成功");
          };

          transaction.onerror = function (event) {
            reject("将数据导入数据库时出错");
          };
        } catch (error) {
          reject("解析JSON数据时出错");
        }
      });
    }

    async getDatabaseSize() {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "0";
      }
      if (!this.db) {
        return Promise.reject("无数据库连接可用");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
          const data = event.target.result;
          try {
            const totalSize = data.reduce((acc, entry) => acc + entry.key.length + entry.value.length, 0);
            resolve(totalSize.toString());
          } catch (error) {
            reject("计算数据库大小时出错");
          }
        };

        request.onerror = function (event) {
          reject("获取数据库大小时出错");
        };
      });
    }

    async getDatabaseSizeMB() {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "0";
      }
      if (!this.db) {
        return Promise.reject("无数据库连接可用");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
          const data = event.target.result;
          try {
            const totalSize = data.reduce((acc, entry) => acc + entry.key.length + entry.value.length, 0);
            const sizeInMB = totalSize / (1024 * 1024);
            resolve(sizeInMB.toFixed(4));
          } catch (error) {
            reject("计算数据库大小时出错");
          }
        };

        request.onerror = function (event) {
          reject("获取数据库大小时出错");
        };
      });
    }

    async getKeySize({ KEY }) {
      if (!this.initialised) {
        console.error("数据库未初始化");
        return "0";
      }
      if (!this.db) {
        return Promise.reject("无数据库连接可用");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["data"], "readonly");
        const objectStore = transaction.objectStore("data");
        const request = objectStore.get(cast.toString(KEY));

        request.onsuccess = function (event) {
          const entry = event.target.result;
          if (entry) {
            resolve((entry.key.length + entry.value.length).toString());
          } else {
            resolve("0");
          }
        };

        request.onerror = function (event) {
          reject("获取键大小时出错");
        };
      });
    }
  }

  Scratch.extensions.register(new IndexedDB());
})(Scratch);