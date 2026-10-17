(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('This extension must run unsandboxed');
  }

  // 音频管理类
  class AudioManager {
    constructor() {
      this.audioFiles = {}; // 存储音频文件 {name: {audioEngineSource, nativeAudio}}
      this.fileInfo = {}; // 存储文件信息 {name: {size, duration, type}}
      this.recordingMediaRecorder = null;
      this.recordingChunks = [];
      this.isRecording = false;
      this.microphoneActive = false;
      this.loopingAudios = new Set(); // 存储正在循环播放的音频名称
      this.recordingStartTime = null; // 记录开始录音的时间戳
      this.recordingTimerInterval = null; // 计时器ID
      this.currentRecordingDuration = 0; // 当前录音时长（秒）
      
      // 获取Scratch的AudioEngine
      this.audioEngine = Scratch.vm.runtime.audioEngine;
    }

    // 添加音频文件（使用双重策略）
    async addAudio(name, dataUrl, fileInfo) {
      // 尝试使用AudioEngine
      let audioEngineSource = null;
      try {
        if (this.audioEngine) {
          audioEngineSource = await this.audioEngine.decodeSound(Object.assign({}, fileInfo, { data: this._dataUrlToArrayBuffer(dataUrl) }));
        }
      } catch (e) {
        console.warn('AudioEngine decode failed, falling back to native audio:', e);
      }

      // 创建原生音频对象
      const nativeAudio = new Audio(dataUrl);
      
      // 存储两种方式的音频源
      this.audioFiles[name] = {
        audioEngineSource: audioEngineSource,
        nativeAudio: nativeAudio
      };
      this.fileInfo[name] = fileInfo;

      // 更新音频时长
      if (audioEngineSource) {
        // AudioEngine解码后可能有延迟，这里用原生音频获取时长
        nativeAudio.onloadedmetadata = () => {
          this.fileInfo[name].duration = nativeAudio.duration;
        };
      } else {
        nativeAudio.onloadedmetadata = () => {
          this.fileInfo[name].duration = nativeAudio.duration;
        };
      }
    }

    // 将DataURL转换为ArrayBuffer
    _dataUrlToArrayBuffer(dataUrl) {
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }

    // 播放音频（双重策略）
    async playAudio(name, startTime = 0) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 优先使用AudioEngine
      if (audioSources.audioEngineSource && this.audioEngine) {
        try {
          // AudioEngine播放
          const targetId = Scratch.vm.editingTarget.id;
          const soundId = name;
          
          // 如果有正在播放的声音，先停止
          if (this._isPlayingWithAudioEngine(name)) {
            this.audioEngine.stop(targetId, soundId);
          }
          
          // 播放声音
          await this.audioEngine.playSound(targetId, soundId, audioSources.audioEngineSource);
          
          // 设置开始时间（AudioEngine不直接支持设置currentTime，我们通过其他方式模拟）
          return true;
        } catch (e) {
          console.warn('AudioEngine play failed, falling back to native audio:', e);
        }
      }

      // 回退到原生音频播放
      if (audioSources.nativeAudio) {
        const audio = audioSources.nativeAudio;
        audio.currentTime = startTime;
        try {
          await audio.play();
          return true;
        } catch (e) {
          console.error('Native audio play error:', e);
          return false;
        }
      }
      
      return false;
    }

    // 检查AudioEngine是否正在播放特定音频
    _isPlayingWithAudioEngine(name) {
      if (!this.audioEngine || !this.audioEngine.sounds) return false;
      // 这里简化处理，实际可能需要更复杂的检查
      return false;
    }

    // 播放指定时间段的音频
    async playAudioFromTo(name, start, end) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 优先使用AudioEngine
      if (audioSources.audioEngineSource && this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          
          // 由于AudioEngine不直接支持时间范围播放，我们使用原生音频
        } catch (e) {
          console.warn('AudioEngine play range failed, using native audio:', e);
        }
      }

      // 使用原生音频实现时间范围播放
      if (audioSources.nativeAudio) {
        const audio = audioSources.nativeAudio;
        audio.currentTime = start;
        
        const onTimeUpdate = () => {
          if (audio.currentTime >= end) {
            audio.pause();
            audio.removeEventListener('timeupdate', onTimeUpdate);
          }
        };
        
        audio.addEventListener('timeupdate', onTimeUpdate);
        try {
          await audio.play();
          return true;
        } catch (e) {
          console.error('Native audio play error:', e);
          return false;
        }
      }
      
      return false;
    }

    // 播放从指定时间到结束
    async playAudioFromStartToEnd(name, start) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 使用原生音频
      if (audioSources.nativeAudio) {
        const audio = audioSources.nativeAudio;
        audio.currentTime = start;
        try {
          await audio.play();
          return true;
        } catch (e) {
          console.error('Native audio play error:', e);
          return false;
        }
      }
      
      return false;
    }

    // 暂停音频
    pauseAudio(name) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 尝试暂停AudioEngine播放的声音
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          this.audioEngine.stop(targetId, name);
        } catch (e) {
          console.warn('AudioEngine stop failed:', e);
        }
      }

      // 暂停原生音频
      if (audioSources.nativeAudio) {
        audioSources.nativeAudio.pause();
        return true;
      }
      
      return false;
    }

    // 继续播放音频
    async resumeAudio(name) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 尝试恢复AudioEngine播放（如果之前有播放过）
      if (audioSources.audioEngineSource && this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          await this.audioEngine.playSound(targetId, name, audioSources.audioEngineSource);
          return true;
        } catch (e) {
          console.warn('AudioEngine resume failed, using native audio:', e);
        }
      }

      // 使用原生音频恢复播放
      if (audioSources.nativeAudio) {
        try {
          await audioSources.nativeAudio.play();
          return true;
        } catch (e) {
          console.error('Native audio resume error:', e);
          return false;
        }
      }
      
      return false;
    }

    // 设置音量
    setVolume(name, volume) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 设置AudioEngine音量
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          this.audioEngine.setEffects(targetId, name, { volume: Math.max(0, Math.min(100, volume * 100)) });
        } catch (e) {
          console.warn('AudioEngine set volume failed:', e);
        }
      }

      // 设置原生音频音量
      if (audioSources.nativeAudio) {
        audioSources.nativeAudio.volume = Math.max(0, Math.min(1, volume));
        return true;
      }
      
      return false;
    }

    // 增加音量
    changeVolume(name, delta) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 调整AudioEngine音量
      if (this.audioEngine) {
        try {
          const currentVolume = this.getVolume(name);
          const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
          const targetId = Scratch.vm.editingTarget.id;
          this.audioEngine.setEffects(targetId, name, { volume: newVolume * 100 });
        } catch (e) {
          console.warn('AudioEngine change volume failed:', e);
        }
      }

      // 调整原生音频音量
      if (audioSources.nativeAudio) {
        const currentVolume = audioSources.nativeAudio.volume;
        const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
        audioSources.nativeAudio.volume = newVolume;
        return true;
      }
      
      return false;
    }

    // 获取音量
    getVolume(name) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return 1.0;

      // 优先返回原生音频的音量
      if (audioSources.nativeAudio) {
        return audioSources.nativeAudio.volume;
      }
      
      return 1.0;
    }

    // 设置播放速度
    setPlaybackRate(name, rate) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 设置AudioEngine播放速度
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          this.audioEngine.setEffects(targetId, name, { pitch: rate * 100 }); // 简化处理
        } catch (e) {
          console.warn('AudioEngine set playback rate failed:', e);
        }
      }

      // 设置原生音频播放速度
      if (audioSources.nativeAudio) {
        audioSources.nativeAudio.playbackRate = Math.max(0.1, Math.min(4, rate));
        return true;
      }
      
      return false;
    }

    // 暂停所有音频
    pauseAllAudios() {
      // 暂停AudioEngine所有声音
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          // 停止所有声音
          for (const name in this.audioFiles) {
            this.audioEngine.stop(targetId, name);
          }
        } catch (e) {
          console.warn('AudioEngine pause all failed:', e);
        }
      }

      // 暂停所有原生音频
      for (const name in this.audioFiles) {
        if (this.audioFiles[name].nativeAudio) {
          this.audioFiles[name].nativeAudio.pause();
        }
      }
    }

    // 恢复所有音频
    async resumeAllAudios() {
      let success = false;
      for (const name in this.audioFiles) {
        const result = await this.resumeAudio(name);
        if (result) success = true;
      }
      return success;
    }

    // 开始循环播放
    async startLooping(name, start, end) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 如果指定了时间范围，则使用原生音频实现区域循环
      if (start !== undefined && end !== undefined) {
        if (audioSources.nativeAudio) {
          const audio = audioSources.nativeAudio;
          audio.currentTime = start;
          
          const onTimeUpdate = () => {
            if (audio.currentTime >= end) {
              audio.currentTime = start;
            }
          };
          
          audio.addEventListener('timeupdate', onTimeUpdate);
          try {
            await audio.play();
            this.loopingAudios.add(name);
            return true;
          } catch (e) {
            console.error('Native audio loop play error:', e);
            return false;
          }
        }
      } else {
        // 整体循环 - 优先使用AudioEngine
        if (audioSources.audioEngineSource && this.audioEngine) {
          try {
            const targetId = Scratch.vm.editingTarget.id;
            
            // AudioEngine没有直接的循环API，我们通过重复播放模拟
            // 这里我们还是使用原生音频实现循环
          } catch (e) {
            console.warn('AudioEngine loop play failed, using native audio:', e);
          }
        }

        // 使用原生音频实现整体循环
        if (audioSources.nativeAudio) {
          audioSources.nativeAudio.loop = true;
          try {
            await audioSources.nativeAudio.play();
            this.loopingAudios.add(name);
            return true;
          } catch (e) {
            console.error('Native audio loop play error:', e);
            return false;
          }
        }
      }
      
      return false;
    }

    // 停止循环播放
    stopLooping(name) {
      const audioSources = this.audioFiles[name];
      if (!audioSources) return false;

      // 停止AudioEngine播放
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          this.audioEngine.stop(targetId, name);
        } catch (e) {
          console.warn('AudioEngine stop failed:', e);
        }
      }

      // 停止原生音频循环
      if (audioSources.nativeAudio) {
        audioSources.nativeAudio.loop = false;
        this.loopingAudios.delete(name);
        return true;
      }
      
      return false;
    }

    // 检查是否在循环播放
    isLooping(name) {
      return this.loopingAudios.has(name);
    }

    // 删除音频文件
    removeAudio(name) {
      if (this.audioFiles[name]) {
        // 停止AudioEngine播放
        if (this.audioEngine) {
          try {
            const targetId = Scratch.vm.editingTarget.id;
            this.audioEngine.stop(targetId, name);
          } catch (e) {
            console.warn('AudioEngine stop failed:', e);
          }
        }

        // 暂停原生音频
        if (this.audioFiles[name].nativeAudio) {
          this.audioFiles[name].nativeAudio.pause();
        }

        delete this.audioFiles[name];
        delete this.fileInfo[name];
        this.loopingAudios.delete(name);
        return true;
      }
      return false;
    }

    // 删除所有音频文件
    removeAllAudios() {
      // 停止AudioEngine所有声音
      if (this.audioEngine) {
        try {
          const targetId = Scratch.vm.editingTarget.id;
          for (const name in this.audioFiles) {
            this.audioEngine.stop(targetId, name);
          }
        } catch (e) {
          console.warn('AudioEngine stop all failed:', e);
        }
      }

      // 暂停所有原生音频
      for (const name in this.audioFiles) {
        if (this.audioFiles[name].nativeAudio) {
          this.audioFiles[name].nativeAudio.pause();
        }
      }

      this.audioFiles = {};
      this.fileInfo = {};
      this.loopingAudios.clear();
    }

    // 获取音频列表
    getAudioList() {
      return Object.keys(this.audioFiles);
    }

    // 获取音频总数
    getAudioCount() {
      return Object.keys(this.audioFiles).length;
    }

    // 获取音频信息
    getAudioInfo(name, infoType) {
      if (!this.audioFiles[name]) return '';
      
      const audioSources = this.audioFiles[name];
      const fileInfo = this.fileInfo[name];
      const nativeAudio = audioSources.nativeAudio;
      
      switch(infoType) {
        case 'name':
          return name;
        case 'size':
          return fileInfo ? (fileInfo.size / (1024 * 1024)).toFixed(2) : '0.00';
        case 'extension':
          return fileInfo ? fileInfo.type : '';
        case 'duration':
          return this.formatTime(nativeAudio ? nativeAudio.duration || 0 : 0);
        case 'status':
          return nativeAudio ? (nativeAudio.paused ? '暂停' : '播放') : '未知';
        case 'currentTime':
          return this.formatTime(nativeAudio ? nativeAudio.currentTime || 0 : 0);
        case 'volume':
          return (nativeAudio ? nativeAudio.volume : 1.0).toFixed(2);
        case 'playbackRate':
          return (nativeAudio ? nativeAudio.playbackRate : 1.0).toFixed(2);
        default:
          return '';
      }
    }

    // 格式化时间 (秒 -> MM:SS)
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 设置全局音量
    setGlobalVolume(volume) {
      const vol = Math.max(0, Math.min(1, volume));
      for (const name in this.audioFiles) {
        this.setVolume(name, vol);
      }
    }

    // 改变全局音量
    changeGlobalVolume(delta) {
      for (const name in this.audioFiles) {
        this.changeVolume(name, delta);
      }
    }

    // 获取全局音量 (返回第一个音频的音量作为代表)
    getGlobalVolume() {
      for (const name in this.audioFiles) {
        return this.getVolume(name).toFixed(2);
      }
      return '1.00';
    }

    // 开始录音（使用RecordRTC）
    async startRecording(recorderType) {
      try {
        // 动态加载RecordRTC库
        if (typeof RecordRTC === 'undefined') {
          await this.loadRecordRTC();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.microphoneActive = true;
        
        // 根据指定类型创建RecordRTC实例
        let options = {};
        if (recorderType === 'mp3') {
          options = {
            type: 'audio',
            mimeType: 'audio/mp3',
            recorderType: RecordRTC.StereoAudioRecorder
          };
        } else if (recorderType === 'wav') {
          options = {
            type: 'audio',
            mimeType: 'audio/wav',
            recorderType: RecordRTC.StereoAudioRecorder
          };
        }

        this.recordingMediaRecorder = RecordRTC(stream, options);
        this.recordingMediaRecorder.startRecording();
        
        // 启动计时器
        this.startRecordingTimer();
        
        this.isRecording = true;
      } catch (error) {
        console.error('录音启动失败:', error);
      }
    }

    // 加载RecordRTC库
    loadRecordRTC() {
      return new Promise((resolve, reject) => {
        if (typeof RecordRTC !== 'undefined') {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/recordrtc@5.6.2/RecordRTC.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // 启动录音计时器
    startRecordingTimer() {
      this.recordingStartTime = Date.now();
      this.currentRecordingDuration = 0;
      
      this.recordingTimerInterval = setInterval(() => {
        this.currentRecordingDuration = (Date.now() - this.recordingStartTime) / 1000;
      }, 1000);
    }

    // 停止录音计时器
    stopRecordingTimer() {
      if (this.recordingTimerInterval) {
        clearInterval(this.recordingTimerInterval);
        this.recordingTimerInterval = null;
      }
    }

    // 暂停录音
    pauseRecording() {
      if (this.recordingMediaRecorder && this.isRecording) {
        this.recordingMediaRecorder.pauseRecording();
        this.isRecording = false;
        // 暂停计时器
        this.stopRecordingTimer();
      }
    }

    // 继续录音
    resumeRecording() {
      if (this.recordingMediaRecorder && !this.isRecording) {
        this.recordingMediaRecorder.resumeRecording();
        this.isRecording = true;
        // 重新启动计时器
        this.startRecordingTimer();
      }
    }

    // 停止录音并下载
    stopAndDownload(filename = 'recording') {
      if (this.recordingMediaRecorder && (this.isRecording || !this.isRecording)) {
        this.recordingMediaRecorder.stopRecording(() => {
          const blob = this.recordingMediaRecorder.getBlob();
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${this.getCurrentRecordingFormat()}`;
          a.click();
          
          URL.revokeObjectURL(url);
          
          // 停止媒体流
          const stream = this.recordingMediaRecorder.stream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          this.microphoneActive = false;
          this.isRecording = false;
          this.stopRecordingTimer();
          this.currentRecordingDuration = 0;
        });
      }
    }

    // 获取当前录音格式
    getCurrentRecordingFormat() {
      if (this.recordingMediaRecorder) {
        const mimeType = this.recordingMediaRecorder.options?.mimeType;
        if (mimeType) {
          return mimeType.split('/')[1];
        }
      }
      return 'wav'; // 默认返回wav
    }

    // 停止录音并获取DataURL
    stopAndGetUrl() {
      return new Promise((resolve) => {
        if (this.recordingMediaRecorder && (this.isRecording || !this.isRecording)) {
          this.recordingMediaRecorder.stopRecording(() => {
            const blob = this.recordingMediaRecorder.getBlob();
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              
              // 停止媒体流
              const stream = this.recordingMediaRecorder.stream;
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              
              this.microphoneActive = false;
              this.isRecording = false;
              this.stopRecordingTimer();
              this.currentRecordingDuration = 0;
              
              resolve(dataUrl);
            };
            reader.readAsDataURL(blob);
          });
        } else {
          resolve('');
        }
      });
    }

    // 获取录制时长
    getRecordedDuration() {
      return this.formatTime(this.currentRecordingDuration);
    }

    // 检查麦克风状态
    isMicrophoneOpen() {
      return this.microphoneActive;
    }

    // 获取录制状态
    getRecordingStatus() {
      if (!this.microphoneActive) return '未开启';
      if (this.isRecording) return '录音中';
      return '已暂停';
    }
  }

  const audioManager = new AudioManager();

  class MusicExtension {
    getInfo() {
      return {
        id: 'zxMusicPlayerV2',
        name: 'zx的音乐播放扩展v2',
        color1: '#ff6de5',
        color2: '#e05cbf',
        color3: '#cc4da6',
        blocks: [
          // 音频管理
          {
            opcode: 'getAudioList',
            blockType: Scratch.BlockType.REPORTER,
            text: '所有音频文件名',
            arguments: {},
            disableMonitor: true
          },
          {
            opcode: 'getAudioCount',
            blockType: Scratch.BlockType.REPORTER,
            text: '音频文件数量',
            arguments: {}
          },
          {
            opcode: 'uploadAudio',
            blockType: Scratch.BlockType.COMMAND,
            text: '上传音频文件并命名为 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'importAudioFromDataUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: '从 Data URL 导入音频文件并命名为 [NAME] URL: [DATA_URL]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              DATA_URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'removeAudio',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除音频文件 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'removeAllAudios',
            blockType: Scratch.BlockType.COMMAND,
            text: '删除所有音频文件'
          },

          // 音频播放控制
          {
            opcode: 'playAudio',
            blockType: Scratch.BlockType.COMMAND,
            text: '播放音频 [NAME] 从 [START_TIME] 秒开始',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              START_TIME: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'pauseAudio',
            blockType: Scratch.BlockType.COMMAND,
            text: '暂停音频 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'resumeAudio',
            blockType: Scratch.BlockType.COMMAND,
            text: '继续播放音频 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'setVolume',
            blockType: Scratch.BlockType.COMMAND,
            text: '将音频 [NAME] 的音量设置为 [VOLUME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              VOLUME: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.8
              }
            }
          },
          {
            opcode: 'changeVolume',
            blockType: Scratch.BlockType.COMMAND,
            text: '将音频 [NAME] 的音量增加 [DELTA]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              DELTA: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.1
              }
            }
          },
          {
            opcode: 'setPlaybackRate',
            blockType: Scratch.BlockType.COMMAND,
            text: '将音频 [NAME] 的播放倍速设置为 [RATE] 倍',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              RATE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1.0
              }
            }
          },
          {
            opcode: 'pauseAllAudios',
            blockType: Scratch.BlockType.COMMAND,
            text: '暂停所有音频播放'
          },
          {
            opcode: 'resumeAllAudios',
            blockType: Scratch.BlockType.COMMAND,
            text: '继续所有音频播放'
          },
          {
            opcode: 'setGlobalVolume',
            blockType: Scratch.BlockType.COMMAND,
            text: '将全局音量设置为 [VOLUME]',
            arguments: {
              VOLUME: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.8
              }
            }
          },
          {
            opcode: 'changeGlobalVolume',
            blockType: Scratch.BlockType.COMMAND,
            text: '将全局音量增加 [DELTA]',
            arguments: {
              DELTA: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.1
              }
            }
          },
          {
            opcode: 'playAudioFromTo',
            blockType: Scratch.BlockType.COMMAND,
            text: '播放音频 [NAME] 从 [START] 秒到 [END] 秒',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              START: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              END: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'playAudioFromStartToEnd',
            blockType: Scratch.BlockType.COMMAND,
            text: '播放音频 [NAME] 从 [START] 秒到结束',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              START: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },

          // 循环播放
          {
            opcode: 'startLooping',
            blockType: Scratch.BlockType.COMMAND,
            text: '循环播放音频 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'startLoopingFrom',
            blockType: Scratch.BlockType.COMMAND,
            text: '循环播放音频 [NAME] 从 [START] 秒开始',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              START: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'startLoopingFromTo',
            blockType: Scratch.BlockType.COMMAND,
            text: '循环播放音频 [NAME] 从 [START] 秒到 [END] 秒',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              START: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              END: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'stopLooping',
            blockType: Scratch.BlockType.COMMAND,
            text: '停止循环播放音频 [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },
          {
            opcode: 'isLooping',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '音频 [NAME] 正在循环播放？',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              }
            }
          },

          // 音频信息查询
          {
            opcode: 'getAudioInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: '音频 [NAME] 的 [INFO_TYPE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'audio1'
              },
              INFO_TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'infoTypeMenu'
              }
            }
          },
          {
            opcode: 'getGlobalVolume',
            blockType: Scratch.BlockType.REPORTER,
            text: '全局音量',
            arguments: {}
          },

          // 录音功能
          {
            opcode: 'startRecordingMp3',
            blockType: Scratch.BlockType.COMMAND,
            text: '打开设备麦克风并录音 (MP3)'
          },
          {
            opcode: 'startRecordingWav',
            blockType: Scratch.BlockType.COMMAND,
            text: '打开设备麦克风并录音 (WAV)'
          },
          {
            opcode: 'pauseRecording',
            blockType: Scratch.BlockType.COMMAND,
            text: '暂停录音'
          },
          {
            opcode: 'resumeRecording',
            blockType: Scratch.BlockType.COMMAND,
            text: '继续录音'
          },
          {
            opcode: 'stopAndDownload',
            blockType: Scratch.BlockType.COMMAND,
            text: '停止录音并下载 文件名: [FILENAME]',
            arguments: {
              FILENAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'recording'
              }
            }
          },
          {
            opcode: 'getRecordedDuration',
            blockType: Scratch.BlockType.REPORTER,
            text: '已录制的时长',
            arguments: {}
          },
          {
            opcode: 'stopAndGetUrl',
            blockType: Scratch.BlockType.REPORTER,
            text: '停止录音并获取录音的 dataURL',
            arguments: {}
          },
          {
            opcode: 'isMicrophoneOpen',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '麦克风开启了？',
            arguments: {}
          },
          {
            opcode: 'getRecordingStatus',
            blockType: Scratch.BlockType.REPORTER,
            text: '麦克风录制状态',
            arguments: {}
          }
        ],
        menus: {
          infoTypeMenu: {
            acceptReporters: true,
            items: [
              { text: '文件名称', value: 'name' },
              { text: '文件大小(MB)', value: 'size' },
              { text: '文件后缀', value: 'extension' },
              { text: '时长', value: 'duration' },
              { text: '播放状态', value: 'status' },
              { text: '当前播放时间', value: 'currentTime' },
              { text: '音量', value: 'volume' },
              { text: '播放倍速', value: 'playbackRate' }
            ]
          }
        }
      };
    }

    // 音频管理
    getAudioList() {
      return audioManager.getAudioList().join(',');
    }

    getAudioCount() {
      return audioManager.getAudioCount();
    }

    async uploadAudio(args) {
      // 创建文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            // 获取文件后缀
            const ext = file.name.split('.').pop().toLowerCase();
            
            await audioManager.addAudio(args.NAME, e.target.result, {
              size: file.size,
              duration: 0, // 初始值，稍后更新
              type: ext
            });
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    }

    async importAudioFromDataUrl(args) {
      if (!args.DATA_URL) return;
      
      // 尝试从DataURL推断文件类型
      let ext = 'unknown';
      if (args.DATA_URL.startsWith('data:audio/mpeg')) ext = 'mp3';
      else if (args.DATA_URL.startsWith('data:audio/wav')) ext = 'wav';
      else if (args.DATA_URL.startsWith('data:audio/ogg')) ext = 'ogg';
      else if (args.DATA_URL.startsWith('data:audio/x-m4a')) ext = 'm4a';
      else if (args.DATA_URL.startsWith('data:audio/flac')) ext = 'flac';
      
      await audioManager.addAudio(args.NAME, args.DATA_URL, {
        size: 0, // 无法确定大小
        duration: 0, // 初始值，稍后更新
        type: ext
      });
    }

    removeAudio(args) {
      audioManager.removeAudio(args.NAME);
    }

    removeAllAudios() {
      audioManager.removeAllAudios();
    }

    // 音频播放控制
    async playAudio(args) {
      await audioManager.playAudio(args.NAME, parseFloat(args.START_TIME));
    }

    pauseAudio(args) {
      audioManager.pauseAudio(args.NAME);
    }

    async resumeAudio(args) {
      await audioManager.resumeAudio(args.NAME);
    }

    setVolume(args) {
      audioManager.setVolume(args.NAME, parseFloat(args.VOLUME));
    }

    changeVolume(args) {
      audioManager.changeVolume(args.NAME, parseFloat(args.DELTA));
    }

    setPlaybackRate(args) {
      audioManager.setPlaybackRate(args.NAME, parseFloat(args.RATE));
    }

    pauseAllAudios() {
      audioManager.pauseAllAudios();
    }

    async resumeAllAudios() {
      await audioManager.resumeAllAudios();
    }

    setGlobalVolume(args) {
      audioManager.setGlobalVolume(parseFloat(args.VOLUME));
    }

    changeGlobalVolume(args) {
      audioManager.changeGlobalVolume(parseFloat(args.DELTA));
    }

    async playAudioFromTo(args) {
      await audioManager.playAudioFromTo(args.NAME, parseFloat(args.START), parseFloat(args.END));
    }

    async playAudioFromStartToEnd(args) {
      await audioManager.playAudioFromStartToEnd(args.NAME, parseFloat(args.START));
    }

    // 循环播放
    async startLooping(args) {
      await audioManager.startLooping(args.NAME);
    }

    async startLoopingFrom(args) {
      await audioManager.startLooping(args.NAME, parseFloat(args.START));
    }

    async startLoopingFromTo(args) {
      await audioManager.startLooping(args.NAME, parseFloat(args.START), parseFloat(args.END));
    }

    stopLooping(args) {
      audioManager.stopLooping(args.NAME);
    }

    isLooping(args) {
      return audioManager.isLooping(args.NAME);
    }

    getAudioInfo(args) {
      return audioManager.getAudioInfo(args.NAME, args.INFO_TYPE);
    }

    getGlobalVolume() {
      return audioManager.getGlobalVolume();
    }

    // 录音功能
    async startRecordingMp3() {
      await audioManager.startRecording('mp3');
    }

    async startRecordingWav() {
      await audioManager.startRecording('wav');
    }

    pauseRecording() {
      audioManager.pauseRecording();
    }

    resumeRecording() {
      audioManager.resumeRecording();
    }

    stopAndDownload(args) {
      audioManager.stopAndDownload(args.FILENAME);
    }

    getRecordedDuration() {
      return audioManager.getRecordedDuration();
    }

    async stopAndGetUrl() {
      return await audioManager.stopAndGetUrl();
    }

    isMicrophoneOpen() {
      return audioManager.isMicrophoneOpen();
    }

    getRecordingStatus() {
      return audioManager.getRecordingStatus();
    }
  }

  Scratch.extensions.register(new MusicExtension());
})(Scratch);