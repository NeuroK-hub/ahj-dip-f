export default class MessageApi {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async sendMessage(type, text, file, createdAt) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('created_at', createdAt);

    if (type === 'text') {
      formData.append('text', text);
    } else if (type !== 'text' && file) {
      formData.append('text', text);
      formData.append('file', file);
    } else {
      throw new Error('Invalid message type or missing file');
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error sending message: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteMessage(id) {
    const response = await fetch(`${this.baseURL}/messages/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error deleting message: ${response.statusText}`);
    }

    return response.text();
  }

  async getMessages(page = 1) {
    try {
      const response = await fetch(`${this.baseURL}/messages?page=${page}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error getting messages: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      return false;
    }
  }

  async searchMessages(searchTerm) {
    const response = await fetch(`${this.baseURL}/messages/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error searching messages: ${response.statusText}`);
    }

    return response.json();
  }

  async getMessagesByType(type) {
    if (!type) {
      throw new Error('Message type is required');
    }

    const response = await fetch(`${this.baseURL}/messages/type?type=${encodeURIComponent(type)}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error getting messages by type: ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(filename) {
    const response = await fetch(`${this.baseURL}/files/${filename}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error getting file: ${response.statusText}`);
    }

    return response.blob();
  }

  // тестовые методы

  async getAllMessages() {
    let messages = [];
    const page = 1;

    const loadMessages = async (currentPage) => {
      const newMessages = await this.getMessages(currentPage);

      if (newMessages.length > 0) {
        messages = messages.concat(newMessages);
        return loadMessages(currentPage + 1);
      }
      return messages;
    };

    return loadMessages(page);
  }

  async updateMessageDate(id, newDate) {
    const response = await fetch(`${this.baseURL}/messages/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ created_at: newDate }),
    });

    if (!response.ok) {
      throw new Error(`Error updating message date: ${response.statusText}`);
    }

    return response.text();
  }

  async deleteMessages() {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error deleting messages: ${response.statusText}`);
    }

    return response.text();
  }
}
