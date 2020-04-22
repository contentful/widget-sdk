import * as K from 'test/utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';

describe('components/client/activationEmailResendController', () => {
  let moment;
  let openActivationDialogStub, openConfirmationDialogStub;

  const A_SECOND = 1000;
  const A_DAY = 24 * 60 * 60 * A_SECOND;

  beforeEach(async function () {
    openActivationDialogStub = sinon.stub();
    openConfirmationDialogStub = sinon.stub();

    this.stubs = {
      user$: K.createMockProperty(),
    };

    this.system.set('services/TokenStore', {
      user$: this.stubs.user$,
    });

    this.system.set('components/client/ActivationEmailResendDialog', {
      openActivationEmailResendDialog: openActivationDialogStub,
      openConfirmationEmailSentDialog: openConfirmationDialogStub,
    });

    this.system.set('components/client/activationEmailResender', {
      resendActivationEmail: sinon.stub().resolves(),
    });

    const { getBrowserStorage } = await this.system.import('core/services/BrowserStorage');

    const { initActivationEmailResend } = await this.system.import(
      'components/client/activationEmailResendController'
    );

    moment = (await this.system.import('moment')).default;

    await $initialize(this.system);

    this.setUser = (props) => {
      this.stubs.user$.set(
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

    openActivationDialogStub.resolves(true);

    this.store = getBrowserStorage().forKey('lastActivationEmailResendReminderTimestamp');

    initActivationEmailResend();
  });

  describe('with user already activated', () => {
    it('does not open the resend activation email dialog', function () {
      this.setUser({ confirmed: true });
      sinon.assert.notCalled(openActivationDialogStub);
    });

    it('removes dialog related store info which is no longer required', function () {
      this.store.set(true);
      this.setUser({ confirmed: true });
      expect(this.store.get()).toBe(null);
    });
  });

  describe('with user not activated yet', () => {
    beforeEach(() => {
      jasmine.clock().uninstall();
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2016, 1, 1));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('opens the resend activation email dialog', function () {
      this.setUser({ confirmed: false });
      sinon.assert.calledOnce(openActivationDialogStub);
    });

    it('adds info to the store when the dialog got last shown', function () {
      this.store.remove();
      this.setUser({ confirmed: false });
      expect(this.store.get()).toBeTruthy();
    });

    describe('dialog has been shown before in another session', () => {
      beforeEach(function () {
        this.store.set(moment().unix());
      });

      it('opens the dialog after 24 hours', function () {
        sinon.assert.callCount(openActivationDialogStub, 0);
        jasmine.clock().tick(A_DAY);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 1);
      });

      it('does not open the dialog after 24 hours if meanwhile the user got activated', function () {
        jasmine.clock().tick(A_DAY);
        this.setUser({ confirmed: true });
        sinon.assert.callCount(openActivationDialogStub, 0);
      });

      it('does not open the dialog for the next 23:59 hours', function () {
        jasmine.clock().tick(A_DAY - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 0);
      });
    });

    describe('dialog gets shown and the browser tab remains open', () => {
      beforeEach(function () {
        this.setUser({ confirmed: false });
      });

      it('reopens the dialog after 24 hours', function () {
        sinon.assert.callCount(openActivationDialogStub, 1);

        jasmine.clock().tick(A_DAY - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 1);

        jasmine.clock().tick(A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 2);
      });

      it('does not reopen the dialog after 24 hours if meanwhile the user got activated', function () {
        sinon.assert.callCount(openActivationDialogStub, 1);
        this.setUser({ confirmed: true });
        jasmine.clock().tick(A_DAY);
        sinon.assert.callCount(openActivationDialogStub, 1);
      });
    });

    describe('dialog is not shown because only 12 hours have passed since last time', () => {
      beforeEach(function () {
        const lastShown = moment().subtract(12, 'hours').unix();
        this.store.set(lastShown);
        // this.setUser({confirmed: false});
      });

      it('opens the dialog after 12 hours', function () {
        sinon.assert.callCount(openActivationDialogStub, 0);
        jasmine.clock().tick(A_DAY / 2);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 1);
      });

      it('does not open the dialog after 12 hours if meanwhile the user got activated', function () {
        jasmine.clock().tick(A_DAY / 2);
        this.setUser({ confirmed: true });
        sinon.assert.callCount(openActivationDialogStub, 0);
      });

      it('does not open the dialog for the next 13:59 hours', function () {
        jasmine.clock().tick(A_DAY / 2 - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openActivationDialogStub, 0);
      });
    });
  });
});
