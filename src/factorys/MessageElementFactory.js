/* eslint-disable class-methods-use-this, no-case-declarations */
import { formatFileSize } from '../utils/messageUtils';

export default class MessageElementFactory {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async createMessageElement(type, text, file, isServerMessage = false) {
    switch (type) {
      case 'text':
        return this.createTextMessageElement(text);
      case 'image':
      case 'video':
      case 'audio':
        return this.createMediaMessageElement(file, type, isServerMessage);
      case 'file':
        return this.createFileMessageElement(file, text, isServerMessage);
      default:
        return null;
    }
  }

  createTextMessageElement(text) {
    const newMessage = document.createElement('div');
    newMessage.classList.add('messages__message', 'messages__message--personal', 'messages__message--text');
    const newMessageText = document.createElement('p');
    newMessageText.classList.add('messages__message-text');
    if (text.includes('http')) {
      newMessageText.innerHTML = text.replace(/(https?:\/\/[^\s]+)/g, '<a class="messages__message-link" href="$1" target="_blank">$1</a>');
    } else {
      newMessageText.textContent = text;
    }
    newMessage.appendChild(newMessageText);
    return newMessage;
  }

  async createMediaMessageElement(file, type, isServerMessage) {
    const newMessage = document.createElement('div');
    newMessage.classList.add('messages__message', 'messages__message--personal', `messages__message--${type}`);
    newMessage.appendChild(await this.createFileElement(file, type, null, isServerMessage));
    return newMessage;
  }

  async createFileMessageElement(file, fileName, isServerMessage) {
    const newMessage = document.createElement('div');
    newMessage.classList.add('messages__message', 'messages__message--personal', 'messages__message--file');
    newMessage.appendChild(await this.createFileElement(file, 'file', fileName, isServerMessage));
    return newMessage;
  }

  async createFileElement(file, type, fileName, isServerMessage) {
    let fileElement;
    const fileUrl = `${this.baseURL}/files/`;
    switch (type) {
      case 'image':
        const imageElement = document.createElement('img');
        imageElement.classList.add('messages__message-image');
        if (isServerMessage) {
          imageElement.src = fileUrl + file;
        } else {
          imageElement.src = URL.createObjectURL(file);
        }
        await new Promise((resolve) => {
          imageElement.onload = () => resolve();
        });
        fileElement = imageElement;
        break;
      case 'video':
        const videoElement = document.createElement('video');
        videoElement.classList.add('messages__message-video');
        if (isServerMessage) {
          videoElement.src = fileUrl + file;
        } else {
          videoElement.src = URL.createObjectURL(file);
        }
        videoElement.controls = true;
        await new Promise((resolve) => {
          videoElement.onloadeddata = () => resolve();
        });
        fileElement = videoElement;
        break;
      case 'audio':
        const audioElement = document.createElement('audio');
        audioElement.classList.add('messages__message-audio');
        if (isServerMessage) {
          audioElement.src = fileUrl + file;
        } else {
          audioElement.src = URL.createObjectURL(file);
        }
        audioElement.controls = true;
        await new Promise((resolve) => {
          audioElement.onloadeddata = () => resolve();
        });
        fileElement = audioElement;
        break;
      default:
        const linkToFile = document.createElement('a');
        linkToFile.classList.add('messages__message-link');
        if (isServerMessage) {
          linkToFile.href = fileUrl + file;
          linkToFile.textContent = fileName;
        } else {
          linkToFile.href = URL.createObjectURL(file);
          linkToFile.textContent = `${file.name} (${formatFileSize(file.size)})`;
        }

        linkToFile.download = '';
        fileElement = linkToFile;
        break;
    }
    return fileElement;
  }

  createMessageLoader() {
    const newMessageLoader = document.createElement('div');
    newMessageLoader.classList.add(
      'messages__message',
      'messages__message--new',
      'messages__message--loading',
    );
    const messageText = document.createElement('span');
    newMessageLoader.appendChild(messageText);
    return newMessageLoader;
  }

  createBotMessage(text, error = false) {
    const newMessage = document.createElement('div');
    newMessage.classList.add('messages__message');
    const newMessageText = document.createElement('p');
    newMessageText.classList.add('messages__message-text');
    if (error) {
      newMessageText.classList.add('messages__message-text--error');
    }
    newMessageText.textContent = text;
    newMessage.appendChild(newMessageText);
    return newMessage;
  }
}
