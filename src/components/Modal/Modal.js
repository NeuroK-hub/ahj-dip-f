class Modal {
  constructor(container) {
    this.container = container;
    this.modalContent = this.container.querySelector('.modal__content');
    this.loginButton = this.container.querySelector('.modal__login');
    this.registerButton = this.container.querySelector('.modal__reg');
    this.form = this.container.querySelector('.modal__form');
    this.usernameInput = this.container.querySelector('.modal__user-input');
    this.passwordInput = this.container.querySelector('.modal__pass-input');
    this.errorContainer = document.createElement('div');
    this.errorContainer.classList.add('modal__error');
    this.form.appendChild(this.errorContainer);
    this.bindEventListeners();
  }

  bindEventListeners() {
    this.loginButton.addEventListener('click', (event) => this.handleLogin(event));
    this.registerButton.addEventListener('click', (event) => this.handleRegister(event));
    this.usernameInput.addEventListener('input', () => this.hideError());
    this.passwordInput.addEventListener('input', () => this.hideError());
  }

  show() {
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
  }

  hide() {
    this.container.style.visibility = 'hidden';
    this.container.style.opacity = '0';
  }

  showError(message) {
    this.errorContainer.innerText = message;
    this.errorContainer.style.display = 'block';
  }

  hideError() {
    this.usernameInput.classList.remove('modal__input_error');
    this.passwordInput.classList.remove('modal__input_error');
    this.errorContainer.style.display = 'none';
  }

  handleError(error) {
    if (error.name === 'TypeError') {
      this.showError('Не удалось выполнить операцию. Пожалуйста, проверьте свое интернет-соединение и попробуйте снова.');
    } else {
      this.showError(error.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    const username = this.usernameInput.value;
    const password = this.passwordInput.value;
    if (!this.validateForm(username, password)) return;

    try {
      await this.login(username, password);
      this.hideError();
      this.form.reset();
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleRegister(event) {
    event.preventDefault();
    const username = this.usernameInput.value;
    const password = this.passwordInput.value;
    if (!this.validateForm(username, password)) return;
    try {
      await this.register(username, password);
      this.hideError();
      this.form.reset();
    } catch (error) {
      this.handleError(error);
    }
  }

  setLoginHandler(handler) {
    this.login = handler;
  }

  setRegisterHandler(handler) {
    this.register = handler;
  }

  validateUsername(username) {
    if (username.length < 2) {
      this.showError('Имя пользователя должно быть не короче 2 символов');
      this.usernameInput.classList.add('modal__input_error');
      this.usernameInput.focus();
    } else if (username.length > 30) {
      this.showError('Имя пользователя должно быть не длиннее 30 символов');
      this.usernameInput.classList.add('modal__input_error');
      this.usernameInput.focus();
    }
  }

  validatePassword(password) {
    if (password.length < 4) {
      this.showError('Пароль должен быть не короче 8 символов');
      this.passwordInput.classList.add('modal__input_error');
      this.passwordInput.focus();
    } else if (password.length > 30) {
      this.showError('Пароль должен быть не длиннее 30 символов');
      this.passwordInput.classList.add('modal__input_error');
      this.passwordInput.focus();
    }
  }

  validateForm(username, password) {
    if (username.length < 2 || username.length > 30) {
      this.validateUsername(username);
      return false;
    } if (password.length < 4 || password.length > 30) {
      this.validatePassword(password);
      return false;
    }
    return true;
  }
}

export default Modal;
