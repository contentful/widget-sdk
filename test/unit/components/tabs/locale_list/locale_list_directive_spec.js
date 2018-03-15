describe('The Locale list directive', function () {
  beforeEach(function () {
    this.flags = {
      'feature-bv-2018-01-resources-api': false
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

    this.featureEnabled = true;

    module('contentful/test', ($provide) => {
      $provide.removeDirectives('relative');
      $provide.value('$state', {current: '', href: () => {}});
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().callsFake((flagName) => {
          return Promise.resolve(this.flags[flagName]);
        })
      });
      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: sinon.stub().resolves(this.resource)
          };
        }
      });

      $provide.value('services/FeatureService', {
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
    });

    const OrganizationRoles = this.$inject('services/OrganizationRoles');
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

    this.mockService('services/TokenStore', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    this.mockService('TheAccountView', {
      getSubscriptionState: sinon.stub().returns({path: ['stateref']})
    });

    this.container = null;
    this.compileElement = null;
    this.$q = this.$inject('$q');

    const locales = [
      {
        sys: {id: 1},
        name: 'English',
        code: 'en-US',
        default: true,
        contentManagementApi: true,
        contentDeliveryApi: true,
        optional: false,
        fallbackCode: null
      },
      {
        sys: {id: 2},
        name: 'German',
        code: 'de-DE',
        default: false,
        contentManagementApi: false,
        contentDeliveryApi: false,
        optional: true,
        fallbackCode: 'en-US'
      },
      {
        sys: {id: 3},
        name: 'Polish',
        code: 'pl-PL',
        default: false,
        contentManagementApi: true,
        contentDeliveryApi: false
      },
      {
        sys: {id: 4},
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
      user: this.spaceUser,
      getId: sinon.stub().returns('space_1234')
    };

    this.$scope = {
      context: {}
    };

    this.$rootScope = this.$inject('$rootScope');
    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves(locales);

    this.compileElement = function () {
      this.container = this.$compile('<div cf-locale-list />', this.$scope);
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  it('the tab header add button is not shown', function () {
    this.featureEnabled = false;
    this.compileElement();
    expect(this.container.find('.workbench-header__actions button.add-entity')).toBeNgHidden();
  });

  it('the tab header add button is shown if you are not at your locale limit', function* () {
    this.setUsageLimits(1, 10);
    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('.workbench-header__actions button.add-entity')).not.toBeNgHidden();
  });

  it('should show the sidebar if organization is pricing version 2', function* () {
    this.organization.pricingVersion = 'pricing_version_2';
    this.flags['feature-bv-2018-01-resources-api'] = true;

    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(1);
    expect(this.container.find('div.workbench-main__sidebar')).not.toBeNgHidden();
  });

  it('should not show the sidebar if organization is pricing version 1', function* () {
    this.organization.pricingVersion = 'pricing_version_1';
    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(0);
  });

  it('should disable the button in the sidebar if the limit is reached', function* () {
    this.organization.pricingVersion = 'pricing_version_2';
    this.flags['feature-bv-2018-01-resources-api'] = true;

    this.setUsageLimits(10, 10);
    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('.workbench-main__sidebar button.add-entity').attr('disabled')).toBe('disabled');
  });

  describe('the UX', function () {
    beforeEach(function () {
      this.organization.pricingVersion = 'pricing_version_2';
      this.flags['feature-bv-2018-01-resources-api'] = true;
      });

    describe('with limit of 1', function () {
      beforeEach(function* () {
        // You will always be at the limit with 1 locale, as a space
        // is always created with a default locale
        this.setUsageLimits(1, 1);
        this.compileElement();

        yield this.$q.resolve();

        this.sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
      });

      it('should show singular "locale"', function () {
        const text = this.sidebar.find('> p.entity-sidebar__text-profile').eq(0).text();

        expect(text).toBe('You are using 1 out of 1 locale in your space.');
      });
    });

    describe('with a limit over 1', function () {
      beforeEach(function* () {
        this.setUsageLimits(1, 3);
        this.compileElement();

        yield this.$q.resolve();

        this.sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
      });

      it('should show plural "locales"', function () {
        const text = this.sidebar.find('> p.entity-sidebar__text-profile').eq(0).text();

        expect(text).toBe('You are using 1 out of 3 locales in your space.');
      });
    });

    describe('when hitting your limit', function () {
      beforeEach(function () {
        this.setUsageLimits(3, 3);
      });

      it('should not ask you to delete a locale if you only have one available', function* () {
        this.setUsageLimits(1, 1);

        this.setRole('owner');
        this.compileElement();
        yield this.$q.resolve();

        const sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
        const text = sidebar.find('> p.entity-sidebar__text-profile').eq(1).text();

        expect(text).toBe("You've reached the space locales limit. Upgrade to add more locales.");
      });

      it('should tell you to upgrade if you are an org admin', function* () {
        this.setRole('admin');
        this.compileElement();
        yield this.$q.resolve();

        const sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
        const text = sidebar.find('> p.entity-sidebar__text-profile').eq(1).text();

        expect(text).toBe("You've reached the space locales limit. Upgrade to add more locales, or delete an existing locale.");
      });

      it('should tell you to upgrade if you are an org owner', function* () {
        this.setRole('owner');
        this.compileElement();
        yield this.$q.resolve();

        const sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
        const text = sidebar.find('> p.entity-sidebar__text-profile').eq(1).text();

        expect(text).toBe("You've reached the space locales limit. Upgrade to add more locales, or delete an existing locale.");
      });

      it('should tell you to contact the admin if you are not org admin/owner', function* () {
        this.setRole('editor');
        this.compileElement();
        yield this.$q.resolve();

        const sidebar = this.container.find('.workbench-main__sidebar > .entity-sidebar');
        const text = sidebar.find('> p.entity-sidebar__text-profile').eq(1).text();

        expect(text).toBe("You've reached the space locales limit. Contact the admin or owner of this space to upgrade the space, or delete an existing locale.");
      });
    });
  });

  describe('list of locales', function () {
    beforeEach(function () {
      this.compileElement();
      this.list = this.container.find('.table tbody');
    });

    it('show locales fetched with spaceContext', function () {
      expect(this.list.find('tr').length).toBe(4);
    });

    describe('locale info and flags', function () {
      beforeEach(function () {
        this.tableCell = this.list.find('td');
      });

      it('shows fallback locale', function () {
        expect(this.tableCell.get(1).textContent).toBe('None');
        expect(this.tableCell.get(6).textContent).toBe('English (en-US)');
      });

      it('shows if available via CDA', function () {
        expect(this.tableCell.get(2).textContent).toBe('Enabled');
        expect(this.tableCell.get(7).textContent).toBe('Disabled');
      });

      it('shows if available via CMA', function () {
        expect(this.tableCell.get(3).textContent).toBe('Enabled');
        expect(this.tableCell.get(8).textContent).toBe('Disabled');
      });

      it('shows if optional for publishing', function () {
        expect(this.tableCell.get(4).textContent).toBe('Content is required');
        expect(this.tableCell.get(9).textContent).toBe('Can be published empty');
      });
    });
  });
});
