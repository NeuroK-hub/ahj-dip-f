/* eslint-disable camelcase , class-methods-use-this */
import MessageElementFactory from '../factorys/MessageElementFactory';
import {
  formatFileSize, getDateElement, updateScrollbar, addPaddingToLastLine,
} from '../utils/messageUtils';

export default class MsgController {
  constructor(container, sContainer, messageApi, bot) {
    this.msgContainer = container;
    this.searchContainer = sContainer;
    this.currentContainer = this.msgContainer;
    this.msgContainer.dataset.page = 1;
    this.msgContainer.messages = [];
    this.searchContainer.messages = [];
    this.messageApi = messageApi;
    this.bot = bot;
    this.elementFactory = new MessageElementFactory(this.messageApi.baseURL);
    this.currentPage = 1;
    this.scrollTimeout = null;
    this.isUserScroll = true;
    this.loader = document.querySelector('.loader');
    this.bindEventListener();
  }

  bindEventListener() {
    this.msgContainer.addEventListener('scroll', this.handleScroll.bind(this));
    this.msgContainer.addEventListener('click', this.handleDeleteClick.bind(this));
    this.searchContainer.addEventListener('click', this.handleDeleteClick.bind(this));
  }

  async init() {
    this.bot.init(this);
    const response = await this.messageApi.getMessages();
    if (!response) {
      this.hideLoader();
      this.bot.sendMessage('Не могу соединиться с сервером. Проверьте соединение с интернетом и попробуйте еще раз');
      return;
    }
    response.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    this.currentContainer.messages = response;
    await this.renderMessages();
  }

