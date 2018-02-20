import createMockSpaceEndpoint from 'test/helpers/mocks/SpaceEndpoint';

describe('The Locale list directive', function () {
  beforeEach(function () {
    this.flags = {
      'feature-bv-2018-01-resources-api': false
    };

    module('contentful/test', ($provide) => {
      $provide.removeDirectives('relative');
      $provide.value('$state', {current: '', href: () => {}});
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().callsFake((flagName) => {
          return Promise.resolve(this.flags[flagName]);
        })
      });
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
            locale: 2
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

    const endpoint = createMockSpaceEndpoint();
    endpoint.stores.resources.locale = {
      usage: 0,
      limits: {
        maximum: 0,
        included: 0
      },
      sys: {
        id: 'locale',
        type: 'SpaceResource'
      }
    };

    this.setUsageLimits = (usage, limit) => {
      this.organization.usage.permanent.locale = usage;
      endpoint.stores.resources.locale.usage = usage;

      this.organization.subscriptionPlan.limits.permanent.locale = limit;
      endpoint.stores.resources.locale.limits = {
        maximum: limit,
        included: limit
      };
    };

    this.mockService('services/TokenStore', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    this.mockService('TheAccountView', {
      getSubscriptionState: sinon.stub().returns({path: ['stateref']})
    });

    this.mockService('data/Endpoint', {
      createSpaceEndpoint: sinon.stub().callsFake(() => {
        return endpoint.request;
      })
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

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };

    spaceContext.space = {
      data: this.space,
      getId: sinon.stub().returns('1234'),
      getOrganizationId: sinon.stub().returns('id')
    };

    this.$scope = {
      context: {}
    };

    this.$rootScope = this.$inject('$rootScope');
    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves(locales);
    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.accessChecker.hasFeature = sinon.stub().resolves();

    this.compileElement = function () {
      this.container = this.$compile('<div cf-locale-list />', this.$scope);
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  it('the tab header add button is not shown', function () {
    this.compileElement();
    expect(this.container.find('.workbench-header__actions button.add-entity')).toBeNgHidden();
  });

  it('the tab header add button is shown if you are not at your locale limit', function* () {
    this.setUsageLimits(1, 10);
    this.accessChecker.hasFeature.resolves(true);
    this.compileElement();

    yield this.$q.resolve();
    // yield new Promise(resolve => setTimeout(resolve, 16));

    expect(this.container.find('.workbench-header__actions button.add-entity')).not.toBeNgHidden();
  });

  it('should show the sidebar if organization is pricing version 2', function* () {
    this.organization.pricingVersion = 'pricing_version_2';
    this.accessChecker.hasFeature.resolves(true);
    this.flags['feature-bv-2018-01-resources-api'] = true;

    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(1);
    expect(this.container.find('div.workbench-main__sidebar')).not.toBeNgHidden();
  });

  it('should not show the sidebar if organization is pricing version 1', function* () {
    this.organization.pricingVersion = 'pricing_version_1';
    this.accessChecker.hasFeature.resolves(true);
    this.compileElement();

    yield this.$q.resolve();

    expect(this.container.find('div.workbench-main__sidebar').length).toBe(0);
  });

  it('should disable the button in the sidebar if the limit is reached', function* () {
    this.organization.pricingVersion = 'pricing_version_2';
    this.flags['feature-bv-2018-01-resources-api'] = true;
    this.accessChecker.hasFeature.resolves(true);

    this.setUsageLimits(10, 10);
    this.compileElement();

    // I couldn't figure out a way to handle this.
    // TODO: Don't use setTimeout and promise
    yield new Promise(resolve => setTimeout(resolve, 200));

    expect(this.container.find('.workbench-main__sidebar button.add-entity').attr('disabled')).toBe('disabled');
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
