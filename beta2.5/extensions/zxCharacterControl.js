(function (Scratch) {
  'use strict';

  class ZxCharacterControl {
    constructor() {
      this.JSZip = null;
      this.loadJSZip();
      this.zipFiles = [];
    }

    loadJSZip() {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(script);
      script.onload = () => {
        this.JSZip = window.JSZip;
      };
    }

    getInfo() {
      return {
        id: 'zxCharacterControl',
        name: 'zx的角色管理',
        color1: '#808080',
        color2: '#666666',
        color3: '#4d4d4d',
        blocks: [
          {
            blockType: 'label',
            text: '角色控制',
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
            opcode: 'loadZipAndImportSprites',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL或dataURL [DATA] 加载ZIP文件并导入全部角色',
            arguments: {
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data:application/zip;base64,...'
              }
            }
          },
          {
            opcode: 'duplicateCurrentSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: '复制当前角色并命名为 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite Clone'
              }
            }
          },
          {
            opcode: 'getSpriteCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '获取当前作品角色数量'
          },
          {
            opcode: 'spriteExists',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '检查是否存在名为 [NAME] 的角色',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'exportSpecificSprite',
            blockType: Scratch.BlockType.REPORTER,
            text: '导出指定角色 [SPRITE] 为 .sprite3 文件',
            arguments: {
              SPRITE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteList'
              }
            }
          },
          {
            opcode: 'exportAllSprites',
            blockType: Scratch.BlockType.COMMAND,
            text: '下载全部角色为ZIP文件'
          },
          {
            opcode: 'createBlankSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建一个空白角色并命名为 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'New Sprite'
              }
            }
          },
          
          '---',
          
          {
            blockType: 'label',
            text: '角色删除',
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
                defaultValue: 'temp'
              }
            }
          },
          
          '---',
          
          {
            blockType: 'label',
            text: '角色重命名',
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
          },
          
          '---',
          
          {
            blockType: 'label',
            text: '角色造型声音',
          },
          {
            opcode: 'addCostumeFromUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL [URL] 加载造型命名为 [NAME] 到角色 [TARGET]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/costume.png'
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1'
              },
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'addSoundFromUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从URL [URL] 加载声音命名为 [NAME] 到角色 [TARGET]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/sound.mp3'
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1'
              },
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
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
            opcode: 'deleteCostumesContaining',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除当前角色名字包含 [CONTAINS] 的造型',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'deleteSoundsContaining',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除当前角色名字包含 [CONTAINS] 的声音',
            arguments: {
              CONTAINS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'exportCostumeDataURL',
            blockType: Scratch.BlockType.REPORTER,
            text: '导出当前角色名字为 [NAME] 的纹理为dataURL',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1'
              }
            }
          },
          {
            opcode: 'exportSoundDataURL',
            blockType: Scratch.BlockType.REPORTER,
            text: '导出当前角色名字为 [NAME] 的声音为dataURL',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1'
              }
            }
          },
          
          '---',
          
          {
            blockType: 'label',
            text: 'ZIP文件处理',
          },
          {
            opcode: 'loadZipFromDataURL',
            blockType: Scratch.BlockType.COMMAND,
            text: '从 [DATA] dataURL上传zip并且读取',
            arguments: {
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data:application/zip;base64,...'
              }
            }
          },
          {
            opcode: 'getZipFileCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '上传的zip有多少个文件？'
          },
          {
            opcode: 'getZipFileInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: '上传的zip的第 [INDEX] 个文件的 [INFO]',
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'zipInfoTypes'
              }
            }
          },
          
          '---',
          
          {
            blockType: 'label',
            text: '角色信息',
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
          }
        ],
        menus: {
          spriteList: {
            acceptReporters: true,
            items: '_getSpriteList'
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
          },
          zipInfoTypes: {
            items: [
              { text: 'dataURL', value: 'dataurl' },
              { text: '文本(utf-8)', value: 'text' },
              { text: '创建日期', value: 'date' },
              { text: '修改日期', value: 'modDate' },
              { text: '文件名', value: 'name' },
              { text: '文件类型', value: 'type' },
              { text: '文件大小(MB)', value: 'size' }
            ]
          }
        }
      };
    }

    _getSpriteList() {
      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          spriteNames.push(target.sprite.name);
        }
      }
      if (spriteNames.length > 0) {
        return spriteNames;
      } else {
        return ["无角色"];
      }
    }

    async addSpriteFromUrl(args) {
      try {
        const response = await Scratch.fetch(args.URL);
        const arrayBuffer = await response.arrayBuffer();
        await Scratch.vm.addSprite(arrayBuffer);
      } catch (e) {
        console.error('Error adding sprite:', e);
      }
    }

    async loadZipAndImportSprites(args) {
      if (!this.JSZip) {
        console.error('JSZip library not loaded');
        return;
      }
      
      try {
        let data = args.DATA;
        
        if (data.startsWith('data:')) {
          const base64Data = data.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          data = bytes.buffer;
        }
        
        const zip = await this.JSZip.loadAsync(data);
        
        const spriteFiles = [];
        for (const fileName in zip.files) {
          if (fileName.endsWith('.sprite3')) {
            spriteFiles.push(fileName);
          }
        }
        
        for (const fileName of spriteFiles) {
          const fileContent = await zip.file(fileName).async('arraybuffer');
          await Scratch.vm.addSprite(fileContent);
        }
      } catch (e) {
        console.error('Error loading ZIP and importing sprites:', e);
      }
    }

    duplicateCurrentSprite(args) {
      const currentTarget = Scratch.vm.editingTarget;
      if (!currentTarget || currentTarget.isStage) return;
      
      try {
        Scratch.vm.exportSprite(currentTarget.id).then(blob => {
          const reader = new FileReader();
          reader.onload = async () => {
            const arrayBuffer = reader.result;
            
            const newSpriteJson = JSON.parse(new TextDecoder().decode(arrayBuffer));
            newSpriteJson.name = args.NAME;
            
            const newArrayBuffer = new TextEncoder().encode(JSON.stringify(newSpriteJson));
            
            await Scratch.vm.addSprite(newArrayBuffer);
          };
          reader.readAsArrayBuffer(blob);
        });
      } catch (e) {
        console.error('Error duplicating sprite:', e);
      }
    }

    getSpriteCount() {
      let count = 0;
      const targets = Scratch.vm.runtime.targets;
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          count++;
        }
      }
      return count;
    }

    spriteExists(args) {
      const targets = Scratch.vm.runtime.targets;
      for (const target of targets) {
        if (target.isOriginal && !target.isStage && target.sprite.name === args.NAME) {
          return true;
        }
      }
      return false;
    }

    async exportSpecificSprite(args) {
      const target = Scratch.vm.runtime.getSpriteTargetByName(args.SPRITE);
      if (!target) return '';
      
      try {
        const blob = await Scratch.vm.exportSprite(target.id);
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Error exporting sprite:', e);
        return '';
      }
    }

    async exportAllSprites() {
      if (!this.JSZip) {
        console.error('JSZip library not loaded');
        return;
      }
      
      const zip = new this.JSZip();
      const targets = Scratch.vm.runtime.targets;
      
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          try {
            const blob = await Scratch.vm.exportSprite(target.id);
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(`${target.sprite.name}.sprite3`, arrayBuffer);
          } catch (e) {
            console.error('Error exporting sprite:', e);
          }
        }
      }
      
      const content = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(content);
      const element = document.createElement('a');
      element.setAttribute('href', url);
      element.setAttribute('download', 'all_sprites.zip');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }

    createBlankSprite(args) {
      const blankSprite = {
        name: args.NAME,
        isStage: false,
        variables: [],
        lists: [],
        broadcasts: [],
        blocks: {},
        currentCostume: 0,
        costumes: [{
          name: "costume1",
          bitmapResolution: 1,
          rotationCenterX: 0,
          rotationCenterY: 0,
          assetId: "0",
          md5ext: "0.png",
          dataFormat: "png"
        }],
        sounds: [],
        volume: 100,
        layerOrder: 0,
        visible: true,
        x: 0,
        y: 0,
        size: 100,
        direction: 90,
        draggable: false,
        rotationStyle: "all around"
      };
      
      const spriteBuffer = new TextEncoder().encode(JSON.stringify(blankSprite));
      
      Scratch.vm.addSprite(spriteBuffer).catch(e => {
        console.error('Error creating blank sprite:', e);
      });
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

    async addCostumeFromUrl(args) {
      try {
        const target = Scratch.vm.runtime.getSpriteTargetByName(args.TARGET);
        if (!target) {
          console.error(`Target ${args.TARGET} not found`);
          return;
        }
        
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
          target.id
        );
      } catch (e) {
        console.error('Error adding costume:', e);
      }
    }

    async addSoundFromUrl(args) {
      try {
        const target = Scratch.vm.runtime.getSpriteTargetByName(args.TARGET);
        if (!target) {
          console.error(`Target ${args.TARGET} not found`);
          return;
        }
        
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
          target.id
        );
      } catch (e) {
        console.error('Error adding sound:', e);
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

    deleteCostumesContaining(args) {
      const target = Scratch.vm.editingTarget;
      if (!target) return;
      
      const indicesToDelete = [];
      for (let i = 0; i < target.sprite.costumes.length; i++) {
        if (target.sprite.costumes[i].name.includes(args.CONTAINS)) {
          indicesToDelete.unshift(i);
        }
      }
      
      for (const index of indicesToDelete) {
        target.deleteCostume(index);
      }
    }

    deleteSoundsContaining(args) {
      const target = Scratch.vm.editingTarget;
      if (!target) return;
      
      const indicesToDelete = [];
      for (let i = 0; i < target.sprite.sounds.length; i++) {
        if (target.sprite.sounds[i].name.includes(args.CONTAINS)) {
          indicesToDelete.unshift(i);
        }
      }
      
      for (const index of indicesToDelete) {
        target.deleteSound(index);
      }
    }

    async exportCostumeDataURL(args) {
      const target = Scratch.vm.editingTarget;
      if (!target) return '';
      
      const costumeIndex = target.getCostumeIndexByName(args.NAME);
      if (costumeIndex === -1) return '';
      
      const costume = target.sprite.costumes[costumeIndex];
      const asset = costume.asset;
      
      if (!asset) return '';
      
      try {
        const data = await asset.getData();
        const blob = new Blob([data], { type: `image/${costume.dataFormat}` });
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Error exporting costume:', e);
        return '';
      }
    }

    async exportSoundDataURL(args) {
      const target = Scratch.vm.editingTarget;
      if (!target) return '';
      
      const soundIndex = this._getSoundIndexByName(args.NAME, target);
      if (soundIndex === -1) return '';
      
      const sound = target.sprite.sounds[soundIndex];
      const asset = sound.asset;
      
      if (!asset) return '';
      
      try {
        const data = await asset.getData();
        const blob = new Blob([data], { type: `audio/${sound.format === 'mp3' ? 'mp3' : 'wav'}` });
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Error exporting sound:', e);
        return '';
      }
    }

    async loadZipFromDataURL(args) {
      if (!this.JSZip) {
        console.error('JSZip library not loaded');
        return;
      }
      
      try {
        let data = args.DATA;
        
        if (data.startsWith('data:')) {
          const base64Data = data.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          data = bytes.buffer;
        }
        
        const zip = await this.JSZip.loadAsync(data);
        this.zipFiles = [];
        
        for (const fileName in zip.files) {
          this.zipFiles.push({
            name: fileName,
            file: zip.file(fileName)
          });
        }
      } catch (e) {
        console.error('Error loading ZIP:', e);
      }
    }

    getZipFileCount() {
      return this.zipFiles.length;
    }

    async getZipFileInfo(args) {
      const index = Math.floor(args.INDEX) - 1;
      if (index < 0 || index >= this.zipFiles.length) {
        return '';
      }
      
      const fileInfo = this.zipFiles[index];
      const file = fileInfo.file;
      
      switch (args.INFO) {
        case 'dataurl':
          try {
            const blob = await file.async('blob');
            return new Promise(resolve => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            return '';
          }
        case 'text':
          try {
            return await file.async('string');
          } catch (e) {
            return '';
          }
        case 'date':
          const date = file.date;
          return this._formatDate(date);
        case 'modDate':
          const modDate = file.date;
          return this._formatDate(modDate);
        case 'name':
          return fileInfo.name;
        case 'type':
          return file.options.binary ? 'binary' : 'text';
        case 'size':
          const size = file._data.uncompressedSize || 0;
          return (size / (1024 * 1024)).toFixed(2);
        default:
          return '';
      }
    }

    _formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}年${month}月${day}日${hours}:${minutes}`;
    }

    _getSoundIndexByName(soundName, target) {
      for (let i = 0; i < target.sprite.sounds.length; i++) {
        if (target.sprite.sounds[i].name === soundName) {
          return i;
        }
      }
      return -1;
    }
  }

  Scratch.extensions.register(new ZxCharacterControl());
})(Scratch);