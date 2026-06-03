import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { AboutPage } from '../../pages/AboutPage';
import { TestProviders } from '../TestProviders';

function renderAbout() {
   return render(
      <TestProviders>
         <AboutPage />
      </TestProviders>,
   );
}

describe('AboutPage', () => {
   it('renders name as main heading', () => {
      renderAbout();
      expect(screen.getByRole('heading', { level: 1, name: 'Vinicius Rossi' })).toBeInTheDocument();
   });

   it('renders portrait with accessible alt text', () => {
      renderAbout();
      expect(screen.getByRole('img', { name: i18n.t('about.portraitAlt') })).toHaveAttribute(
         'src',
         `${import.meta.env.BASE_URL}about/portrait.png`,
      );
   });

   it('renders mailto and external social links', () => {
      renderAbout();
      expect(screen.getByRole('link', { name: /Email/i })).toHaveAttribute(
         'href',
         'mailto:viniciusprossi18@gmail.com',
      );
      expect(screen.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute(
         'href',
         'https://www.linkedin.com/in/vinicius-pimenta-rossi/',
      );
      expect(screen.getByRole('link', { name: /WhatsApp/i })).toHaveAttribute(
         'href',
         'https://wa.me/5534992150307',
      );
      expect(screen.getByText('(34) 99215-0307')).toBeInTheDocument();
   });
});
