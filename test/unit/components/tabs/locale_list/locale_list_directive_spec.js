describe('The Locale list directive', () => {
  beforeEach(function() {
    this.flags = {
      'feature-bv-2018-01-resources-api': false,
      'feature-bv-06-2018-incentivize-upgrade': false
    };

    this.spaceUser = {
      organizationMemberships: [
        {
          role: 'owner',
          organization: {
            sys: {
              id: 'org_1234'
            }
          }
        }
      ]
    };

    this.organization = {
      pricingVersion: 'pricing_version_1',
      sys: {
        id: 'org_1234'
      }
    };

    this.environment = {
      sys: {
        id: 'master'
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

    this.resource = {
      usage: 0,
      limits: {
        included: 0,
        maximum: 0
      }
    };

    this.showChangeSpaceDialog = sinon.stub().yieldsTo('onSubmit');

    this.stubs = {
      ResourceService: {
        get: sinon.stub().resolves(this.resource)
      }
    };

    this.featureEnabled = true;

    module('contentful/test', $provide => {
      $provide.removeDirectives('relative');
      $provide.value('$state', { current: '', href: () => {} });
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().callsFake(flagName => {
          return Promise.resolve(this.flags[flagName]);
        }),
        onFeatureFlag: sinon.stub().callsFake((_, flagName, cb) => {
          cb(this.flags[flagName]);
        })
      });

      $provide.value('services/ResourceService.es6', {
        default: () => {
          return {
            get: this.stubs.ResourceService.get
          };
        }
      });

      $provide.value('services/FeatureService.es6', {
        default: () => {
          return {
            get: sinon.stub().resolves({
              enabled: this.featureEnabled,
              sys: {
                id: 'multiple_locales',
                type: 'SpaceFeature'
              }
            })
          };
        }
      });

      $provide.value('utils/EnvironmentUtils.es6', {
        isInsideMasterEnv: () => {
          return this.environment.sys.id === 'master';
        }
      });

      $provide.value('services/ChangeSpaceService.es6', {
        showDialog: this.showChangeSpaceDialog
      });
    });

    const OrganizationRoles = this.$inject('services/OrganizationRoles.es6');
    OrganizationRoles.setUser(this.spaceUser);

    this.setUsageLimits = (usage, limit) => {
      this.resource.usage = usage;
      this.resource.limits.included = limit;
      this.resource.limits.maximum = limit;
    };

    this.setRole = role => {
      this.spaceUser.organizationMemberships[0].role = role;
      OrganizationRoles.setUser(this.spaceUser);
    };

    this.mockService('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    this.mockService('TheAccountView', {
      getSubscriptionState: sinon.stub().returns({ path: ['stateref'] })
    });

    this.container = null;
    this.compileElement = null;
    this.$q = this.$inject('$q');

    const locales = [
      {
        sys: { id: 1 },
        name: 'English',
        code: 'en-US',
        default: true,
        contentManagementApi: true,
        contentDeliveryApi: true,
        optional: false,
        fallbackCode: null
      },
      {
        sys: { id: 2 },
        name: 'German',
        code: 'de-DE',
        default: false,
        contentManagementApi: false,
        contentDeliveryApi: false,
        optional: true,
        fallbackCode: 'en-US'
      },
      {
        sys: { id: 3 },
        name: 'Polish',
        code: 'pl-PL',
        default: false,
        contentManagementApi: true,
        contentDeliveryApi: false
      },
      {
        sys: { id: 4 },
        name: 'Tajik',
        code: 'tg-TG',
        default: false,
        contentManagementApi: false,
        contentDeliveryApi: true
      }
    ];

    // Set the user

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };

    spaceContext.space = {
      data: this.space,
      environment: this.environment,
      user: this.spaceUser,
      getId: sinon.stub().returns('space_1234')
    };

    this.$scope = {
      context: {}
    };

    this.$rootScope = this.$inject('$rootScope');
    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves(locales);

    this.compileElement = function() {
      this.container = this.$compile('<div cf-locale-list />', this.$scope);
    };

    this.getSidebar = function() {
      return this.container.find('.workbench-main__sidebar > .entity-sidebar');
    };
  });

  afterEach(function() {
    this.container.remove();
  });

  it('the tab header add button is not shown', function() {
    this.featureEnabled = false;
    this.compileElement();
    expect(this.container.find('.workbench-header__actions button.add-entity')).toBeNgHidden();
  });

  it('the tab header add button is shown if you are not at your locale limit', async function() {
    this.setUsageLimits(1, 10);
    this.compileElement();

    await this.$q.resolve();

    expect(this.container.find('.workbench-header__actions button.add-entity')).not.toBeNgHidden();
  });

  it('should show the sidebar if organization is pricing version 2', async function() {
    this.organization.pricingVersion = 'pricing_version_2';
    this.flags['feature-bv-2018-01-resources-api'] = true;

    this.compileElement();

    await this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(1);
    expect(this.container.find('div.workbench-main__sidebar')).not.toBeNgHidden();
  });

  it('should not show the sidebar if organization is pricing version 1', async function() {
    this.organization.pricingVersion = 'pricing_version_1';
    this.compileElement();

    await this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(0);
  });

  it('should not display the add button in the sidebar if the limit is reached', async function() {
    this.organization.pricingVersion = 'pricing_version_2';
    this.flags['feature-bv-2018-01-resources-api'] = true;

    this.setUsageLimits(10, 10);
    this.compileElement();

    await this.$q.resolve();

    expect(this.container.find('.workbench-main__sidebar button.add-entity').length).toBe(0);
  });

  describe('inside non-master environment', () => {
    beforeEach(function() {
      this.environment.sys.id = 'dev';
    });

    it('should not call the API', async function() {
      this.compileElement();

      await this.$q.resolve();

      expect(this.stubs.ResourceService.get.called).toBe(false);
    });

    it('should not set the usage state', async function() {
      this.compileElement();

      await this.$q.resolve();

      expect(this.$scope.localesUsageState).toBeUndefined();
    });
  });

  describe('the UX', () => {
    beforeEach(function() {
      this.organization.pricingVersion = 'pricing_version_2';
      this.flags['feature-bv-2018-01-resources-api'] = true;
    });

    describe('inside of a non-master environment', () => {
      beforeEach(function() {
        this.environment.sys.id = 'dev';
      });

      it('should always allow creation of locales', async function() {
        // Force reaching the limit
        this.setUsageLimits(3, 3);
        this.compileElement();

        await this.$q.resolve();

        const sidebar = this.getSidebar();
        expect(sidebar.find('button.add-entity').length).toBe(1);
        expect(sidebar.find('button.add-entity').attr('disabled')).toBeUndefined();
      });
    });

    describe('with limit of 1', () => {
      beforeEach(async function() {
        // You will always be at the limit with 1 locale, as a space
        // is always created with a default locale
        this.setUsageLimits(1, 1);
        this.compileElement();

        await this.$q.resolve();
      });

      it('should show singular "locale"', function() {
        const sidebar = this.getSidebar();
        const text = sidebar
          .find('.entity-sidebar__text-profile > p')
          .eq(0)
          .text();

        expect(text).toBe('You are using 1 out of 1 locale available in this space.');
      });
    });

    describe('with a limit over 1', () => {
      beforeEach(async function() {
        this.setUsageLimits(1, 3);
        this.compileElement();

        await this.$q.resolve();

        this.sidebar = this.getSidebar();
      });

      it('should show plural "locales"', function() {
        const text = this.sidebar
          .find('.entity-sidebar__text-profile > p')
          .eq(0)
          .text();

        expect(text).toBe('You are using 1 out of 3 locales available in this space.');
      });
    });

    describe('when hitting your limit', () => {
      beforeEach(function() {
        this.setUsageLimits(3, 3);

        this.compileAndGetSidebar = async function() {
          this.compileElement();
          await this.$q.resolve();

          return this.getSidebar();
        };
      });

      function getChangeSpaceText(sidebar) {
        return sidebar
          .find('div[data-test-id="change-space-block"] > p')
          .eq(0)
          .text();
      }

      describe('with incentivize upgrade feature on', () => {
        function getChangeSpaceButton(sidebar) {
          return sidebar.find("button[data-test-id='locales-change']");
        }

        beforeEach(function() {
          this.flags['feature-bv-06-2018-incentivize-upgrade'] = true;
        });

        it('should not ask you to delete a locale if you only have one available', async function() {
          this.setUsageLimits(1, 1);
          this.setRole('owner');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe('Change the space to add more.');
          expect(getChangeSpaceButton(sidebar).length).toBe(1);
        });

        it('should tell you to change if you are an org admin', async function() {
          this.setRole('admin');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or change the space to add more.'
          );
          expect(getChangeSpaceButton(sidebar).length).toBe(1);
        });

        it('should tell you to change if you are an org owner', async function() {
          this.setRole('owner');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or change the space to add more.'
          );
          expect(getChangeSpaceButton(sidebar).length).toBe(1);
        });

        it('should tell you to contact the admin if you are not org admin/owner', async function() {
          this.setRole('editor');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or ask the administrator of your organization to change the space to add more.'
          );
          expect(getChangeSpaceButton(sidebar).length).toBe(0);
        });

        it('should open change dialog', async function() {
          this.setRole('owner');

          const sidebar = await this.compileAndGetSidebar();
          getChangeSpaceButton(sidebar).click();

          sinon.assert.calledOnce(this.showChangeSpaceDialog);
        });
        it('should reload resources after the space is changed', async function() {
          this.setRole('owner');

          const sidebar = await this.compileAndGetSidebar();

          sinon.assert.calledOnce(this.stubs.ResourceService.get);

          getChangeSpaceButton(sidebar).click();

          sinon.assert.calledTwice(this.stubs.ResourceService.get);
        });
      });

      describe('with incentivize change feature off', () => {
        function getUpgradeLink(sidebar) {
          return sidebar.find('.upgrade-link');
        }

        beforeEach(function() {
          this.flags['feature-bv-06-2018-incentivize-upgrade'] = false;
        });

        it('should tell you to change if you are an org admin', async function() {
          this.setRole('admin');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or change the space to add more.'
          );
          expect(getUpgradeLink(sidebar).length).toBe(1);
        });

        it('should tell you to change if you are an org owner', async function() {
          this.setRole('owner');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or change the space to add more.'
          );
          expect(getUpgradeLink(sidebar).length).toBe(1);
        });

        it('should tell you to contact the admin if you are not org admin/owner', async function() {
          this.setRole('editor');

          const sidebar = await this.compileAndGetSidebar();

          expect(getChangeSpaceText(sidebar)).toBe(
            'Delete an existing locale or ask the administrator of your organization to change the space to add more.'
          );
          expect(getUpgradeLink(sidebar).length).toBe(0);
        });
      });
    });
  });

  describe('list of locales', () => {
    beforeEach(function() {
      this.compileElement();
      this.list = this.container.find('.table tbody');
    });

    it('show locales fetched with spaceContext', function() {
      expect(this.list.find('tr').length).toBe(4);
    });

    describe('locale info and flags', () => {
      beforeEach(function() {
        this.tableCell = this.list.find('td');
      });

      it('shows fallback locale', function() {
        expect(this.tableCell.get(1).textContent).toBe('None');
        expect(this.tableCell.get(6).textContent).toBe('English (en-US)');
      });

      it('shows if available via CDA', function() {
        expect(this.tableCell.get(2).textContent).toBe('Enabled');
        expect(this.tableCell.get(7).textContent).toBe('Disabled');
      });

      it('shows if available via CMA', function() {
        expect(this.tableCell.get(3).textContent).toBe('Enabled');
        expect(this.tableCell.get(8).textContent).toBe('Disabled');
      });

      it('shows if optional for publishing', function() {
        expect(this.tableCell.get(4).textContent).toBe('Content is required');
        expect(this.tableCell.get(9).textContent).toBe('Can be published empty');
      });
    });
  });
});
