describe('Role List Controller', () => {
  beforeEach(function () {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.basicErrorHandler = this.$inject('ReloadNotification').basicErrorHandler;

    this.canModifyRoles = sinon.stub().resolves(true);
    this.$inject('access_control/AccessChecker').canModifyRoles = this.canModifyRoles;

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

    this.OrganizationRoles = this.$inject('services/OrganizationRoles');
    this.OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(false);

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

    this.setLimit = (usage, limit) => {
      this.rolesResource.usage = usage;
      this.rolesResource.limits.maximum = limit;
    };
  });

  describe('loading roles', () => {
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

  describe('reaching the limit', () => {
    it('flags as true if limit has been reached', function () {
      this.setLimit(5, 5);
      this.createController();

      expect(this.scope.reachedLimit).toBe(true);
    });

    it('flags as false if limit has not been reached', function () {
      this.setLimit(1, 5);
      this.createController();
      expect(this.scope.reachedLimit).toBe(false);
    });

    it('flags if the user can upgrade the plan', function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
      this.createController();
      expect(this.scope.canUpgrade).toBe(true);
    });

    it('flags if the user cannot upgrade the plan', function () {
      this.createController();
      expect(this.scope.canUpgrade).toBe(false);
    });
  });

  describe('duplicating role', () => {
    it('should be able to successfully duplicate a role', function () {
      this.createController();
      const $state = this.$inject('$state');
      $state.go = sinon.spy();
      const role = {sys: {id: 'foobar'}};
      this.scope.duplicateRole(role);
      sinon.assert.calledWith($state.go, '^.new', {baseRoleId: 'foobar'});
    });
  });

  describe('reset fails', () => {
    beforeEach(function () {
      this.reset.rejects({statusCode: 500});
      this.createController();
    });

    it('results in an error message', function () {
      sinon.assert.called(this.basicErrorHandler);
    });
  });
});
