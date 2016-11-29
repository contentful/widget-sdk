'use strict';

describe('onboardingController', function () {
  let $rootScope, $q;
  let openDialogStub, dialogConfirmSpy;
  let userMock, storeMock;

  let SEEN_ONBOARDING_STORE_KEY;

  afterEach(function () {
    $rootScope = $q = openDialogStub =
      dialogConfirmSpy = userMock = storeMock = null;
  });

  beforeEach(function () {
    openDialogStub = sinon.stub();
    dialogConfirmSpy = sinon.spy();
    userMock = {
      signInCount: 1
    };
    storeMock = {
      set: sinon.spy(),
      get: sinon.stub()
    };

    module('contentful/test', function ($provide) {
      $provide.value('modalDialog', {
        open: openDialogStub
      });
      $provide.value('authentication', {
        tokenLookup: {sys: {createdBy: userMock}}
      });
      $provide.value('TheStore', storeMock);
    });

    $q = this.$inject('$q');

    openDialogStub.returns({
      promise: $q(_.noop),
      scope: {},
      confirm: dialogConfirmSpy
    });

    $rootScope = this.$inject('$rootScope');

    const controller = this.$inject('onboardingController');
    SEEN_ONBOARDING_STORE_KEY = controller.SEEN_ONBOARDING_STORE_KEY;
    controller.init();
  });

  describe('with user who has never logged in before', function () {
    describe('`seenOnboarding` is not set in the store', function () {
      beforeEach(function () {
        storeMock.get.withArgs(SEEN_ONBOARDING_STORE_KEY).returns(undefined);
        $rootScope.$apply();
      });
      itShowsTheOnboardingDialog();
      itStoresOnboardingSeenInfo();
    });

    describe('`seenOnboarding` is already set in the store', function () {
      beforeEach(function () {
        storeMock.get.withArgs(SEEN_ONBOARDING_STORE_KEY).returns(true);
        $rootScope.$apply();
      });

      itDoesNotShowTheOnboardingDialog();
    });
  });

  describe('with user who has logged in before', function () {
    beforeEach(function () {
      userMock.signInCount = 2;
      $rootScope.$apply();
    });

    itDoesNotShowTheOnboardingDialog();
  });

  function itShowsTheOnboardingDialog () {
    it('shows the onboarding dialog', function () {
      sinon.assert.calledOnce(openDialogStub);
    });
  }

  function itDoesNotShowTheOnboardingDialog () {
    it('shows no onboarding dialog', function () {
      sinon.assert.notCalled(openDialogStub);
    });
  }

  function itStoresOnboardingSeenInfo () {
    it('sets the `seenOnboarding` information in the store', function () {
      sinon.assert.calledWithExactly(storeMock.set,
        SEEN_ONBOARDING_STORE_KEY, true);
    });
  }

});
