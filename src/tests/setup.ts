import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import i18n, { ensureLocaleBundle, LOCALE_STORAGE_KEY } from '../i18n';

await ensureLocaleBundle('pt');
await ensureLocaleBundle('en');
await ensureLocaleBundle('es');

if (!HTMLDialogElement.prototype.showModal) {
   HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
   };
}

if (!HTMLDialogElement.prototype.close) {
   HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
   };
}

Object.defineProperty(HTMLDialogElement.prototype, 'open', {
   get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
   },
   configurable: true,
});

afterEach(() => {
   cleanup();
   void i18n.changeLanguage('pt');
   localStorage.removeItem(LOCALE_STORAGE_KEY);
});
