import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { changePortalLanguage, ensureLocaleBundle, initI18n, LOCALE_STORAGE_KEY } from '../i18n';

await initI18n();
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
   void changePortalLanguage('pt');
   localStorage.removeItem(LOCALE_STORAGE_KEY);
});
