'use strict';

describe('Section Access', function () {
  let sectionAccess, accessChecker, $state, $stateParams, spaceContext;
  let visibilityStub, goStub;

  const allTrue = {
    contentType: true,
    entry: true,
    asset: true,
    apiKey: true,
    settings: true
  };
  afterEach(function () {
    sectionAccess = accessChecker = $state =
      $stateParams = visibilityStub = goStub = null;
  });

  beforeEach(function () {
    module('contentful/test');

    sectionAccess = this.$inject('sectionAccess');
    accessChecker = this.$inject('accessChecker');
    $state = this.$inject('$state');
    $stateParams = this.$inject('$stateParams');
    spaceContext = this.$inject('spaceContext');

    accessChecker.getSectionVisibility = visibilityStub = sinon.stub().returns(allTrue);
    $state.go = goStub = sinon.stub();
    $state.$current = {};
    delete $stateParams.spaceId;
  });

  describe('#hasAccessToAny', function () {
    it('handles all-true scenario', function () {
      expect(sectionAccess.hasAccessToAny()).toBe(true);
    });

    it('handles some-true scenario', function () {
      visibilityStub.returns(_.extend({}, allTrue, {contentType: false}));
      expect(sectionAccess.hasAccessToAny()).toBe(true);
    });

    it('handles all-false scenario', function () {
      visibilityStub.returns({});
      expect(sectionAccess.hasAccessToAny()).toBe(false);
    });

    it('handles all-false scenario with extra key', function () {
      visibilityStub.returns({extra: true});
      expect(sectionAccess.hasAccessToAny()).toBe(false);
    });
  });

  describe('#redirectToFirstAccessible', function () {
    it('does not redirect when not in base state', function () {
      $state.$current.name = 'xyz';
      $stateParams.spaceId = '123';
      sectionAccess.redirectToFirstAccessible();
      sinon.assert.notCalled(goStub);
    });

    it('throws when there is no accessible section', function () {
      $state.$current.name = 'spaces.detail';
      $stateParams.spaceId = 'sid123';
      visibilityStub.returns({});

      try {
        sectionAccess.redirectToFirstAccessible();
      } catch (e) {
        expect(e.message).toBe('No section to redirect to.');
        sinon.assert.notCalled(goStub);
      }
    });

    it('does redirect when all requirements are met', function () {
      $state.$current.name = 'spaces.detail';
      $stateParams.spaceId = 'sid123';
      visibilityStub.returns({asset: true});
      sectionAccess.redirectToFirstAccessible();
      sinon.assert.calledOnce(goStub);
      expect(goStub.args[0][0]).toBe('spaces.detail.assets.list');
      expect(goStub.args[0][1].spaceId).toBe('sid123');
    });

    it('redirects are ordered', function () {
      $state.$current.name = 'spaces.detail';
      $stateParams.spaceId = 'anothersid';
      visibilityStub.returns({asset: true, settings: true, contentType: true});
      sectionAccess.redirectToFirstAccessible();
      sinon.assert.calledOnce(goStub);
      expect(goStub.args[0][0]).toBe('spaces.detail.content_types.list');
      expect(goStub.args[0][1].spaceId).toBe('anothersid');
    });

    describe('redirects to space home if space is not activated', function () {
      beforeEach(function () {
        $state.$current.name = 'spaces.detail';
        $stateParams.spaceId = 'yetanothersid';
        spaceContext.space = {
          data: {
            spaceMembership: {
              admin: true
            },
            activatedAt: null
          }
        };
      });

      it('redirects admins', function () {
        sectionAccess.redirectToFirstAccessible();
        sinon.assert.calledOnce(goStub);
        expect(goStub.args[0][0]).toBe('spaces.detail.home');
        expect(goStub.args[0][1].spaceId).toBe('yetanothersid');
      });

      it('does not redirect non-admins', function () {
        spaceContext.space.data.spaceMembership.admin = false;
        sectionAccess.redirectToFirstAccessible();
        sinon.assert.calledOnce(goStub);
        expect(goStub.args[0][0]).not.toBe('spaces.detail.home');
      });
    });
  });
});
