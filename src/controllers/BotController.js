import MessageElementFactory from '../factorys/MessageElementFactory';

export default class BotController {
  constructor() {
    this.elementFactory = new MessageElementFactory();
  }

  init(container) {
    //  const loader = this.elementFactory.createMessageLoader();
    //    this.msgContainer.insertMessageElement(loader);
    //    setTimeout(() => {
    //      loader.remove();
    //      const newMessage = this.elementFactory.createBotMessage('');
    //      this.msgContainer.insertMessageElement(newMessage);
    //    },1000 + (Math.random() * 20) * 100);
    this.msgContainer = container;
  }

  sendError(error) {
    const loader = this.elementFactory.createMessageLoader();
    this.msgContainer.insertMessageElement(loader);
    const newMessage = this.elementFactory.createBotMessage(error);
    setTimeout(() => {
      loader.remove();
      newMessage.classList.add('messages__message--error');
      this.msgContainer.insertMessageElement(newMessage);
    }, 1000);
    setTimeout(() => {
      newMessage.remove();
    }, 10000);
  }

  sendMessage(message) {
    const loader = this.elementFactory.createMessageLoader();
    this.msgContainer.insertMessageElement(loader);
    const newMessage = this.elementFactory.createBotMessage(message);
    setTimeout(() => {
      loader.parentNode.replaceChild(newMessage, loader);
    }, 1000 + (Math.random() * 20) * 100);
  }
}