  handleScroll() {
    if (!this.isUserScroll) {
      this.isUserScroll = true;
      return;
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      if (this.msgContainer.scrollTop === 0) {
        this.isUserScroll = false;
        this.loadMoreMessages();
      }
    }, 300);
  }

  insertMessage({ text = '', files }) {
    if (text === '' && !files) {
      return false;
    }
    if (text !== '') {
      this.sendMessageAndRender({ type: 'text', text, created_at: new Date().toISOString() });
    }
    if (files) {
      this.processFiles(files);
    }
    return true;
  }

  processFiles(files) {
    files.forEach((file) => {
      if (file.size > 10000000) {
        this.bot.sendError('Размер файла не должен превышать 10 Мб');
        return;
      }
      let fileName = file.name;
      const typeMapper = {
        image: 'image',
        video: 'video',
        audio: 'audio',
      };
      const fileType = file.type.split('/')[0];
      const type = typeMapper[fileType] || 'file';

      if (type === 'file') fileName = `${file.name} (${formatFileSize(file.size)})`;

      const message = {
        type, text: fileName, file, created_at: new Date().toISOString(),
      };
      this.sendMessageAndRender(message);
    });
  }

  async sendMessageAndRender({
    type, text, file, created_at,
  }) {
    const data = await this.messageApi.sendMessage(type, text, file, created_at);
    const message = {
      type,
      text,
      file,
      created_at,
      id: data.id,
      isServerMessage: false,
    };

    const index = this.findMessageIndexByDate(message.created_at);
    this.msgContainer.messages.splice(index, 0, message);
    const referenceNode = index > 0 ? this.msgContainer.messages[index - 1].dom : null;
    this.renderMessage(message, this.msgContainer.messages, referenceNode);
  }

  async renderMessages() {
    this.changeContainerVisibility(false);
    this.showLoader();
    this.currentContainer.innerHTML = '';

    const promises = this.currentContainer.messages.map((message) => this.renderMessage(message));
    await Promise.all(promises);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.hideLoader();
        this.changeContainerVisibility(true);
        resolve();
      }, 250);
    });
  }

  async renderMessage(message, referenceNode = null) {
    const {
      type, text, file, created_at, id, isServerMessage = true,
    } = message;
    const messageElement = await this.elementFactory.createMessageElement(
      type,
      text,
      file,
      isServerMessage,
    );

    if (messageElement) {
      const deleteBtn = this.createDeleteButton(id);
      messageElement.appendChild(deleteBtn);

      const dateElement = this.createDateElement(created_at, type);
      messageElement.append(dateElement);
      this.insertMessageElement(messageElement, referenceNode);

      const messageIndex = this.currentContainer.messages.indexOf(message);
      if (messageIndex !== -1) {
        this.currentContainer.messages[messageIndex].dom = messageElement;
      }

      if (type === 'text' || type === 'file') {
        addPaddingToLastLine(messageElement);
      }
    }
    this.redrawDateSeparators();
    this.updateScrollbar();
  }

  createDeleteButton(id) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('messages__message-delete');
    deleteBtn.setAttribute('tabindex', '-1');
    deleteBtn.dataset.messageId = id;
    return deleteBtn;
  }

  handleDeleteClick(event) {
    if (event.target.classList.contains('messages__message-delete')) {
      const messageId = event.target.dataset.messageId;
      const messageElement = event.target.closest('.messages__message');
      messageElement.remove();
      this.msgContainer.messages.splice(this.msgContainer.messages.indexOf(messageElement), 1);
      this.searchContainer.messages.splice(
        this.searchContainer.messages.indexOf(messageElement),
        1,
      );
      this.messageApi.deleteMessage(messageId);
      this.redrawDateSeparators();
    }
  }

  createDateElement(dateString, messageType) {
    const dateElement = getDateElement(dateString);
    dateElement.classList.add('message__timestamp', `message__timestamp--${messageType}`);
    return dateElement;
  }

  insertMessageElement(messageElement, referenceNode) {
    if (referenceNode) {
      this.currentContainer.insertBefore(messageElement, referenceNode.nextSibling);
    } else {
      this.currentContainer.appendChild(messageElement);
    }
    this.updateScrollbar();
  }

  renderDateSeparator(date) {
    const separator = document.createElement('div');
    separator.classList.add('messages__date-separator');
    separator.innerText = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    return separator;
  }

  async loadMoreMessages() {
    const newMessages = await this.messageApi.getMessages(this.currentPage + 1);
    if (newMessages.length > 0) {
      this.changeContainerVisibility(false);
      this.showLoader();
      const prevScrollHeight = this.msgContainer.scrollHeight;
      const clientHeight = this.msgContainer.clientHeight;
      this.currentPage += 1;

      const renderPromises = newMessages.map((message, index) => this.renderMessage(
        message,
        this.msgContainer.children[index],
      ));
      await Promise.all(renderPromises);

      this.msgContainer.messages = newMessages.concat(this.msgContainer.messages);

      const scrollDifference = this.msgContainer.scrollHeight - prevScrollHeight;
      this.msgContainer.scrollBy(0, scrollDifference - clientHeight / 2);
      setTimeout(() => {
        this.hideLoader();
        this.changeContainerVisibility(true);
      }, 250);
    }
  }

  clearDom() {
    while (this.msgContainer.firstChild) {
      this.msgContainer.removeChild(this.msgContainer.firstChild);
    }
  }

  findMessageIndexByDate(date) {
    for (let i = 0; i < this.currentContainer.messages.length; i += 1) {
      if (new Date(this.currentContainer.messages[i].created_at) > new Date(date)) {
        return i;
      }
    }
    return this.currentContainer.messages.length;
  }

  redrawDateSeparators() {
    const separators = this.currentContainer.querySelectorAll('.messages__date-separator');
    separators.forEach((separator) => {
      separator.remove();
    });
    this.currentContainer.messages.forEach((message, i) => {
      let lastMessageDate = this.currentContainer.messages[i - 1]
        ? new Date(this.currentContainer.messages[i - 1].created_at)
        : null;
      if (lastMessageDate) {
        lastMessageDate.setHours(0, 0, 0, 0);
      }
      const currentMessageDate = new Date(message.created_at);
      currentMessageDate.setHours(0, 0, 0, 0);
      if (lastMessageDate && lastMessageDate.getTime() !== currentMessageDate.getTime()) {
        const separator = this.renderDateSeparator(currentMessageDate);
        if (message.dom && message.dom.parentNode === this.currentContainer) {
          this.currentContainer.insertBefore(separator, message.dom);
        }
        lastMessageDate = currentMessageDate;
      } else if (!lastMessageDate) {
        const separator = this.renderDateSeparator(currentMessageDate);
        if (message.dom && message.dom.parentNode === this.currentContainer) {
          this.currentContainer.insertBefore(separator, message.dom);
        }
        lastMessageDate = currentMessageDate;
      }
    });
  }

  getNewDateSeparator(message, previousMessage) {
    const { created_at } = message;
    const messageDate = new Date(created_at);
    messageDate.setHours(0, 0, 0, 0);

    if (previousMessage) {
      const lastMessageDate = new Date(previousMessage.created_at);
      lastMessageDate.setHours(0, 0, 0, 0);

      if (messageDate.getTime() !== lastMessageDate.getTime()) {
        return this.renderDateSeparator(messageDate);
      }
    }

    return null;
  }

  async switchContainerTo(container) {
    if (container === 'main') {
      this.currentContainer = this.msgContainer;
      this.msgContainer.classList.remove('hidden');
      this.searchContainer.classList.add('hidden');
    } else if (container === 'search') {
      this.currentContainer = this.searchContainer;
      this.msgContainer.classList.add('hidden');
      this.searchContainer.classList.remove('hidden');
    }
    this.updateScrollbar();
  }

  showLoader() {
    this.loader.style.display = 'block';
  }

  hideLoader() {
    this.loader.style.display = 'none';
  }

  changeContainerVisibility(visible) {
    this.currentContainer.style.opacity = visible ? 1 : 0;
  }

  updateScrollbar() {
    updateScrollbar(this.currentContainer);
  }
}
