/* eslint-disable class-methods-use-this */
export default class UserApi {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async register(username, password) {
    const response = await fetch(`${this.baseURL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.message}`);
    }

    const user = await response.json();
    return user;
  }

  async login(username, password) {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.message}`);
    }

    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthenticatedUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }
}
