describe('Role List Directive', () => {
  beforeEach(function() {
    this.getCurrentVariation = sinon.stub().resolves(false);
    this.stubs = {
      isOwnerOrAdmin: sinon.stub().returns(false)
    };

    module('contentful/test', $provide => {
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: this.getCurrentVariation
      });
      $provide.value('$state', { href: sinon.stub(), current: {} });

      $provide.value('services/OrganizationRoles.es6', {
        isOwnerOrAdmin: this.stubs.isOwnerOrAdmin
      });
    });
    this.basicErrorHandler = this.$inject('ReloadNotification').basicErrorHandler;

    this.canModifyRoles = sinon.stub().resolves(true);
    this.$inject('access_control/AccessChecker').canModifyRoles = this.canModifyRoles;
    this.$inject('utils/LaunchDarkly').onFeatureFlag = sinon.stub();

    this.roles = [
      {
        name: 'Editor',
        sys: {
          id: '123'
        }
      },
      {
        name: 'Author',
        sys: {
          id: '321'
        }
      },
      {
        name: 'Developer',
        sys: {
          id: '213'
        }
      }
    ];

    this.rolesResource = {
      limits: {
        included: 5,
        maximum: 5
      },
      usage: 2
    };

    this.reset = sinon.stub().resolves({
      roles: this.roles,
      rolesResource: this.rolesResource
    });

    this.mockService('TheAccountView', {
      getSubscriptionState: sinon.stub().returns({ path: ['stateref'] })
    });

    const UserListHandler = this.$inject('UserListHandler');

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

    this.mockService('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organization = this.organization;

    spaceContext.space = {
      data: this.space,
      getId: sinon.stub().returns(this.space.sys.id),
      getOrganizationId: sinon.stub().returns(this.organization.sys.id)
    };

    this.compileElement = function() {
      this.container = this.$compile('<cf-role-list />', { context: {} });
      this.$apply();
    };

    this.getButton = () => this.container.find('button:contains("Create new role")');

    this.setUsageLimits = (usage, limit) => {
      this.rolesResource.usage = usage;
      this.rolesResource.limits.maximum = limit;
    };

    this.toggleLegacy = isLegacy => {
      if (isLegacy) {
        this.organization.pricingVersion = 'pricing_version_1';
        this.getCurrentVariation.resolves(false);
      } else {
        this.organization.pricingVersion = 'pricing_version_2';
        this.getCurrentVariation.resolves(true);
      }
    };
  });

  afterEach(function() {
    this.container.remove();
  });

  describe('the UX', () => {
    describe('for a user that cannot modify roles', () => {
      it('should not show the Add Role button', function() {
        this.canModifyRoles.resolves(false);

        this.toggleLegacy(true);
        this.compileElement();

        expect(this.getButton().length).toBe(0);

        this.toggleLegacy(false);
        this.compileElement();

        expect(this.getButton().length).toBe(0);
      });
    });

    describe('for a user that can modify roles', () => {
      it('should show the Add Role button', function() {
        this.canModifyRoles.resolves(true);

        this.toggleLegacy(true);
        this.compileElement();

        expect(this.getButton().length).toBe(1);

        this.toggleLegacy(false);
        this.compileElement();

        expect(this.getButton().length).toBe(1);
      });

      it('should show the usage and limits', function() {
        let text;

        this.setUsageLimits(1, 3);

        this.toggleLegacy(true);
        this.compileElement();

        text = this.container
          .find('.entity-sidebar > p')
          .eq(0)
          .text();

        expect(text).toBe('Your organization is using 1 out of 3 available roles.');

        this.toggleLegacy(false);
        this.compileElement();

        text = this.container
          .find('.entity-sidebar > p')
          .eq(0)
          .text();

        expect(text).toBe('Your space is using 1 out of 3 available roles.');
      });

      describe('when hitting the limit', () => {
        beforeEach(function() {
          this.setUsageLimits(3, 3);
        });

        it('should show an upgrade button if the user is an org admin/owner', function() {
          let text;

          this.stubs.isOwnerOrAdmin.returns(true);

          this.toggleLegacy(true);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe('Upgrade to add more roles, or delete an existing role.');

          this.toggleLegacy(false);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe('Upgrade to add more roles, or delete an existing role.');
        });

        it('should tell the user to contact the org admin/owner if only a member', function() {
          let text;

          this.stubs.isOwnerOrAdmin.returns(false);

          this.toggleLegacy(true);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe(
            'Contact the admin of this organization to upgrade the organization, or delete an existing role.'
          );

          this.toggleLegacy(false);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe(
            'Contact the admin of this space to upgrade the space, or delete an existing role.'
          );
        });

        it('should not tell the user to delete an existing role if the limit is one', function() {
          let text;

          this.setUsageLimits(1, 1);

          this.toggleLegacy(true);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe('Contact the admin of this organization to upgrade the organization.');

          this.toggleLegacy(false);
          this.compileElement();

          text = this.container
            .find('.entity-sidebar > p:eq(1) > span')
            .eq(1)
            .text();

          expect(text).toBe('Contact the admin of this space to upgrade the space.');
        });
      });
    });
  });
});
