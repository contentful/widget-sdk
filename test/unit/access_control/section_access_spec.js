'use strict';

import _ from 'lodash';

describe('Section Access', () => {
  let sectionAccess, accessChecker, spaceContext, visibilityStub;

  afterEach(() => {
    sectionAccess = accessChecker = spaceContext = visibilityStub = null;
  });

  const allTrue = {
    contentType: true,
    entry: true,
    asset: true,
    apiKey: true,
    settings: true
  };

  beforeEach(function() {
    module('contentful/test');

    sectionAccess = this.$inject('access_control/SectionAccess.es6');
    accessChecker = this.$inject('access_control/AccessChecker');
    spaceContext = this.$inject('spaceContext');

    accessChecker.getSectionVisibility = visibilityStub = sinon.stub().returns(allTrue);
  });

  describe('#getFirstAccessibleSref', () => {
    it('handles all-true scenario', () => {
      expect(sectionAccess.getFirstAccessibleSref()).toBe('.entries.list');
    });

    it('handles some-true scenario', () => {
      visibilityStub.returns(_.extend({}, allTrue, { entry: false }));
      expect(sectionAccess.getFirstAccessibleSref()).toBe('.content_types.list');
    });

    it('handles all-false scenario', () => {
      visibilityStub.returns({});
      expect(sectionAccess.getFirstAccessibleSref()).toBe(null);
    });

    it('handles all-false scenario with extra key', () => {
      visibilityStub.returns({ extra: true });
      expect(sectionAccess.getFirstAccessibleSref()).toBe(null);
    });

    it('returns home screen sref when not activated and admin', () => {
      spaceContext.space = {
        data: {
          spaceMembership: { admin: true },
          activatedAt: null
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.home');
    });

    it('returns first available screen sref when activated and admin', () => {
      spaceContext.space = {
        data: {
          spaceMembership: { admin: true },
          activatedAt: 'activatedAt'
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.entries.list');
    });

    it('returns home screen sref when user is author or editor', () => {
      spaceContext.space = {
        data: {
          spaceMembership: { roles: [{ name: 'Author' }] },
          activatedAt: 'activatedAt'
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.home');
    });
  });
});
