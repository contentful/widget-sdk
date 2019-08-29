import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/helpers/helpers';

describe('activationEmailResendController', () => {
  let moment;
  let openDialogStub, dialogConfirmSpy;

  const A_SECOND = 1000;
  const A_DAY = 24 * 60 * 60 * A_SECOND;

  beforeEach(async function() {
    openDialogStub = sinon.stub();
    dialogConfirmSpy = sinon.spy();

    this.stubs = {
      user$: K.createMockProperty()
    };

    this.system.set('services/TokenStore.es6', {
      user$: this.stubs.user$
    });

    const { getStore } = await this.system.import('TheStore/index.es6');
    moment = (await this.system.import('moment')).default;

    await $initialize(this.system, $provide => {
      $provide.constant('modalDialog', {
        open: openDialogStub
      });
      $provide.constant('activationEmailResender', {
        resend: sinon.stub().resolves()
      });
    });

    this.setUser = props => {
      this.stubs.user$.set(
        _.assign(
          {
            name: 'Some User',
            email: 'user@example.com',
            confirmed: false
          },
          props
        )
      );
    };

    const $q = $inject('$q');

    openDialogStub.returns({
      promise: $q(_.noop),
      scope: {},
      confirm: dialogConfirmSpy
    });

    const controller = $inject('activationEmailResendController');
    this.store = getStore().forKey('lastActivationEmailResendReminderTimestamp');
    controller.init();
  });

  describe('with user already activated', () => {
    it('does not open the resend activation email dialog', function() {
      this.setUser({ confirmed: true });
      sinon.assert.notCalled(openDialogStub);
    });

    it('removes dialog related store info which is no longer required', function() {
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

    it('opens the resend activation email dialog', function() {
      this.setUser({ confirmed: false });
      sinon.assert.calledOnce(openDialogStub);
    });

    it('adds info to the store when the dialog got last shown', function() {
      this.store.remove();
      this.setUser({ confirmed: false });
      expect(this.store.get()).toBeTruthy();
    });

    describe('dialog has been shown before in another session', () => {
      beforeEach(function() {
        this.store.set(moment().unix());
      });

      it('opens the dialog after 24 hours', function() {
        sinon.assert.callCount(openDialogStub, 0);
        jasmine.clock().tick(A_DAY);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 1);
      });

      it('does not open the dialog after 24 hours if meanwhile the user got activated', function() {
        jasmine.clock().tick(A_DAY);
        this.setUser({ confirmed: true });
        sinon.assert.callCount(openDialogStub, 0);
      });

      it('does not open the dialog for the next 23:59 hours', function() {
        jasmine.clock().tick(A_DAY - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 0);
      });
    });

    describe('dialog gets shown and the browser tab remains open', () => {
      beforeEach(function() {
        this.setUser({ confirmed: false });
      });

      it('reopens the dialog after 24 hours', function() {
        sinon.assert.callCount(openDialogStub, 1);

        jasmine.clock().tick(A_DAY - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 1);

        jasmine.clock().tick(A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 2);
      });

      it('does not reopen the dialog after 24 hours if meanwhile the user got activated', function() {
        sinon.assert.callCount(openDialogStub, 1);
        this.setUser({ confirmed: true });
        jasmine.clock().tick(A_DAY);
        sinon.assert.callCount(openDialogStub, 1);
      });
    });

    describe('dialog is not shown because only 12 hours have passed since last time', () => {
      beforeEach(function() {
        const lastShown = moment()
          .subtract(12, 'hours')
          .unix();
        this.store.set(lastShown);
        // this.setUser({confirmed: false});
      });

      it('opens the dialog after 12 hours', function() {
        sinon.assert.callCount(openDialogStub, 0);
        jasmine.clock().tick(A_DAY / 2);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 1);
      });

      it('does not open the dialog after 12 hours if meanwhile the user got activated', function() {
        jasmine.clock().tick(A_DAY / 2);
        this.setUser({ confirmed: true });
        sinon.assert.callCount(openDialogStub, 0);
      });

      it('does not open the dialog for the next 13:59 hours', function() {
        jasmine.clock().tick(A_DAY / 2 - A_SECOND);
        this.setUser({ confirmed: false });
        sinon.assert.callCount(openDialogStub, 0);
      });
    });

    describe('resend activation email`s “Resend” button', () => {
      let $timeout, openDialogOptions, openEmailSentDialogStub;
      beforeEach(function() {
        this.resendConfirmation = $inject('activationEmailResender').resend;

        $timeout = $inject('$timeout');
        this.setUser({ confirmed: false, email: 'EMAIL' });
        openDialogOptions = openDialogStub.args[0][0];
        // Following tests only care about the 2nd Dialog, the email confirmation.
        openDialogStub.reset();
        openEmailSentDialogStub = openDialogStub;
      });

      it('resends the current user`s activation email', function() {
        openDialogOptions.scopeData.resendEmail();
        sinon.assert.calledWithExactly(this.resendConfirmation, 'EMAIL');
      });

      it('shows a confirmation dialog on success and closes the first one', () => {
        openDialogOptions.scopeData.resendEmail();
        $timeout.flush();

        sinon.assert.calledOnce(dialogConfirmSpy);
        sinon.assert.calledWithExactly(
          openEmailSentDialogStub,
          sinon.match.has('title', 'It’s on its way!')
        );
      });

      it('opens no confirmation dialog and leaves the first one open on failure', function() {
        this.resendConfirmation.rejects();

        openDialogOptions.scopeData.resendEmail();
        $timeout.flush();

        sinon.assert.notCalled(dialogConfirmSpy);
        sinon.assert.notCalled(openEmailSentDialogStub);
      });
    });
  });
});
