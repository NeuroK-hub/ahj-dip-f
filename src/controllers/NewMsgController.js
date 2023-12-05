import { formatFileSize } from '../utils/messageUtils';
import AudioRecController from './AudioRecController';

export default class NewMsgController {
  constructor(panel, picker, msgController) {
    this.form = panel;
    this.container = panel.querySelector('.new-message__container');
    this.msgController = msgController;
    this.audioRec = new AudioRecController(this, msgController, this.form);
    this.fileList = [];

    // Panel elements
    this.textInput = this.form.querySelector('.new-message__input');
    this.fileInput = this.form.querySelector('.new-message__file-input');
    this.fileInputBtn = this.form.querySelector('.new-message__file-btn');
    this.fileListDom = this.form.querySelector('.new-message__file-list');
    this.sendBtn = this.form.querySelector('.new-message__submit-btn');
    this.dropzone = document.querySelector('.chat__dropzone');

    // Emoji picker
    this.picker = picker;
    this.emojiPickerBox = panel.querySelector('.new-message__emoji-container');
    this.emojiToggler = panel.querySelector('.new-message__emoji-btn');
    this.isPickerVisible = false;

    // Audio recorder
    this.recordAudioBtn = this.form.querySelector('.new-message__record-btn');
  }

  bindEventListener() {
    this.emojiToggler.addEventListener('click', this.emojiOntoggle.bind(this));
    this.picker.classList.add('new-message__emoji-picker');
    this.picker.props.onEmojiSelect = (emoji) => {
      this.textInput.focus();
      this.textInput.value += emoji.native;
      this.textareaOninput();
    };

    this.form.addEventListener('submit', this.formOnsubmit.bind(this));
    this.fileInputBtn.addEventListener('click', this.fileInputBtnOnClick.bind(this));
    this.fileInput.addEventListener('change', this.fileLoad.bind(this));
    this.sendBtn.addEventListener('click', this.formOnsubmit.bind(this));
    this.textInput.addEventListener('input', this.textareaOninput.bind(this));
    this.textInput.addEventListener('keydown', this.handleTextareaKeyPress.bind(this));

    document.addEventListener('dragover', this.handleDragOver.bind(this));
    document.addEventListener('drop', this.handleFileDrop.bind(this));
    window.addEventListener('dragleave', this.handleDragLeaveWindow.bind(this));
    this.dropzone.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.dropzone.addEventListener('dragleave', this.handleDragLeave.bind(this));
  }

  fileInputBtnOnClick(e) {
    e.preventDefault();
    this.fileInput.click();
    e.target.closest('.new-message__file-btn').blur();
  }

  fileLoad(e) {
    if (this.fileList.length >= 4) {
      this.msgController.bot.sendError('Вы можете отправить не более 4 файлов');
      return false;
    }
    const files = e.target.files;
    for (const file of files) {
      this.fileList.push(file);
    }
    this.renderFileList();
    return true;
  }

  renderFileList() {
    if (this.fileList.length > 0) {
      this.sendBtn.classList.remove('hidden');
      this.recordAudioBtn.classList.add('hidden');
    } else {
      this.sendBtn.classList.add('hidden');
      this.recordAudioBtn.classList.remove('hidden');
    }
    this.fileListDom.innerHTML = '';

    this.fileList.forEach((file) => {
      const fileItem = document.createElement('div');
      fileItem.classList.add('new-message__file-item');
      const fileName = document.createElement('div');
      fileName.classList.add('new-message__file-name');
      fileName.textContent = file.name;
      const fileSize = document.createElement('div');
      fileSize.classList.add('new-message__file-size');
      fileSize.textContent = formatFileSize(file.size);
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('new-message__file-delete');
      deleteBtn.textContent = '\u2715';
      deleteBtn.addEventListener('click', () => {
        this.fileList.splice(this.fileList.indexOf(file), 1);
        this.renderFileList();
      });
      fileItem.appendChild(fileName);
      fileItem.appendChild(fileSize);
      fileItem.appendChild(deleteBtn);
      this.fileListDom.appendChild(fileItem);
    });

    if (this.fileList.length > 0) {
      this.fileListDom.classList.add('new-message__file-list--visible');
    } else {
      this.fileListDom.classList.remove('new-message__file-list--visible');
    }
  }

  formOnsubmit(e) {
    e.preventDefault();
    if (this.isPickerVisible) {
      this.closeEmojiPicker();
    }
    if (this.textInput.value.trim() !== '' || this.fileList.length > 0) {
      const message = {
        text: this.textInput.value.trim(),
        files: this.fileList,
      };
      this.msgController.insertMessage(message);
      this.resetForm();
    }
    if (e.target.closest('.new-message__submit-btn')) {
      e.target.closest('.new-message__submit-btn').blur();
    }
  }

