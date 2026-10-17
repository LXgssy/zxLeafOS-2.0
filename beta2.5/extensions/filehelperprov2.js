(function (Scratch) {
  "use strict";

  class FileExtensionProV2 {
    constructor() {
      this.selectedFiles = [];
      this.singleFileInput = document.createElement('input');
      this.singleFileInput.type = 'file';
      this.singleFileInput.style.display = 'none';
      document.body.appendChild(this.singleFileInput);
      
      this.multipleFileInput = document.createElement('input');
      this.multipleFileInput.type = 'file';
      this.multipleFileInput.multiple = true;
      this.multipleFileInput.style.display = 'none';
      document.body.appendChild(this.multipleFileInput);
      
      // 设置文件选择监听器
      this.singleFileInput.addEventListener('change', e => {
        this.selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        this.singleFileInput.value = '';
      });
      
      this.multipleFileInput.addEventListener('change', e => {
        this.selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        this.multipleFileInput.value = '';
      });
    }

    getInfo() {
      return {
        id: 'filehelperprov2',
        name: '文件打开PRO V2',
        color1: '#dd4e00',
        color2: '#bb3d00',
        blocks: [
          {
            opcode: 'openSingleFile',
            blockType: Scratch.BlockType.COMMAND,
            text: '打开单个文件[FILETYPE]',
            arguments: {
              FILETYPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "*"
              }
            }
          },
          {
            opcode: 'openMultipleFiles',
            blockType: Scratch.BlockType.COMMAND,
            text: '打开多个文件[FILETYPE]',
            arguments: {
              FILETYPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "*"
              }
            }
          },
          "---",
          {
            opcode: 'getFileProperty',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开的第[INDEX]个文件的[PROPERTY]',
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1"
              },
              PROPERTY: {
                type: Scratch.ArgumentType.STRING,
                menu: 'propertyMenu'
              }
            }
          },
          {
            opcode: 'getFileContent',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开的第[INDEX]个文件作为[TYPE]',
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1"
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'contentTypeMenu'
              }
            }
          },
          {
            opcode: 'getFileCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '打开了多少个文件'
          },
          "---",
          {
            opcode: 'downloadText',
            blockType: Scratch.BlockType.COMMAND,
            text: '下载文本[CONTENT]名为[NAME]',
            arguments: {
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, World!"
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "example.txt"
              }
            }
          },
          {
            opcode: 'downloadDataURL',
            blockType: Scratch.BlockType.COMMAND,
            text: '下载DataURL[URL]名为[NAME]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data:text/plain;base64,SGVsbG8gV29ybGQh"
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "file.bin"
              }
            }
          }
        ],
        menus: {
          propertyMenu: {
            acceptReporters: true,
            items: [
              { text: '文件名称', value: 'name' },
              { text: '文件大小', value: 'size' },
              { text: 'DataURL', value: 'dataurl' },
              { text: '文件类型', value: 'type' },
              { text: '最后修改日期', value: 'lastModified' },
              { text: '创建日期', value: 'created' },
              { text: '时长(媒体文件)', value: 'duration' },
              { text: '分辨率(图片/视频)', value: 'dimensions' },
              { text: '(PPT/PPTX)', value: 'author' },
              { text: '幻灯片页数(PPT/PPTX)', value: 'slideCount' }
            ]
          },
          contentTypeMenu: {
            acceptReporters: true,
            items: [
              { text: '文本', value: 'text' },
              { text: 'DataURL', value: 'dataurl' }
            ]
          }
        }
      };
    }

    openSingleFile(args) {
      const fileType = Scratch.Cast.toString(args.FILETYPE);
      const accept = fileType === "*" ? "" : fileType.split(',').map(ext => `.${ext.trim()}`).join(',');
      
      return new Promise(resolve => {
        const checkSelection = () => {
          if (this.selectedFiles.length > 0) {
            resolve();
            return;
          }
          setTimeout(checkSelection, 100);
        };
        
        this.singleFileInput.accept = accept;
        this.selectedFiles = [];
        this.singleFileInput.click();
        checkSelection();
      });
    }

    openMultipleFiles(args) {
      const fileType = Scratch.Cast.toString(args.FILETYPE);
      const accept = fileType === "*" ? "" : fileType.split(',').map(ext => `.${ext.trim()}`).join(',');
      
      return new Promise(resolve => {
        const checkSelection = () => {
          if (this.selectedFiles.length > 0) {
            resolve();
            return;
          }
          setTimeout(checkSelection, 100);
        };
        
        this.multipleFileInput.accept = accept;
        this.selectedFiles = [];
        this.multipleFileInput.click();
        checkSelection();
      });
    }

    getFileProperty(args) {
      const index = Scratch.Cast.toNumber(args.INDEX) - 1;
      const property = Scratch.Cast.toString(args.PROPERTY);
      
      if (index < 0 || index >= this.selectedFiles.length) {
        return "";
      }
      
      const file = this.selectedFiles[index];
      
      switch (property) {
        case 'name':
          return file.name;
        case 'size':
          return (file.size / 1024 / 1024).toFixed(2) + " MB";
        case 'dataurl':
          return this._fileToDataURL(file);
        case 'type':
          return file.type || "未知";
        case 'lastModified':
          return new Date(file.lastModified).toLocaleString();
        case 'created':
          return new Date().toLocaleString();
        case 'duration':
          return this._getMediaDuration(file);
        case 'dimensions':
          return this._getMediaDimensions(file);
        case 'author':
          return this._getPPTAuthor(file);
        case 'slideCount':
          return this._getPPTSlideCount(file);
        default:
          return "";
      }
    }

    async getFileContent(args) {
      const index = Scratch.Cast.toNumber(args.INDEX) - 1;
      const type = Scratch.Cast.toString(args.TYPE);
      
      if (index < 0 || index >= this.selectedFiles.length) {
        return "";
      }
      
      const file = this.selectedFiles[index];
      
      if (type === 'text') {
        return await file.text();
      } else if (type === 'dataurl') {
        return await this._fileToDataURL(file);
      }
      return "";
    }

    getFileCount() {
      return this.selectedFiles.length;
    }

    downloadText(args) {
      const content = Scratch.Cast.toString(args.CONTENT);
      const name = Scratch.Cast.toString(args.NAME);
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      this._downloadBlob(blob, name);
    }

    downloadDataURL(args) {
      const dataURL = Scratch.Cast.toString(args.URL);
      const name = Scratch.Cast.toString(args.NAME);
      
      try {
        const blob = this._dataURLToBlob(dataURL);
        this._downloadBlob(blob, name);
      } catch (error) {
        console.error('下载DataURL失败:', error);
      }
    }

    // 辅助方法
    _fileToDataURL(file) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    _getMediaDuration(file) {
      return new Promise(resolve => {
        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
          resolve("不是媒体文件");
          return;
        }
        
        const url = URL.createObjectURL(file);
        const media = file.type.startsWith('audio/') ? new Audio() : document.createElement('video');
        
        media.onloadedmetadata = () => {
          const duration = media.duration;
          URL.revokeObjectURL(url);
          resolve(duration.toFixed(2) + " 秒");
        };
        
        media.onerror = () => {
          URL.revokeObjectURL(url);
          resolve("无法获取时长");
        };
        
        media.src = url;
      });
    }

    _getMediaDimensions(file) {
      return new Promise(resolve => {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          resolve("不是图片或视频");
          return;
        }
        
        const url = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img.width + " × " + img.height);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve("无法获取尺寸");
          };
          img.src = url;
        } else {
          const video = document.createElement('video');
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(video.videoWidth + " × " + video.videoHeight);
          };
          video.onerror = () => {
            URL.revokeObjectURL(url);
            resolve("无法获取尺寸");
          };
          video.src = url;
        }
      });
    }

    _getPPTAuthor(file) {
      // 简化实现 - 实际需要解析PPT文件
      if (file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx')) {
        return "需要专业解析库";
      }
      return "不是PPT文件";
    }

    _getPPTSlideCount(file) {
      // 简化实现 - 实际需要解析PPT文件
      if (file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx')) {
        return "需要专业解析库";
      }
      return "不是PPT文件";
    }

    _downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    _dataURLToBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      return new Blob([u8arr], { type: mime });
    }
  }

  // 为异步方法添加包装器
  const originalMethods = {
    getFileProperty: FileExtensionProV2.prototype.getFileProperty,
    getFileContent: FileExtensionProV2.prototype.getFileContent,
    _getMediaDuration: FileExtensionProV2.prototype._getMediaDuration,
    _getMediaDimensions: FileExtensionProV2.prototype._getMediaDimensions
  };

  // 包装异步方法
  FileExtensionProV2.prototype.getFileProperty = function(args) {
    const result = originalMethods.getFileProperty.call(this, args);
    if (result instanceof Promise) {
      return result.then(value => value).catch(() => "");
    }
    return result;
  };

  FileExtensionProV2.prototype.getFileContent = function(args) {
    const result = originalMethods.getFileContent.call(this, args);
    if (result instanceof Promise) {
      return result.then(value => value).catch(() => "");
    }
    return result;
  };

  Scratch.extensions.register(new FileExtensionProV2());
})(Scratch);