import * as sinon from 'test/helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';
import { noop } from 'lodash';

describe('states/Deeplink.es6', () => {
  beforeEach(function() {
    this.getFromStore = sinon.stub();
    this.getSpaces = sinon.stub();
    this.getOrganization = sinon.stub();
    this.getOrganizations = sinon.stub();
    this.canReadApiKeys = sinon.stub();
    this.isOwnerOrAdmin = sinon.stub();
    this.navigate = sinon.spy();
    this.search = sinon.stub();
    this.apiKeys = sinon.stub();
    this.user$ = K.createMockProperty({ sys: { id: 'user_id' } });

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
      $provide.value('services/TokenStore.es6', {
        getSpaces: this.getSpaces,
        getOrganizations: this.getOrganizations,
        getOrganization: this.getOrganization,
        user$: this.user$
      });
      $provide.value('access_control/AccessChecker', {
        canReadApiKeys: this.canReadApiKeys
      });
      $provide.value('services/OrganizationRoles.es6', {
        isOwnerOrAdmin: this.isOwnerOrAdmin
      });
      $provide.value('states/Navigator.es6', {
        go: this.navigate
      });
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: () => Promise.resolve(false)
      });
      $provide.value('components/shared/auto_create_new_space', {
        getKey: noop
      });
      $provide.value('createModernOnboarding', {
        getStoragePrefix: noop,
        MODERN_STACK_ONBOARDING_SPACE_NAME: 'some name'
      });
    });

    const getStore = this.$inject('TheStore').getStore;
    this.store = getStore();
    this.createDeeplinkController = this.$inject('states/Deeplink.es6').createController;
    this.$rootScope = this.$inject('$rootScope');

    this.createController = function() {
      const $scope = this.$rootScope.$new();
      $scope.context = {};
      const promise = this.createDeeplinkController($scope);

      return { $scope, promise };
    };
  });

  it('should give generic error in case no link', function*() {
    this.search.returns({});
    const { $scope, promise } = this.createController();

    yield promise;

    expect($scope.status).toBe('not_exist');
  });

  describe('#api', () => {
    it('should redirect to the general api page if no keys', function*() {
      this.search.returns({ link: 'api' });
      this.store.set('lastUsedSpace', 'test2');
      this.getSpaces.resolves([{ sys: { id: 'test1' } }, { sys: { id: 'test2' } }]);
      this.canReadApiKeys.returns(true);
      this.apiKeys.resolves();
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['spaces', 'detail', 'api', 'keys', 'list'],
          params: {
            spaceId: 'test2'
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should redirect to the last used space', function*() {
      this.search.returns({ link: 'api' });
      this.getSpaces.resolves([{ sys: { id: 'test' } }]);
      this.canReadApiKeys.returns(true);
      this.apiKeys.resolves();
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['spaces', 'detail', 'api', 'keys', 'list'],
          params: {
            spaceId: 'test'
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should redirect to the first api key page if there are several', function*() {
      this.search.returns({ link: 'api' });
      this.getSpaces.resolves([{ sys: { id: 'test' } }]);
      this.canReadApiKeys.returns(true);
      const apiKeys = [{ sys: { id: 'first' } }, { sys: { id: 'second' } }];
      this.apiKeys.resolves(apiKeys);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['spaces', 'detail', 'api', 'keys', 'detail'],
          params: {
            spaceId: 'test',
            apiKeyId: 'first'
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should give generic error in case no access', function*() {
      this.search.returns({ link: 'api' });
      this.getSpaces.resolves([{ data: { sys: { id: 'test' } } }]);
      this.canReadApiKeys.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#invite', () => {
    it('should redirect to invite users page', function*() {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['account', 'organizations', 'users', 'new'],
          params: {
            orgId: 'some'
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should pick org of the first space in case expired lastUsedOrg', function*() {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some_obsolete_value');
      this.getOrganizations.resolves([{ sys: { id: 'new_org_id' } }]);
      this.getSpaces.resolves([
        {
          sys: { id: 'space_id' },
          organization: { sys: { id: 'new_org_id' } }
        }
      ]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['account', 'organizations', 'users', 'new'],
          params: {
            orgId: 'new_org_id'
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should give generic error in case no access', function*() {
      this.search.returns({ link: 'invite' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#users', () => {
    it('should redirect to users list page', function*() {
      this.search.returns({ link: 'users' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['account', 'organizations', 'users', 'list'],
          params: {
            orgId: 'some',
            pathSuffix: ''
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should give generic error in case no access', function*() {
      this.search.returns({ link: 'users' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#subscription', () => {
    it('should redirect to subscription page', function*() {
      this.search.returns({ link: 'subscription' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['account', 'organizations', 'subscription'],
          params: {
            orgId: 'some',
            pathSuffix: ''
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should give generic error in case no access', function*() {
      this.search.returns({ link: 'subscription' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });
  });

  describe('#org', () => {
    it('should redirect to org info page', function*() {
      this.search.returns({ link: 'org' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(true);
      yield this.createController().promise;

      expect(
        this.navigate.calledWith({
          path: ['account', 'organizations', 'edit'],
          params: {
            orgId: 'some',
            pathSuffix: ''
          },
          options: {
            location: 'replace'
          }
        })
      ).toBe(true);
    });

    it('should give generic error in case no access', function*() {
      this.search.returns({ link: 'org' });
      this.store.set('lastUsedOrg', 'some');
      this.getOrganizations.resolves([{ sys: { id: 'some' } }]);
      this.getOrganization.resolves();
      this.isOwnerOrAdmin.returns(false);
      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('not_exist');
    });

    it('should give a specific onboarding error', function*() {
      this.search.returns({ link: 'onboarding-explore' });
      this.getSpaces.resolves([
        {
          name: 'another name',
          sys: { id: 'space_id' }
        }
      ]);

      const { $scope, promise } = this.createController();
      yield promise;

      expect($scope.status).toBe('onboarding');
    });
  });
});
