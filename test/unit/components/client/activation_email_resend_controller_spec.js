'use strict';

describe('activationEmailResendController', function () {
  var $rootScope, $q, authentication, moment;
  var openDialogStub, dialogConfirmSpy, resendConfirmationEmailStub;
  var userMock, storeMock;

  var A_SECOND = 1000;
  var A_DAY = 24 * 1000 * 60 * 60;
  var LAST_REMINDER_STORE_KEY;

  beforeEach(function () {
    openDialogStub = sinon.stub();
    dialogConfirmSpy = sinon.spy();
    resendConfirmationEmailStub = sinon.stub();
    userMock = {
      name: 'Some User',
      email: 'user@example.com',
      activated: false
    };
    storeMock = {
      set: sinon.spy(),
      get: sinon.stub(),
      remove: sinon.spy()
    };

    module('contentful/test', function ($provide) {
      $provide.value('modalDialog', {
        open: openDialogStub
      });
      $provide.value('authentication', {
        tokenLookup: {sys: {createdBy: userMock}}
      });
      $provide.value('activationEmailResender', {
        resend: resendConfirmationEmailStub
      });
      $provide.value('TheStore', storeMock);
    });

    $q = this.$inject('$q');

    openDialogStub.returns({
      promise: $q(_.noop),
      scope: {},
      confirm: dialogConfirmSpy
    });
    resendConfirmationEmailStub.returns($q(_.noop));

    moment = this.$inject('moment');
    $rootScope = this.$inject('$rootScope');
    authentication = this.$inject('authentication');

    var controller = this.$inject('activationEmailResendController');
    LAST_REMINDER_STORE_KEY = controller.LAST_REMINDER_STORE_KEY;
    controller.init();
  });

  describe('with user already activated', function () {
    beforeEach(function () {
      userMock.activated = true;
      $rootScope.$apply();
    });

    it('does not open the resend activation email dialog', function () {
      sinon.assert.notCalled(openDialogStub);
    });

    it('removes dialog related store info which is no longer required', function () {
      sinon.assert.calledWithExactly(storeMock.remove, LAST_REMINDER_STORE_KEY);
    });
  });

  describe('with user not activated yet', function () {
    beforeEach(function () {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2016, 1, 1));
      userMock.activated = false;
    });

    afterEach(jasmine.clock().uninstall);

    it('opens the resend activation email dialog', function () {
      $rootScope.$apply();
      sinon.assert.calledOnce(openDialogStub);
    });

    it('adds info to the store when the dialog got last shown', function () {
      $rootScope.$apply();
      sinon.assert.calledWith(storeMock.set, LAST_REMINDER_STORE_KEY);
    });

    describe('dialog has been shown before in another session', function () {
      beforeEach(function () {
        var lastShownTime = moment().unix();
        storeMock.get.withArgs(LAST_REMINDER_STORE_KEY).returns(lastShownTime);
      });

      it('opens the dialog after 24 hours', function () {
        sinon.assert.callCount(openDialogStub, 0);
        jasmine.clock().tick(A_DAY);
        $rootScope.$apply();
        sinon.assert.callCount(openDialogStub, 1);
      });

      it('does not open the dialog after 24 hours if meanwhile the user got activated', function () {
        jasmine.clock().tick(A_DAY);
        userMock.activated = true;
        $rootScope.$apply();
        sinon.assert.callCount(openDialogStub, 0);
      });

      it('does not open the dialog for the next 23:59 hours', function () {
        jasmine.clock().tick(A_DAY - A_SECOND);
        $rootScope.$apply();
        sinon.assert.callCount(openDialogStub, 0);
      });
    });

    describe('dialog gets shown and the browser tab remains open', function () {
      beforeEach(function () {
        $rootScope.$apply();
        var lastShownTime = storeMock.set.args[0][1];
        storeMock.get.withArgs(LAST_REMINDER_STORE_KEY).returns(lastShownTime);
      });

      it('reopens the dialog after 24 hours', function () {
        sinon.assert.callCount(openDialogStub, 1);
        jasmine.clock().tick(A_DAY);
        sinon.assert.callCount(openDialogStub, 2);
      });

      it('does not reopen the dialog after 24 hours if meanwhile the user got activated', function () {
        sinon.assert.callCount(openDialogStub, 1);
        userMock.activated = true;
        jasmine.clock().tick(A_DAY);
        sinon.assert.callCount(openDialogStub, 1);
      });

      it('does not reopen the dialog for the next 23:59 hours', function () {
        sinon.assert.callCount(openDialogStub, 1);
        jasmine.clock().tick(A_DAY - A_SECOND);
        sinon.assert.callCount(openDialogStub, 1);
      });
    });

    describe('dialog is not shown because only 12 hours have passed since last time', function () {
      beforeEach(function () {
        var lastShownMoment = moment().subtract(12, 'hours');
        storeMock.get.withArgs(LAST_REMINDER_STORE_KEY).returns(lastShownMoment.unix());
        $rootScope.$apply();
      });

      it('opens the dialog after 12 hours', function () {
        sinon.assert.callCount(openDialogStub, 0);
        jasmine.clock().tick(A_DAY / 2);
        sinon.assert.callCount(openDialogStub, 1);
      });

      it('does not open the dialog after 12 hours if meanwhile the user got activated', function () {
        userMock.activated = true;
        jasmine.clock().tick(A_DAY / 2);
        sinon.assert.callCount(openDialogStub, 0);
      });

      it('does not open the dialog for the next 13:59 hours', function () {
        jasmine.clock().tick(A_DAY / 2 - A_SECOND);
        sinon.assert.callCount(openDialogStub, 0);
      });
    });

    describe('resend activation email`s “Resend” button', function () {
      var $timeout, openDialogOptions, openEmailSentDialogStub;
      beforeEach(function () {
        $rootScope.$apply();
        $timeout = this.$inject('$timeout');
        $timeout.verifyNoPendingTasks();
        openDialogOptions = openDialogStub.args[0][0];
        // Following tests only care about the 2nd Dialog, the email confirmation.
        openDialogStub.reset();
        openEmailSentDialogStub = openDialogStub;
      });

      it('resends the current user`s activation email', function () {
        openDialogOptions.scopeData.resendEmail();
        sinon.assert.calledWithExactly(resendConfirmationEmailStub, userMock.email);
      });

      it('shows a confirmation dialog on success and closes the first one', function () {
        resendConfirmationEmailStub.returns($q.resolve());

        openDialogOptions.scopeData.resendEmail();
        $timeout.flush();

        sinon.assert.calledOnce(dialogConfirmSpy);
        sinon.assert.calledWithExactly(openEmailSentDialogStub,
          sinon.match.has('title', 'It’s on its way!'));
      });

      it('opens no confirmation dialog and leaves the first one open on failure', function () {
        resendConfirmationEmailStub.returns($q.reject());

        openDialogOptions.scopeData.resendEmail();
        $timeout.flush();

        sinon.assert.notCalled(dialogConfirmSpy);
        sinon.assert.notCalled(openEmailSentDialogStub);
      });
    });
  });
});
