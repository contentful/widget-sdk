import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import ManageCookieConsentSection from './ManageCookieConsentSection';
import { openConsentManagementPanel } from 'services/OsanoService';

jest.mock('services/OsanoService', () => ({
  openConsentManagementPanel: jest.fn(),
  waitForCMInstance: jest.fn().mockResolvedValue(),
}));

describe('ManageCookieConsentSection', () => {
  const build = () => {
    return render(<ManageCookieConsentSection />);
  };

  describe('renders correctly', () => {
    it('should show a CTA to resend email if both email is not confirmed and password is not set', async () => {
      build();
      await wait();

      expect(screen.getByTestId('manage-cookie-consent.header')).toHaveTextContent('Privacy');
      expect(screen.getByTestId('manage-cookie-consent.subheader')).toHaveTextContent(
        'Cookie Consent'
      );
      expect(screen.getByTestId('manage-cookie-consent.section')).toHaveTextContent(
        'Manage consent'
      );
    });
  });

  describe('Osano Cookie Consent Manager', () => {
    it('should trigger Osano Cookie Consent Manager when "Manage consent" is clicked', async () => {
      build();
      await wait();

      screen.getByTestId('manage-cookie-consent.button').click();

      expect(openConsentManagementPanel).toHaveBeenCalled();
    });
  });
});
