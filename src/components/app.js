import NewMsgController from '../controllers/NewMsgController';
import picker from '../widgets/emojiWidget';
import MsgController from '../controllers/MsgController';
import UserApi from '../api/UserApi';
import Modal from './Modal/Modal';
import MessageApi from '../api/MessageApi';
import SearchController from '../controllers/SearchController';
import BotController from '../controllers/BotController';

document.addEventListener('DOMContentLoaded', () => {
  const baseURL = 'https://chaos-chat.onrender.com';
  const userApi = new UserApi(baseURL);
  const modal = document.querySelector('.modal');
  const chat = document.querySelector('.chat');
  const authModal = new Modal(modal);
  const logoutButton = document.querySelector('.chat__logout-btn');
  logoutButton.addEventListener('click', () => {
    userApi.logout();
    chat.classList.add('hidden');
    authModal.show();
  });

  // Создаем экземпляр класса Modal

  // Устанавливаем обработчики входа и регистрации
  authModal.setLoginHandler(async (username, password) => {
    const { token } = await userApi.login(username, password);
    // Инициализация MessageApi с токеном
    const messageApi = new MessageApi(baseURL, token);
    window.messageApi = messageApi;

    const msgContainer = document.querySelector('.chat__messages');
    const sContainer = document.querySelector('.chat__searched-messages');
    const newMessagePanel = document.querySelector('.new-message');
    const botController = new BotController();
    const msgController = new MsgController(msgContainer, sContainer, messageApi, botController);
    msgController.init().then(() => {
      const newMsgCtrlPanel = new NewMsgController(newMessagePanel, picker, msgController);
      newMsgCtrlPanel.bindEventListener();

      const searchController = new SearchController(messageApi, msgController, newMsgCtrlPanel);
      searchController.bindEventListener();
    });
    chat.classList.remove('chat--hidden');
    authModal.hide();
  });

  authModal.setRegisterHandler(async (username, password) => {
    await userApi.register(username, password);
    await authModal.login(username, password);
    chat.classList.remove('hidden');
  });

  // Отображаем модальное окно, если пользователь не вошел в систему
  if (!userApi.getToken()) {
    authModal.show();
  } else {
    const token = userApi.getToken();
    const messageApi = new MessageApi(baseURL, token);
    window.messageApi = messageApi;

    const msgContainer = document.querySelector('.chat__messages');
    const sContainer = document.querySelector('.chat__searched-messages');
    const newMessagePanel = document.querySelector('.new-message');
    const botController = new BotController();
    const msgController = new MsgController(msgContainer, sContainer, messageApi, botController);
    msgController.init().then(() => {
      const newMsgCtrlPanel = new NewMsgController(
        newMessagePanel,
        picker,
        msgController,
        botController,
      );
      newMsgCtrlPanel.bindEventListener();

      const searchController = new SearchController(messageApi, msgController, newMsgCtrlPanel);
      searchController.bindEventListener();

      chat.classList.remove('chat--hidden');
    });
  }
});
