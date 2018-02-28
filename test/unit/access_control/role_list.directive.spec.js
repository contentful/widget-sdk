describe('Role List Directive', function () {
  beforeEach(function () {
    this.getCurrentVariation = sinon.stub().resolves(false);

    module('contentful/test', ($provide) => {
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: this.getCurrentVariation
      });
    });
    this.basicErrorHandler = this.$inject('ReloadNotification').basicErrorHandler;

    this.canModifyRoles = sinon.stub().resolves(true);
    this.$inject('access_control/AccessChecker').canModifyRoles = this.canModifyRoles;

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

    this.reset = sinon.stub().resolves({
      roles: this.roles,
      rolesResource: this.rolesResource
    });

    const UserListHandler = this.$inject('UserListHandler');

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

    this.compileElement = function () {
      this.container = this.$compile('<cf-role-list />', { context: {} });
      this.$apply();
    };

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

  afterEach(function () {
    this.container.remove();
  });

  describe('the UX', function () {
    describe('for Version 1 organization', function () {
      beforeEach(function () {
        this.toggleLegacy(true);
      });

      describe('for a user that cannot modify roles', function () {
        it('should not show the Add Role button', function () {
          this.canModifyRoles.resolves(false);
          this.compileElement();

          expect(this.container.find('.entity-sidebar button').length).toBe(0);
        });
      });

      describe('for a user that can modify roles', function () {
        it('should show the Add Role button', function () {
          this.canModifyRoles.resolves(true);
          this.compileElement();

          expect(this.container.find('.entity-sidebar button').length).toBe(1);
        });

        it('should show the usage and limits', function () {
          this.setUsageLimits(1, 3);
          this.compileElement();

          const text = this.container.find('.entity-sidebar > p').eq(0).text();

          expect(text).toBe('Your organization is using 1 out of 3 available roles.');
        });

        describe('when hitting the limit', function () {
          beforeEach(function () {
            this.setUsageLimits(3, 3);
          });

          it('should show an upgrade button if the user is an org admin/owner', function () {
            this.OrganizationRoles.isOwnerOrAdmin.returns(true);
            this.compileElement();

            const text = this.container.find('.entity-sidebar > p:eq(1) > span').eq(1).text();

            expect(text).toBe('Upgrade to add more locales, or delete an existing locale.');
          });

          it('should tell the user to contact the org admin/owner if only a member', function () {
            this.OrganizationRoles.isOwnerOrAdmin.returns(false);
            this.compileElement();

            const text = this.container.find('.entity-sidebar > p:eq(1) > span').eq(1).text();

            expect(text).toBe('Contact the admin of this organization to upgrade the organization, or delete an existing locale.');
          });

          it('should not tell the user to delete an existing role if the limit is one', function () {
            this.setUsageLimits(1, 1);
            this.compileElement();

            const text = this.container.find('.entity-sidebar > p:eq(1) > span').eq(1).text();

            expect(text).toBe('Contact the admin of this organization to upgrade the organization.');
          });
        });
      });
    });

    describe('Version 2 organization', function () {
      beforeEach(function () {
        this.toggleLegacy(false);
      });

      it('should not show the Add Role button regardless of ability to modify roles', function () {
        // If user cannot modify
        this.canModifyRoles.resolves(false);
        this.compileElement();
        expect(this.container.find('.entity-sidebar button').length).toBe(0);

        // If user can modify
        this.canModifyRoles.resolves(true);
        this.compileElement();
        expect(this.container.find('.entity-sidebar button').length).toBe(0);
      });
    });
  });
});
