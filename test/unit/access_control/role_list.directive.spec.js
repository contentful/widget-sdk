'use strict';

describe('Role List Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.basicErrorHandler = this.$inject('ReloadNotification').basicErrorHandler;
    this.$inject('access_control/AccessChecker').canModifyRoles = sinon.stub().resolves(true);

    this.scope.context = {};
    this.roles = [{
      name: 'Editor',
      sys: {
        id: '123'
      }
    }, {
      name: 'Author',
      sys: {
        id: '321'
      }
    }, {
      name: 'Developer',
      sys: {
        id: '213'
      }
    }];

    this.rolesResource = {
      limits: {
        included: 5,
        maximum: 5
      },
      usage: 2
    };

    const UserListHandler = this.$inject('UserListHandler');
    this.reset = sinon.stub().resolves({
      roles: this.roles,
      rolesResource: this.rolesResource
    });
    UserListHandler.create = sinon.stub().returns({
      reset: this.reset,
      getMembershipCounts: sinon.stub().returns({})
    });

    this.organization = {
      usage: {
        permanent: {
          locale: 1
        }
      },
      subscriptionPlan: {
        limits: {
          features: {},
          permanent: {
            locale: 1
          }
        }
      },
      sys: {
        id: 'org_1234'
      }
    };

    this.space = {
      sys: {
        id: 'space_1234',
        createdBy: {
          sys: {
            id: '1234'
          }
        }
      },
      organization: this.organization
    };

    this.mockService('services/TokenStore', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };
    spaceContext.subscription = {
      isTrial: sinon.stub().returns(false),
      hasTrialEnded: sinon.stub().returns(false)
    };

    spaceContext.space = {
      data: this.space,
      getId: sinon.stub().returns(this.space.sys.id),
      getOrganizationId: sinon.stub().returns(this.organization.sys.id)
    };

    this.createController = () => {
      this.$inject('$controller')('RoleListController', {$scope: this.scope});
      this.$apply();
    };
  });

  describe('refreshing roles', function () {
    beforeEach(function () {
      this.createController();
    });

    it('calls reset on initialization', function () {
      sinon.assert.calledOnce(this.reset);
    });

    it('places roles on scope', function () {
      expect(this.scope.roles.map(role => role.name)).toEqual(['Author', 'Developer', 'Editor']);
    });

    it('exposes usage and limit in the scope', function () {
      expect(this.scope.usage).toBe(2);
      expect(this.scope.limit).toBe(5);
    });
  });

  describe('refreshing locales fails', function () {
    beforeEach(function () {
      this.reset.rejects({statusCode: 500});
      this.createController();
    });

    it('results in an error message', function () {
      sinon.assert.called(this.basicErrorHandler);
    });
  });
});
