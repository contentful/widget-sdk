'use strict';

import _ from 'lodash';

describe('Section Access', () => {
  let sectionAccess, spaceContext, visibilityStub;

  afterEach(() => {
    sectionAccess = spaceContext = visibilityStub = null;
  });

  const allTrue = {
    contentType: true,
    entry: true,
    asset: true,
    apiKey: true,
    settings: true
  };

  beforeEach(async function() {
    module('contentful/test');

    sectionAccess = await this.system.import('access_control/SectionAccess.es6');

    visibilityStub = sinon.stub().returns(allTrue);

    await this.system.override('access_control/AccessChecker/index.es6', {
      getSectionVisibility: visibilityStub
    });
    spaceContext = this.$inject('spaceContext');
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
          spaceMember: { admin: true },
          activatedAt: null
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.home');
    });

    it('returns first available screen sref when activated and admin', () => {
      spaceContext.space = {
        data: {
          spaceMember: { admin: true },
          activatedAt: 'activatedAt'
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.entries.list');
    });

    it('returns home screen sref when user is author or editor', () => {
      spaceContext.space = {
        data: {
          spaceMember: { roles: [{ name: 'Author' }] },
          activatedAt: 'activatedAt'
        }
      };

      expect(sectionAccess.getFirstAccessibleSref()).toBe('.home');
    });
  });
});
