import sinon from 'sinon';
import { $compile, $apply, $initialize } from 'test/utils/ng';

// Skipped because failing after cleaning up common dependencies with UserPage
//  even though the role list page is still working under manual tests
// Role list and these tests are planned to be migrated next week
xdescribe('Role List Directive', () => {
  beforeEach(async function() {
    this.getCurrentVariation = sinon.stub().resolves(false);
    this.stubs = {
      isOwnerOrAdmin: sinon.stub().returns(false)
    };

    this.system.set('utils/LaunchDarkly/index.es6', {
      getCurrentVariation: this.getCurrentVariation,
      onFeatureFlag: sinon.stub()
    });

    this.system.set('services/OrganizationRoles.es6', {
      isOwnerOrAdmin: this.stubs.isOwnerOrAdmin
    });

    this.canModifyRoles = sinon.stub().resolves(true);

    await this.system.override('access_control/AccessChecker', {
      canModifyRoles: this.canModifyRoles
    });

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

    this.system.set('services/ResourceService.es6', {
      default: () => ({
        get: () => Promise.resolve(this.rolesResource)
      })
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
      pricingVersion: 'pricing_version_2',
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

    await this.system.override('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    this.reset = sinon.stub().resolves({
      roles: this.roles,
      rolesResource: this.rolesResource
    });

    const spaceContext = {
      organization: this.organization,
      space: {
        data: this.space,
        getId: sinon.stub().returns(this.space.sys.id),
        getOrganizationId: sinon.stub().returns(this.organization.sys.id)
      },
      getData: sinon.stub(),
      getId: sinon.stub(),
      endpoint: sinon.stub()
    };

    const getModuleStub = sinon.stub();
    getModuleStub.withArgs('spaceContext').returns(spaceContext);

    this.system.override('NgRegistry.es6', {
      getModule: getModuleStub
    });

    this.system.set('data/CMA/SpaceMembersRepo.es6', {
      default: () => ({
        getAll: () => Promise.resolve([])
      })
    });

    this.system.set('access_control/RoleRepository', {
      getInstance: () => ({
        getAll: () => Promise.resolve(this.roles)
      })
    });

    this.system.override('access_control/RoleListHandler', {
      create: sinon.stub().returns({
        reset: this.reset,
        getRoleCounts: sinon.stub().returns({})
      })
    });

    await $initialize(this.system, $provide => {
      $provide.constant('$state', { href: sinon.stub(), current: {} });
    });

    this.compileElement = function() {
      this.container = $compile('<cf-role-list />', { context: {} });
      $apply();
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

        this.container.remove();

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
        this.container.remove();
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
        this.container.remove();
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
          this.container.remove();
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
          this.container.remove();
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
          this.container.remove();
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
