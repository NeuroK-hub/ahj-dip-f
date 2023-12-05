export default class SearchController {
  constructor(messageApi, msgController, newMsgController) {
    this.messageApi = messageApi;
    this.msgController = msgController;
    this.newMsgController = newMsgController;
    this.isSearchContainer = false;

    this.searchButton = document.querySelector('.chat__search-btn');
    this.searchInput = document.querySelector('.chat__search-input');
    this.sortButton = document.querySelector('.chat__sort-btn');
    this.sortList = document.querySelector('.sort-list');
    this.sortListButtons = document.querySelectorAll('.sort-list__btn');

    this.handleInput = this.handleInput.bind(this);
  }

  bindEventListener() {
    this.searchButton.addEventListener('click', this.handleSearch.bind(this));
    this.sortButton.addEventListener('click', this.handleSortList.bind(this));
    this.sortListButtons.forEach((button) => {
      button.addEventListener('click', this.handelSortItemClick.bind(this));
    });
  }

  handleSortList() {
    if (!this.searchInput.classList.contains('hidden')) {
      this.searchInput.value = '';
      this.searchInput.classList.add('hidden');
    }
    if (this.isSearchContainer) {
      this.msgController.switchContainerTo('main');
      this.isSearchContainer = false;
      this.newMsgController.enable();
    } else if (this.sortList.classList.contains('sort-list--enable')) {
      this.sortListDisable();
    } else {
      this.sortListEnable();
      document.addEventListener('click', this.handleDocumentClick.bind(this));
      document.addEventListener('keydown', this.handleDocumentKeyDown.bind(this));
    }
    this.sortButton.blur();
  }

  handleDocumentClick(e) {
    const button = e.target.closest('button');
    if (button && !button.classList.contains('chat__sort-btn')) {
      this.sortListDisable();
    }
  }

  handleDocumentKeyDown(e) {
    if (e.key === 'Enter' && e.target.nodeName === 'BUTTON' && !e.target.classList.contains('chat__sort-btn')) {
      this.sortListDisable();
    }
  }

  handelSortItemClick(e) {
    const button = e.target.closest('.sort-list__btn');
    const sortType = button.dataset.sortType;
    this.msgController.switchContainerTo('search');
    this.isSearchContainer = true;
    this.messageApi.getMessagesByType(sortType).then(async (messages) => {
      this.msgController.searchContainer.messages = messages;
      await this.msgController.renderMessages();
      if (messages.length === 0) {
        this.msgController.bot.sendMessage('Ничего не найдено');
      }
      this.newMsgController.disable();
    });
  }

  handleSearch() {
    if (this.sortList.classList.contains('sort-list--enable')) {
      this.sortListDisable();
    }
    this.searchInput.classList.toggle('hidden');
    this.msgController.updateScrollbar();

    if (!this.searchInput.classList.contains('hidden')) {
      this.searchInput.focus();
    } else {
      this.searchInput.value = '';
      this.msgController.switchContainerTo('main');
      this.newMsgController.enable();
    }
    this.searchInput.addEventListener('input', this.handleInput);
    this.searchButton.blur();
  }

  handleInput() {
    this.msgController.searchContainer.innerHTML = '';
    if (this.searchInput.value === '') {
      this.msgController.switchContainerTo('main');
      this.isSearchContainer = false;
      this.newMsgController.enable();
      return;
    }
    this.msgController.switchContainerTo('search');
    this.isSearchContainer = true;
    this.messageApi.searchMessages(this.searchInput.value).then(async (messages) => {
      this.msgController.searchContainer.messages = messages;
      await this.msgController.renderMessages();
      if (messages.length === 0) {
        this.msgController.bot.sendMessage('Ничего не найдено');
      }
      this.newMsgController.disable();
    });
  }

  sortListEnable() {
    this.sortList.classList.remove('sort-list--disabled', 'fade-out-left');
    this.sortList.classList.add('fade-in-left', 'sort-list--enable');
  }

  sortListDisable() {
    this.sortList.classList.remove('fade-in-left', 'sort-list--enable');
    this.sortList.classList.add('fade-out-left', 'sort-list--disabled');
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener('keydown', this.handleDocumentKeyDown.bind(this));
  }
}
