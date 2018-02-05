'use strict';

describe('Section Access', function () {
  let sectionAccess, accessChecker, spaceContext, visibilityStub;

  afterEach(function () {
    sectionAccess = accessChecker = spaceContext = visibilityStub = null;
  });

  const allTrue = {
    contentType: true,
    entry: true,
    asset: true,
    apiKey: true,
    settings: true
  };

  beforeEach(function () {
    module('contentful/test');

    sectionAccess = this.$inject('sectionAccess');
    accessChecker = this.$inject('access_control/AccessChecker');
    spaceContext = this.$inject('spaceContext');

    accessChecker.getSectionVisibility = visibilityStub = sinon.stub().returns(allTrue);
  });

  describe('#getFirstAccessibleSref', function () {
    it('handles all-true scenario', function () {
      expect(sectionAccess.getFirstAccessibleSref()).toBe('.entries.list');
    });

    it('handles some-true scenario', function () {
      visibilityStub.returns(_.extend({}, allTrue, {entry: false}));
      expect(sectionAccess.getFirstAccessibleSref()).toBe('.content_types.list');
    });

    it('handles all-false scenario', function () {
      visibilityStub.returns({});
      expect(sectionAccess.getFirstAccessibleSref()).toBe(null);
    });

    it('handles all-false scenario with extra key', function () {
      visibilityStub.returns({extra: true});
      expect(sectionAccess.getFirstAccessibleSref()).toBe(null);
    });

    it('returns home screen sref when not activated and admin', function () {
      spaceContext.space = {
        data: {
          spaceMembership: {admin: true},
          activatedAt: null
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.home');
      spaceContext.space.data.spaceMembership.admin = false;
      expect(sectionAccess.getFirstAccessibleSref()).toBe('.entries.list');
    });
  });
});
