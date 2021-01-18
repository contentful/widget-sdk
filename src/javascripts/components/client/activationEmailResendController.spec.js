import * as K from '__mocks__/kefirMock';
import _ from 'lodash';
import moment from 'moment';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { initActivationEmailResend } from './activationEmailResendController';
import * as TokenStore from 'services/TokenStore';
import * as ActivationEmailResendDialog from 'components/client/ActivationEmailResendDialog';
import * as ActivationEmailResender from 'components/client/activationEmailResender';
import { waitFor } from '@testing-library/dom';

jest.mock('services/TokenStore');
jest.mock('components/client/ActivationEmailResendDialog');
jest.mock('components/client/activationEmailResender');

describe('components/client/activationEmailResendController', () => {
  let openActivationDialogStub, openConfirmationDialogStub, stubs, setUser, store;

  const A_SECOND = 1000;
  const A_DAY = 24 * 60 * 60 * A_SECOND;

  beforeEach(async function () {
    openActivationDialogStub = jest.fn();
    openConfirmationDialogStub = jest.fn();

    stubs = {
      user$: K.createMockProperty(),
    };

    TokenStore.user$ = stubs.user$;
    ActivationEmailResendDialog.openActivationEmailResendDialog = openActivationDialogStub;
    ActivationEmailResendDialog.openConfirmationEmailSentDialog = openConfirmationDialogStub;

    ActivationEmailResender.resendActivationEmail = jest.fn().mockResolvedValue();

    setUser = (props) => {
      stubs.user$.set(
        _.assign(
          {
            name: 'Some User',
            email: 'user@example.com',
            confirmed: false,
          },
          props
        )
      );
    };

    openActivationDialogStub.mockResolvedValue(true);

    store = getBrowserStorage().forKey('lastActivationEmailResendReminderTimestamp');

    initActivationEmailResend();
  });

  describe('with user already activated', () => {
    it('does not open the resend activation email dialog', function () {
      setUser({ confirmed: true });
      expect(openActivationDialogStub).not.toHaveBeenCalled();
    });

    it('removes dialog related store info which is no longer required', function () {
      store.set(true);
      setUser({ confirmed: true });
      expect(store.get()).toBeNull();
    });
  });

  describe('with user not activated yet', () => {
    const advanceDate = (ms = 0, date = new Date(2016, 1, 1)) => {
      jest.useFakeTimers('modern').setSystemTime(date.getTime() + ms);
      return new Date(date.getTime() + ms);
    };
    beforeEach(() => {
      advanceDate();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('opens the resend activation email dialog', async function () {
      setUser({ confirmed: false });
      await waitFor(() => expect(openActivationDialogStub).toHaveBeenCalledTimes(1));
    });

    it('adds info to the store when the dialog got last shown', function () {
      store.remove();
      setUser({ confirmed: false });
      expect(store.get()).toBeTruthy();
    });

    describe('dialog has been shown before in another session', () => {
      beforeEach(function () {
        store.set(moment().unix());
      });

      it('opens the dialog after 24 hours', function () {
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
        advanceDate(A_DAY);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);
      });

      it('does not open the dialog after 24 hours if meanwhile the user got activated', function () {
        advanceDate(A_DAY);
        setUser({ confirmed: true });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
      });

      it('does not open the dialog for the next 23:59 hours', function () {
        advanceDate(A_DAY - A_SECOND);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
      });
    });

    describe('dialog gets shown and the browser tab remains open', () => {
      beforeEach(function () {
        setUser({ confirmed: false });
      });

      it('reopens the dialog after 24 hours', function () {
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);

        const date = advanceDate(A_DAY - A_SECOND);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);

        advanceDate(A_SECOND, date);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(2);
      });

      it('does not reopen the dialog after 24 hours if meanwhile the user got activated', function () {
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);
        setUser({ confirmed: true });
        advanceDate(A_DAY);
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);
      });
    });

    describe('dialog is not shown because only 12 hours have passed since last time', () => {
      beforeEach(function () {
        const lastShown = moment().subtract(12, 'hours').unix();
        store.set(lastShown);
      });

      it('opens the dialog after 12 hours', function () {
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
        advanceDate(A_DAY / 2);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(1);
      });

      it('does not open the dialog after 12 hours if meanwhile the user got activated', function () {
        advanceDate(A_DAY / 2);
        setUser({ confirmed: true });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
      });

      it('does not open the dialog for the next 13:59 hours', function () {
        advanceDate(A_DAY / 2 - A_SECOND);
        setUser({ confirmed: false });
        expect(openActivationDialogStub).toHaveBeenCalledTimes(0);
      });
    });
  });
});
