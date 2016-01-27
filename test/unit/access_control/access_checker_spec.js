'use strict';

describe('Access Checker', function () {

  var $rootScope, spaceContext, authorization, enforcements, OrganizationList, policyChecker, ac;
  var canStub, reasonsDeniedStub;

  function triggerChange() {
    authorization.spaceContext = {can: canStub, reasonsDenied: reasonsDeniedStub};
    $rootScope.$apply();
  }

  beforeEach(function () {
    module('contentful/test');

    $rootScope = this.$inject('$rootScope');
    spaceContext = this.$inject('spaceContext');
    authorization = this.$inject('authorization');
    enforcements = this.$inject('enforcements');
    OrganizationList = this.$inject('OrganizationList');
    policyChecker = this.$inject('accessChecker/policy');
    ac = this.$inject('accessChecker');

    canStub = sinon.stub().returns(false);
    reasonsDeniedStub = sinon.stub().returns([]);

    enforcements.determineEnforcement = sinon.stub().returns(undefined);

    triggerChange();
  });

  describe('#getResponses', function () {
    it('collects responses when auth context changes', function () {
      var responses = ac.getResponses();
      triggerChange();
      expect(ac.getResponses() === responses).toBe(false);
    });

    it('contains keys for entity actions', function () {
      var responses = ac.getResponses();
      var testKeys = ['createContentType', 'readEntry', 'updateAsset', 'createApiKey', 'updateSettings'];
      var intersection = _.intersection(_.keys(responses), testKeys);
      expect(intersection.length).toBe(testKeys.length);
    });

    it('should not hide or disable when operation can be performed', function () {
      canStub.withArgs('read', 'Entry').returns(true);
      triggerChange();
      var response = ac.getResponses()['readEntry'];
      expect(response.can).toBe(true);
      expect(response.shouldHide).toBe(false);
      expect(response.shouldDisable).toBe(false);
    });

    it('should disable, but not hide when operation cannot be performed and reasons for denial are given', function () {
      reasonsDeniedStub.withArgs('read', 'Entry').returns(['DENIED!']);
      triggerChange();
      var response = ac.getResponses()['readEntry'];
      expect(response.can).toBe(false);
      expect(response.shouldHide).toBe(false);
      expect(response.shouldDisable).toBe(true);
      expect(_.first(response.reasons)).toBe('DENIED!');
    });

    it('should hide when operation cannot be performed and no reasons are given', function () {
      var response = ac.getResponses()['readEntry'];
      expect(response.can).toBe(false);
      expect(response.shouldHide).toBe(true);
      expect(response.shouldDisable).toBe(false);
      expect(response.reasons).toBe(null);
    });

    it('should broadcast enforcement if found', function () {
      var reasons = ['DENIED!'];
      reasonsDeniedStub.withArgs('read', 'Entry').returns(reasons);
      enforcements.determineEnforcement.withArgs(reasons, 'Entry').returns({message: 'ENFORCEMENT MSG'});
      sinon.spy($rootScope, '$broadcast');
      triggerChange();
      sinon.assert.calledOnce($rootScope.$broadcast);
      var args = $rootScope.$broadcast.args[0];
      expect(args[0]).toBe('persistentNotification');
      expect(args[1].message).toBe('ENFORCEMENT MSG');
      $rootScope.$broadcast.restore();
    });
  });

  describe('#getResponseByActionName', function () {
    it('returns undefined for an unknown action', function () {
      expect(ac.getResponseByActionName('unknown')).toBe(undefined);
    });

    it('returns response for a known action', function () {
      var n = 'readEntry';
      var response = ac.getResponseByActionName(n);
      expect(response).toBe(ac.getResponses()[n]);
      expect(_.isObject(response) && response.can === false).toBe(true);
    });
  });

  describe('#getSectionVisibility', function () {
    it('changes when auth context changes', function () {
      var visibility = ac.getSectionVisibility();
      triggerChange();
      expect(ac.getSectionVisibility() === visibility).toBe(false);
    });

    it('checks if there is a "hide" flag for chosen actions', function () {
      function test(action, key, val) {
        var entity = key.charAt(0).toUpperCase() + key.slice(1);
        canStub.withArgs(action, entity).returns(val);
        triggerChange();
        expect(ac.getSectionVisibility()[key]).toBe(val);
      }

      ['update,contentType',
        'read,entry',
        'read,asset',
        'read,apiKey',
        'update,settings'
      ].forEach(function (x) {
        var action = x.split(',').shift();
        var key = x.split(',').pop();
        test(action, key, true);
        test(action, key, false);
      });
    });

    it('shows entries/assets section when it has "hide" flag, but policy checker grants access', function () {
      function test(key, val) { expect(ac.getSectionVisibility()[key]).toBe(val); }
      test('entry', false);
      test('asset', false);
      policyChecker.canAccessEntries = sinon.stub().returns(true);
      policyChecker.canAccessAssets = sinon.stub().returns(true);
      triggerChange();
      test('entry', true);
      test('asset', true);
      sinon.assert.calledOnce(policyChecker.canAccessEntries);
      sinon.assert.calledOnce(policyChecker.canAccessAssets);
    });
  });

  describe('#getFieldChecker', function () {
    var entry = {data: {sys: {type: 'Entry', contentType: {sys: {id: 'ctid'}}}}};
    var fieldChecker = {};

    beforeEach(function () {
      policyChecker.getFieldChecker = sinon.stub().returns(fieldChecker);
    });

    it('returns instance from policy checker', function () {
      expect(ac.getFieldChecker(entry)).toBe(fieldChecker);
    });

    it('returns instance for entry field', function () {
      ac.getFieldChecker(entry, _.noop);
      sinon.assert.calledOnce(policyChecker.getFieldChecker);
      var args = policyChecker.getFieldChecker.args[0];
      expect(args[0]).toBe('ctid');
      expect(args[1]).toBe(_.noop);
    });

    it('returns instance for asset field', function () {
      var asset = {data: {sys: {type: 'Asset'}}};
      ac.getFieldChecker(asset, _.noop);
      sinon.assert.calledOnce(policyChecker.getFieldChecker);
      var args = policyChecker.getFieldChecker.args[0];
      expect(args[0]).toBeUndefined();
      expect(args[1]).toBe(_.noop);
    });
  });

  describe('#shouldHide and #shouldDisable', function () {
    it('are shortcuts to response object properties', function () {
      canStub.withArgs('read', 'Entry').returns(false);
      triggerChange();
      var response = ac.getResponseByActionName('readEntry');
      expect(response.shouldHide).toBe(true);
      expect(response.shouldDisable).toBe(false);
      expect(ac.shouldHide('readEntry')).toBe(response.shouldHide);
      expect(ac.shouldDisable('readEntry')).toBe(response.shouldDisable);
    });

    it('returns false for unknown actions', function () {
      expect(ac.shouldHide('unknown')).toBe(false);
      expect(ac.shouldDisable('unknown')).toBe(false);
    });
  });

  describe('#canPerformActionOnEntity', function () {
    it('calls "can" with entity data and extracts result from response', function () {
      var entity = {data: {}};
      canStub.withArgs('update', entity.data).returns('YES WE CAN');
      var result = ac.canPerformActionOnEntity('update', entity);
      sinon.assert.calledOnce(canStub.withArgs('update', entity.data));
      expect(result).toBe('YES WE CAN');
    });
  });

  describe('#canPerformActionOnEntryOfType', function () {
    it('calls "can" with fake entity of given content type and extracts result from response', function () {
      authorization.spaceContext.can = function (action, entity) {
        var hasCt = dotty.get(entity, 'sys.contentType.sys.id') === 'ctid';
        var hasType = dotty.get(entity, 'sys.type') === 'Entry';
        if (action === 'update' && hasCt && hasType) {
          return 'YES WE CAN';
        }
      };
      var result = ac.canPerformActionOnEntryOfType('update', 'ctid');
      expect(result).toBe('YES WE CAN');
    });
  });

  describe('#canUpdateEntry', function () {
    var entry = {data: {sys: {contentType: {sys: {id: 'ctid'}}}}};

    it('returns true if "can" returns true', function () {
      canStub.withArgs('update', entry.data).returns(true);
      expect(ac.canUpdateEntry(entry)).toBe(true);
    });

    it('returns false if "can" returns false and there are no allow policies', function () {
      canStub.withArgs('update', entry.data).returns(false);
      policyChecker.canUpdateEntriesOfType = sinon.stub().returns(false);
      expect(ac.canUpdateEntry(entry)).toBe(false);
      sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
    });

    it('returns true if "can" returns false but there are allow policies', function () {
      canStub.withArgs('update', entry.data).returns(false);
      policyChecker.canUpdateEntriesOfType = sinon.stub().returns(true);
      expect(ac.canUpdateEntry(entry)).toBe(true);
      sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
    });
  });

  describe('#canUpdateAsset', function () {
    var asset = {data: {}};

    it('returns true if "can" returns true', function () {
      canStub.withArgs('update', asset.data).returns(true);
      expect(ac.canUpdateAsset(asset)).toBe(true);
    });

    it('returns false if "can" returns false and there are no allow policies', function () {
      canStub.withArgs('update', asset.data).returns(false);
      policyChecker.canUpdateAssets = sinon.stub().returns(false);
      expect(ac.canUpdateAsset(asset)).toBe(false);
      sinon.assert.calledOnce(policyChecker.canUpdateAssets);
    });

    it('returns true if "can" returns false but there are allow policies', function () {
      canStub.withArgs('update', asset.data).returns(false);
      policyChecker.canUpdateAssets = sinon.stub().returns(true);
      expect(ac.canUpdateAsset(asset)).toBe(true);
      sinon.assert.calledOnce(policyChecker.canUpdateAssets);
    });
  });

  describe('#canModifyApiKeys', function () {
    it('returns related response', function () {
      expect(ac.canModifyApiKeys()).toBe(false);
      canStub.withArgs('create', 'ApiKey').returns(true);
      triggerChange();
      expect(ac.canModifyApiKeys()).toBe(true);
    });
  });

  describe('#canModifyRoles', function () {
    function spaceData(hasFeature, role) {
      return {data: {
        organization: {
          sys: {id: 'orgid'},
          subscriptionPlan: {limits: {features: {customRoles: hasFeature}}}
        },
        spaceMembership: {user: {organizationMemberships: [
          {organization: {sys: {id: 'orgid'}}, role: role}
        ]}}
      }};
    }

    it('collects features on organization change', function () {
      expect(ac.canModifyRoles()).toBe(false);
      spaceContext.space = spaceData(true, 'admin');
      $rootScope.$apply();
      expect(ac.canModifyRoles()).toBe(true);
    });

    it('returns false if is not an admin or owner', function () {
      spaceContext.space = spaceData(true, 'member');
      $rootScope.$apply();
      expect(ac.canModifyRoles()).toBe(false);
    });
  });

  describe('#canModifyRoles', function () {
    it('returns true when is admin of a space', function () {
      expect(ac.canModifyUsers()).toBe(false);
      spaceContext.space = {data: {spaceMembership: {admin: true}}};
      expect(ac.canModifyUsers()).toBe(true);
    });

    it('returns true when is admin or owner of organization, false otherwise', function () {
      expect(ac.canModifyUsers()).toBe(false);
      spaceContext.space = {data: {
        organization: {sys: {id: null}},
        spaceMembership: {user: {organizationMemberships: [
          {organization: {sys: {id: 'org1id'}}, role: 'admin'},
          {organization: {sys: {id: 'org2id'}}, role: 'member'},
          {organization: {sys: {id: 'org3id'}}, role: 'owner'}
        ]}}
      }};

      t('org1id', true);
      t('org2id', false);
      t('org3id', true);
      t('unknown', false);

      function t(id, expectation) {
        spaceContext.space.data.organization.sys.id = id;
        expect(ac.canModifyUsers()).toBe(expectation);
      }
    });
  });

  describe('#canCreateSpaceInOrganization', function () {
    it('returns false if there is no authContext', function () {
      authorization.authContext = null;
      expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
    });

    it('returns result of organization authContext "can" call', function () {
      var organizationCanStub = sinon.stub().returns('YES WE CAN');
      authorization.authContext = {
        organization: sinon.stub().withArgs('orgid').returns({can: organizationCanStub})
      };

      expect(ac.canCreateSpaceInOrganization('orgid')).toBe('YES WE CAN');
      sinon.assert.calledOnce(authorization.authContext.organization.withArgs('orgid'));
      sinon.assert.calledOnce(organizationCanStub.withArgs('create', 'Space'));
    });

    it('returns false and logs if organization authContext throws', function () {
      authorization.authContext = {
        organization: _.constant({can: function () { throw new Error(); }})
      };

      expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
      var logger = this.$inject('logger');
      sinon.assert.calledOnce(logger.logError);
      expect(logger.logError.args[0][0].indexOf('Worf exception')).toBe(0);
    });
  });

  describe('#canCreateSpaceInAnyOrganization', function () {
    beforeEach(function () {
      sinon.stub(OrganizationList, 'getAll').returns([
        {sys: {id: 'org1'}}, {sys: {id: 'org2'}}
      ]);
    });

    afterEach(function () {
      OrganizationList.getAll.restore();
    });

    it('returns true if space can be created in at least on organization', function () {
      authorization.authContext = {
        organization: function (orgId) {
          return {can: _.constant(orgId === 'org1')};
        }
      };

      expect(ac.canCreateSpaceInAnyOrganization()).toBe(true);
    });

    it('returns false if space cannot be create in any organization', function () {
      authorization.authContext = {organization: _.constant({can: _.constant(false)})};
      expect(ac.canCreateSpaceInAnyOrganization()).toBe(false);
    });
  });

  describe('#canCreateSpace', function () {
    var organizationCanStub, authCanStub;

    beforeEach(function () {
      organizationCanStub = sinon.stub().returns(false);
      authCanStub = sinon.stub().returns(false);
      sinon.stub(OrganizationList, 'isEmpty').returns(false);
      sinon.stub(OrganizationList, 'getAll').returns([{sys: {id: 'org1'}}]);
      authorization.authContext = {
        organization: _.constant({can: organizationCanStub}),
        can: authCanStub
      };
    });

    afterEach(function () {
      OrganizationList.getAll.restore();
      OrganizationList.isEmpty.restore();
    });

    it('returns false when authContext is not defined', function () {
      authorization.authContext = null;
      expect(ac.canCreateSpace()).toBe(false);
    });

    it('returns false when there are no organizations', function () {
      OrganizationList.isEmpty.returns(true);
      expect(ac.canCreateSpace()).toBe(false);
      sinon.assert.calledOnce(OrganizationList.isEmpty);
    });

    it('returns false when cannot create space in some organization', function () {
      organizationCanStub.returns(false);
      expect(ac.canCreateSpace()).toBe(false);
      sinon.assert.calledOnce(organizationCanStub);
    });

    it('returns true if can create space in some organization and can create space in general', function () {
      organizationCanStub.returns(true);
      authCanStub.returns(true);
      expect(ac.canCreateSpace()).toBe(true);
      sinon.assert.calledOnce(organizationCanStub);
    });

    it('returns false if can create space in some organization but cannot create spaces in general', function () {
      organizationCanStub.returns(true);
      authCanStub.returns(false);
      expect(ac.canCreateSpace()).toBe(false);
      sinon.assert.calledOnce(organizationCanStub);
      sinon.assert.calledOnce(authCanStub);
    });

    it('broadcasts enforcement if found for a general case', function () {
      organizationCanStub.returns(true);
      authCanStub.returns(false);
      var reasons = ['REASONS!'];
      reasonsDeniedStub.withArgs('create', 'Space').returns(reasons);
      enforcements.determineEnforcement.withArgs(reasons, 'Space').returns({message:'MESSAGE'});
      sinon.spy($rootScope, '$broadcast');
      expect(ac.canCreateSpace()).toBe(false);
      sinon.assert.calledOnce($rootScope.$broadcast);
      var args = $rootScope.$broadcast.args[0];
      expect(args[0]).toBe('persistentNotification');
      expect(args[1].message).toBe('MESSAGE');
      $rootScope.$broadcast.restore();
    });
  });

  describe('#wasForbidden', function () {
    it('returns callback function', function () {
      expect(_.isFunction(ac.wasForbidden)).toBe(true);
    });

    it('sets "forbidden" flag on provided context if response is 404/3', function () {
      [200, 404, 403].forEach(function (status) {
        var context = {};
        var cb = ac.wasForbidden(context);
        cb({statusCode: status});
        expect(context.forbidden).toBe(status === 200 ? undefined : true);
      });
    });

    pit('returns resolved promise with context if was forbidden', function () {
      var ctx = {};
      var cb = ac.wasForbidden(ctx);

      return cb({statusCode: 404}).then(function (ctx2) {
        expect(ctx === ctx2).toBe(true);
        expect(ctx2.forbidden).toBe(true);
      });
    });

    pit('returns rejected promise with response if was not forbidden', function () {
      var cb = ac.wasForbidden({});
      var res = {statusCode: 400};

      return cb(res).then(_.noop, function (res2) {
        expect(res === res2);
      });
    });
  });
});
