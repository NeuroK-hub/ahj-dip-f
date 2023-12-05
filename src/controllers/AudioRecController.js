export default class AudioRecController {
  constructor(msgPanel, msgController, form) {
    this.msgPanel = msgPanel;
    this.controller = msgController;
    this.form = form;
    this.recorder = null;
    this.audioChunks = [];
    this.isRecordingCancel = null;

    // Elements
    this.audioControl = this.form.querySelector('.new-message__audio-control');
    this.saveAudioBtn = this.form.querySelector('.new-message__save-btn');
    this.recordAudioBtn = this.form.querySelector('.new-message__record-btn');
    this.cancelAudioBtn = this.form.querySelector('.new-message__cancel-btn');
    this.recordingAudio = this.form.querySelector('.new-message__recording');
    this.timerElement = this.form.querySelector('.recording__text');

    this.bindEventListener();
  }

  bindEventListener() {
    this.recordAudioBtn.addEventListener('click', this.startRecording.bind(this));
    this.saveAudioBtn.addEventListener('click', this.saveRecording.bind(this));
    this.cancelAudioBtn.addEventListener('click', this.cancelRecording.bind(this));
  }

  startRecording(event) {
    event.preventDefault();
    this.isRecordingCancel = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.recorder = new MediaRecorder(stream);
        this.recorder.addEventListener('stop', () => {
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
            const file = new File([audioBlob], `${new Date().toISOString()}.webm`, { type: 'audio/webm;codecs=opus' });
            this.controller.insertMessage({ files: [file] });
            this.audioChunks = [];
          }
        });
        this.recorder.addEventListener('dataavailable', (e) => {
          if (!this.isRecordingCancel) {
            this.audioChunks.push(e.data);
          }
        });
        this.recorder.start();
        this.msgPanel.toggleDisplay();
        this.audioControl.classList.remove('hidden');
        const startTime = Date.now();
        this.timer = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          const seconds = Math.floor(elapsedTime / 1000) % 60;
          const minutes = Math.floor(elapsedTime / 1000 / 60);
          const timeString = `Rec ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          this.timerElement.textContent = timeString;
        }, 1000);
      })
      .catch(() => {
        this.controller.bot.sendError('Пожалуйста, разрешите доступ к микрофону');
      });
  }

  saveRecording(e) {
    e.preventDefault();
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
      this.recorder.stream.getTracks().forEach((track) => track.stop());
      clearInterval(this.timer);
      this.timerElement.textContent = 'Rec 00:00';
    }
    this.audioControl.classList.add('hidden');
    this.resetForm();
  }

  cancelRecording(e) {
    e.preventDefault();
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
      this.recorder.stream.getTracks().forEach((track) => track.stop());
      clearInterval(this.timer);
      this.timerElement.textContent = 'Rec 00:00';
    }
    this.isRecordingCancel = true;
    this.resetForm();
  }

  resetForm() {
    this.msgPanel.toggleDisplay();
    this.msgPanel.resetForm();
    this.audioChunks = [];
    this.recorder = null;
    this.audioControl.classList.add('hidden');
  }
}
