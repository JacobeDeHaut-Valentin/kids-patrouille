import { escapeHtml } from './helpers.js';
import { soundClick } from './audio.js';

export function showModal(options) {
  const {
    title,
    message,
    inputType,
    defaultValue = '',
    onValidate,
    okText = 'Valider',
    cancelText = 'Annuler'
  } = options;

  const background = document.createElement('div');
  background.className = 'modal-bg';

  let inputMode = 'text';

  if (inputType === 'number' || inputType === 'tel') {
    inputMode = 'numeric';
  }

  const maxLength = inputType === 'tel' ? '4' : '40';
  const pattern = inputType === 'tel' ? '[0-9]*' : '';

  const inputHtml = inputType
    ? `<input type="${inputType}" id="modal-input" value="${escapeHtml(defaultValue)}" autofocus inputmode="${inputMode}" maxlength="${maxLength}" pattern="${pattern}"/>`
    : '';

  background.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <div>${message || ''}</div>
      ${inputHtml}
      <div class="modal-error" id="modal-error"></div>
      <div class="modal-buttons">
        <button class="modal-cancel">${cancelText}</button>
        <button class="modal-ok">${okText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(background);

  const input = background.querySelector('#modal-input');
  const errorElement = background.querySelector('#modal-error');

  if (input) {
    setTimeout(() => input.focus(), 50);
  }

  const close = () => background.remove();

  background.querySelector('.modal-cancel').addEventListener('click', () => {
    soundClick();
    close();
  });

  const tryValidate = async () => {
    soundClick();

    const value = input ? input.value : null;

    if (onValidate) {
      const result = await onValidate(value);

      if (result === true) {
        close();
      } else if (typeof result === 'string') {
        errorElement.innerHTML = result;
      }
    } else {
      close();
    }
  };

  background.querySelector('.modal-ok').addEventListener('click', tryValidate);

  if (input) {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') tryValidate();
    });
  }

  return background;
}