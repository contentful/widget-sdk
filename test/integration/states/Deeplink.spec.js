import * as sinon from 'helpers/sinon';

describe('states/Deeplink', function () {
  beforeEach(function () {
    this.getFromStore = sinon.stub();
    this.getSpaces = sinon.stub();
    this.getOrganization = sinon.stub();
    this.getOrganizations = sinon.stub();
    this.canReadApiKeys = sinon.stub();
    this.isOwnerOrAdmin = sinon.stub();
    this.navigate = sinon.spy();
    this.search = sinon.stub();
    this.apiKeys = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('$location', {
        search: this.search,
        url: () => {}
      });
      $provide.value('spaceContext', {
        resetWithSpace: () => Promise.resolve(),
        apiKeyRepo: {
          getAll: this.apiKeys
        }
      });
      $provide.value('services/TokenStore', {
        getSpaces: this.getSpaces,
        getOrganizations: this.getOrganizations,
        getOrganization: this.getOrganization
      });
      $provide.value('access_control/AccessChecker', {
        canReadApiKeys: this.canReadApiKeys
      });
      $provide.value('services/OrganizationRoles', {
        isOwnerOrAdmin: this.isOwnerOrAdmin
      });
      $provide.value('states/Navigator', {
        go: this.navigate
      });
    });

    const getStore = this.$inject('TheStore').getStore;
    this.store = getStore();
    this.createDeeplinkController = this.$inject('states/Deeplink').createController;
    this.$rootScope = this.$inject('$rootScope');

    this.createController = function () {
      const $scope = this.$rootScope.$new();
      $scope.context = {};
      const promise = this.createDeeplinkController($scope);

      return { $scope, promise };
    };
  });

  it('should give generic error in case no link', function* () {
    this.search.returns({});
    const { $scope, promise } = this.createController();

    yield promise;

    expect($scope.status).toBe('not_exist');
  });

  describe('#api', function () {
    it('should redirect to the general api page if no keys', function* () {
      this.search.returns({ link: 'api' });
      this.store.set('lastUsedSpace', 'test2');
      this.getSpaces.returns(Promise.resolve([
        {sys: {id: 'test1'}}, {sys: {id: 'test2'}}
      ]));
      this.canReadApiKeys.returns(true);
      this.apiKeys.returns(Promise.resolve());
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['spaces', 'detail', 'api', 'keys', 'list'],
        params: {
          spaceId: 'test2'
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should redirect to the last used space', function* () {
      this.search.returns({ link: 'api' });
      this.getSpaces.returns(Promise.resolve([{ sys: { id: 'test' } }]));
      this.canReadApiKeys.returns(true);
      this.apiKeys.returns(Promise.resolve());
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['spaces', 'detail', 'api', 'keys', 'list'],
        params: {
          spaceId: 'test'
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should redirect to the first api key page if there are several', function* () {
      this.search.returns({ link: 'api' });
      this.getSpaces.returns(Promise.resolve([{ sys: { id: 'test' } }]));
      this.canReadApiKeys.returns(true);
      const apiKeys = [
        { sys: { id: 'first' } },
        { sys: { id: 'second' } }
      ];
      this.apiKeys.returns(Promise.resolve(apiKeys));
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['spaces', 'detail', 'api', 'keys', 'detail'],
        params: {
          spaceId: 'test',
          apiKeyId: 'first'
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should give generic error in case no access', function* () {
      this.search.returns({ link: 'api' });
      this.getSpaces.returns(Promise.resolve([{ data: { sys: { id: 'test' } } }]));
      this.canReadApiKeys.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#invite', function () {
    it('should redirect to invite users page', function* () {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['account', 'organizations', 'users', 'new'],
        params: {
          orgId: 'some'
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should pick org of the first space in case expired lastUsedOrg', function* () {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some_obsolete_value');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'new_org_id' } }
      ]));
      this.getSpaces.returns(Promise.resolve([{
        sys: {id: 'space_id'},
        organization: {sys: {id: 'new_org_id'}}
      }]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['account', 'organizations', 'users', 'new'],
        params: {
          orgId: 'new_org_id'
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should give generic error in case no access', function* () {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#users', function () {
    it('should redirect to users list page', function* () {
      this.search.returns({ link: 'users' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['account', 'organizations', 'users', 'gatekeeper'],
        params: {
          orgId: 'some',
          pathSuffix: ''
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should give generic error in case no access', function* () {
      this.search.returns({ link: 'users' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#subscription', function () {
    it('should redirect to subscription page', function* () {
      this.search.returns({ link: 'subscription' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['account', 'organizations', 'subscription'],
        params: {
          orgId: 'some',
          pathSuffix: ''
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should give generic error in case no access', function* () {
      this.search.returns({ link: 'subscription' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#org', function () {
    it('should redirect to org info page', function* () {
      this.search.returns({ link: 'org' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(this.navigate.calledWith({
        path: ['account', 'organizations', 'edit'],
        params: {
          orgId: 'some',
          pathSuffix: ''
        },
        options: {
          location: 'replace'
        }
      })).toBe(true);
    });

    it('should give generic error in case no access', function* () {
      this.search.returns({ link: 'org' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.returns(Promise.resolve([
        { sys: { id: 'some' } }
      ]));
      this.getOrganization.returns(Promise.resolve());
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });
});