  textareaOninput() {
    if (this.textInput.value.length > 0) {
      this.sendBtn.classList.remove('hidden');
      this.recordAudioBtn.classList.add('hidden');
    } else {
      this.sendBtn.classList.add('hidden');
      this.recordAudioBtn.classList.remove('hidden');
    }
    this.textInput.style.height = 'auto';
    this.textInput.style.height = `${this.textInput.scrollHeight}px`;
  }

  emojiOntoggle(e) {
    e.preventDefault();
    if (this.isPickerVisible) {
      this.closeEmojiPicker();
    } else {
      this.picker.style.maxHeight = `${this.msgController.msgContainer.clientHeight}px`;
      this.emojiPickerBox.appendChild(this.picker);
      this.isPickerVisible = true;
      e.target.closest('.new-message__emoji-btn').blur();
      document.addEventListener('click', this.handleDocumentClick.bind(this));
    }
    e.target.closest('.new-message__emoji-btn').blur();
  }

  closeEmojiPicker() {
    while (this.emojiPickerBox.firstChild) {
      this.emojiPickerBox.removeChild(this.emojiPickerBox.firstChild);
    }
    this.isPickerVisible = false;
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  resetForm() {
    this.sendBtn.classList.add('hidden');
    this.recordAudioBtn.classList.remove('hidden');
    this.textInput.style.height = 'auto';
    this.textInput.value = '';
    this.fileList = [];
    this.fileListDom.classList.remove('new-message__file-list--visible');
    while (this.fileListDom.firstChild) {
      this.fileListDom.removeChild(this.fileListDom.firstChild);
    }
    this.form.reset();
  }

  handleTextareaKeyPress(e) {
    const key = e.key;

    if (key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.formOnsubmit(e);
    } else if (key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      this.textInput.value += '\n';
      this.textareaOninput(e);
    }
  }

  handleDocumentClick(e) {
    if (e.target.closest('.new-message__emoji-btn')
      || e.target === this.emojiToggler) {
      return;
    }
    if (this.isPickerVisible
      && !this.emojiPickerBox.contains(e.target)
      && e.target
      !== this.emojiToggler) {
      while (this.emojiPickerBox.firstChild) {
        this.emojiPickerBox.removeChild(this.emojiPickerBox.firstChild);
      }
      this.isPickerVisible = false;
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropzone.classList.remove('hidden');
    this.msgController.msgContainer.classList.add('hidden');
  }

  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropzone.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropzone.classList.remove('drag-over');
  }

  handleDragLeaveWindow(e) {
    if (e.clientY <= 0 || e.clientX <= 0
      || (e.clientX >= window.innerWidth
        || e.clientY >= window.innerHeight)) {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.add('hidden');
      this.msgController.msgContainer.classList.remove('hidden');
      window.removeEventListener('dragleave', this.handleDragLeaveWindow.bind(this));
    }
  }

  handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.target === this.dropzone || this.dropzone.contains(e.target)) {
      this.dropzone.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const dt = new DataTransfer();
      let isMoreThan4Files = false;
      files.forEach((file) => {
        if (this.fileList.length < 4) {
          this.fileList.push(file);
          dt.items.add(file);
        } else {
          isMoreThan4Files = true;
        }
      });
      if (isMoreThan4Files) {
        this.msgController.bot.sendError('Вы можете отправить не более 4 файлов');
      }
      this.fileInput.files = dt.files;
      this.renderFileList();
      this.dropzone.classList.add('hidden');
      this.msgController.msgContainer.classList.remove('hidden');
    } else {
      this.dropzone.classList.add('hidden');
      this.msgController.msgContainer.classList.remove('hidden');
    }
  }

  toggleDisplay() {
    this.fileInputBtn.classList.toggle('hidden');
    this.textInput.classList.toggle('hidden');
    this.emojiToggler.classList.toggle('hidden');
    this.recordAudioBtn.classList.toggle('hidden');
  }

  disable() {
    this.container.classList.remove('fade-in-right');
    this.container.classList.add('new-message--disabled', 'fade-out-right');
  }

  enable() {
    if (!this.container.classList.contains('new-message--disabled')) {
      return;
    }
    this.container.classList.remove('new-message--disabled', 'fade-out-right');
    this.container.classList.add('fade-in-right');
  }
}
