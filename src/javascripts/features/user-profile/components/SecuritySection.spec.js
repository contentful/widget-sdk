import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { Notification, ModalLauncher } from '@contentful/forma-36-react-components';
import { window } from 'core/services/window';

import { getUserTotp } from 'app/UserProfile/Settings/AccountRepository';
import { SecuritySection } from './SecuritySection';

jest.mock('core/services/window', () => {
  const locationMock = jest.fn();

  return {
    window: {
      set location(path) {
        return locationMock(path);
      },
      get location() {
        return {};
      },
      __locationMock: locationMock,
    },
  };
});

jest.mock('app/UserProfile/Settings/AccountRepository', () => ({
  getUserTotp: jest.fn(),
  deleteUserTotp: jest.fn(),
}));

describe('SecuritySection', () => {
  const build = (custom) => {
    const props = Object.assign(
      {
        onAddPassword: () => {},
        onEnable2FA: () => {},
        onDisable2FA: () => {},
      },
      custom
    );

    return render(<SecuritySection {...props} />);
  };

  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    ModalLauncher.open.mockReset();
  });

  describe('not eligible', () => {
    it('should show a CTA to resend email if both email is not confirmed and password is not set', () => {
      const user = {
        confirmed: false,
        passwordSet: false,
      };

      const { queryByTestId } = build({ user });

      expect(queryByTestId('resend-email-cta')).toBeVisible();
    });

    it('should show a CTA to resend email if user email is not confirmed', () => {
      const user = {
        confirmed: false,
        passwordSet: true,
      };

      const { queryByTestId } = build({ user });

      expect(queryByTestId('resend-email-cta')).toBeVisible();
    });

    it('should set $window.url when clicking on the resend email CTA', () => {
      const user = {
        confirmed: false,
        passwordSet: true,
      };

      const { queryByTestId } = build({ user });

      fireEvent.click(queryByTestId('resend-email-cta'));

      expect(window.__locationMock).toHaveBeenCalled();
    });

    it('should show a CTA to add a password if user has no password set but has confirmed email', () => {
      const user = {
        confirmed: true,
        passwordSet: false,
      };

      const { queryByTestId } = build({ user });

      expect(queryByTestId('add-password-cta')).toBeVisible();
    });

    it('should not call onAddPassword if ChangePasswordModal resolves false', async () => {
      ModalLauncher.open.mockResolvedValueOnce(false);

      const onAddPassword = jest.fn();
      const user = {
        confirmed: true,
        passwordSet: false,
      };

      const { queryByTestId } = build({ user, onAddPassword });

      fireEvent.click(queryByTestId('add-password-cta'));

      await wait();

      expect(onAddPassword).not.toHaveBeenCalled();
    });

    it('should call onAddPassword if ChangePasswordModal resolves with data', async () => {
      ModalLauncher.open.mockResolvedValueOnce({});

      const onAddPassword = jest.fn();
      const user = {
        confirmed: true,
        passwordSet: false,
      };

      const { queryByTestId } = build({ user, onAddPassword });

      fireEvent.click(queryByTestId('add-password-cta'));

      await wait();

      expect(onAddPassword).toHaveBeenCalled();
    });
  });

  describe('eligible', () => {
    it('should show a CTA to enable 2FA', () => {
      const user = {
        mfaEligible: true,
        mfaEnabled: false,
      };

      const { queryByTestId } = build({ user });

      expect(queryByTestId('enable-2fa-cta')).toBeVisible();
    });

    it('should request TOTP data before opening the modal', async () => {
      const user = {
        mfaEligible: true,
        mfaEnabled: false,
      };

      const { queryByTestId } = build({ user });

      expect(getUserTotp).not.toHaveBeenCalled();
      expect(ModalLauncher.open).not.toHaveBeenCalled();

      fireEvent.click(queryByTestId('enable-2fa-cta'));

      await wait();

      expect(getUserTotp).toHaveBeenCalled();
      expect(ModalLauncher.open).toHaveBeenCalled();
    });

    it('should show a notification if the TOTP data request fails', async () => {
      const notificationErrorSpy = jest
        .spyOn(Notification, 'error')
        .mockImplementationOnce(() => {});
      getUserTotp.mockRejectedValueOnce();

      const user = {
        mfaEligible: true,
        mfaEnabled: false,
      };

      const { queryByTestId } = build({ user });

      fireEvent.click(queryByTestId('enable-2fa-cta'));

      await wait();

      expect(notificationErrorSpy).toHaveBeenCalled();

      notificationErrorSpy.mockRestore();
    });

    it('should not call onEnable2FA if the modal resolves false', async () => {
      ModalLauncher.open.mockResolvedValueOnce(false);

      const onEnable2FA = jest.fn();
      const user = {
        mfaEligible: true,
        mfaEnabled: false,
      };

      const { queryByTestId } = build({ user, onEnable2FA });

      fireEvent.click(queryByTestId('enable-2fa-cta'));

      await wait();

      expect(onEnable2FA).not.toHaveBeenCalled();
    });

    it('should call onEnable2FA if the modal resolves true', async () => {
      ModalLauncher.open.mockResolvedValueOnce(true);

      const onEnable2FA = jest.fn();
      const user = {
        mfaEligible: true,
        mfaEnabled: false,
      };

      const { queryByTestId } = build({ user, onEnable2FA });

      fireEvent.click(queryByTestId('enable-2fa-cta'));

      await wait();

      expect(onEnable2FA).toHaveBeenCalled();
    });
  });

  describe('enabled', () => {
    it('should show a CTA to disable 2FA', () => {
      const user = {
        mfaEligible: true,
        mfaEnabled: true,
      };

      const { queryByTestId } = build({ user });

      expect(queryByTestId('delete-2fa-cta')).toBeVisible();
    });

    it('should not disable if the Disable2FA modal resolves false', async () => {
      ModalLauncher.open.mockResolvedValueOnce(false);

      const onDisable2FA = jest.fn();
      const user = {
        mfaEligible: true,
        mfaEnabled: true,
      };

      const { queryByTestId } = build({ user, onDisable2FA });

      fireEvent.click(queryByTestId('delete-2fa-cta'));

      await wait();

      expect(onDisable2FA).not.toHaveBeenCalled();
    });

    it('should disable if the Disable2FA modal resolves true', async () => {
      ModalLauncher.open.mockResolvedValueOnce(true);

      const onDisable2FA = jest.fn();
      const user = {
        mfaEligible: true,
        mfaEnabled: true,
      };

      const { queryByTestId } = build({ user, onDisable2FA });

      fireEvent.click(queryByTestId('delete-2fa-cta'));

      await wait();

      expect(onDisable2FA).toHaveBeenCalled();
    });
  });
});
