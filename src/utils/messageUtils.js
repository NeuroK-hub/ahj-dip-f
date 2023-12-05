/* eslint-disable no-param-reassign */
export function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  } if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function removeStyledInvisibleChar(element) {
  const invisibleCharSpan = element.querySelector('.invisible-char');
  if (invisibleCharSpan) {
    element.removeChild(invisibleCharSpan);
  }
}

export function getDateElement(createdAt) {
  const d = new Date(createdAt);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timestamp = document.createElement('time');
  timestamp.setAttribute('datetime', d.toISOString());
  timestamp.textContent = `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
  return timestamp;
}
export function addStyledInvisibleChar(element, paddingSize) {
  if (element.querySelector('span')) {
    return;
  }
  const invisibleChar = String.fromCharCode(8203);
  const paddingRight = `${paddingSize}px`;
  const styledInvisibleChar = `<span class='invisible-char' style="display: inline-block; width: ${paddingRight};">${invisibleChar}</span>`;
  element.insertAdjacentHTML('beforeend', styledInvisibleChar);
}

export function updateScrollbar(element) {
  element.scrollTop = element.scrollHeight;
}

function countLines(element) {
  const originalWidth = element.style.width;
  element.style.width = '100%';
  element.style.display = 'inline-block';

  const computedStyle = window.getComputedStyle(element);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
  const height = element.scrollHeight - padding;

  element.style.width = originalWidth;
  element.style.display = '';

  const lines = Math.ceil(height / lineHeight);
  return lines;
}

function getCharCoords(element) {
  const textNodes = Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE);

  const charCoords = [];

  textNodes.forEach((textNode) => {
    for (let i = 0; i < textNode.textContent.length; i += 1) {
      const range = document.createRange();
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);

      const boundingClientRect = range.getBoundingClientRect();
      charCoords.push({
        x: boundingClientRect.left,
        y: boundingClientRect.top,
      });
    }
  });

  return charCoords;
}

function getLastLineWidth(p) {
  const charCoords = getCharCoords(p);

  const lastLineChars = [];
  let currentY = null;

  for (const coord of charCoords) {
    if (currentY === null || coord.y === currentY) {
      currentY = coord.y;
      lastLineChars.push(coord);
    } else if (coord.y > currentY) {
      currentY = coord.y;
      lastLineChars.length = 0;
      lastLineChars.push(coord);
    }
  }

  const lastLineWidth = lastLineChars.length > 1
    ? lastLineChars[lastLineChars.length - 1].x - lastLineChars[0].x
    : 0;

  return lastLineWidth;
}

function processElement(element, messageElement) {
  removeStyledInvisibleChar(element);

  const lastLineWidth = getLastLineWidth(element);
  const width = element.offsetWidth;
  const paddingSize = 30;

  if (countLines(element) === 1) {
    addStyledInvisibleChar(element, paddingSize);
    messageElement.style.maxWidth = '100%';
  } else if (width - lastLineWidth < paddingSize) {
    const addWidthSize = width - lastLineWidth;
    messageElement.style.width = `${messageElement.offsetWidth + addWidthSize}px`;
    messageElement.style.maxWidth = '100%';
  }
}

export function addPaddingToLastLine(messageElement) {
  messageElement.style.width = 'auto';
  messageElement.style.maxWidth = '75%';

  const isTextMessage = messageElement.classList.contains('messages__message--text');
  const isFileMessage = messageElement.classList.contains('messages__message--file');

  if (isTextMessage) {
    const p = messageElement.querySelector('.messages__message-text');
    processElement(p, messageElement);
  } else if (isFileMessage) {
    const link = messageElement.querySelector('.messages__message-link');
    processElement(link, messageElement);
  }
}

export function addPaddingToLastLineAll() {
  const textMessages = document.querySelectorAll('.messages__message--text, .messages__message--file');
  textMessages.forEach((message) => {
    addPaddingToLastLine(message);
  });
}

window.addEventListener('resize', addPaddingToLastLineAll);
