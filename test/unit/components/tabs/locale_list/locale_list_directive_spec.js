'use strict';

fdescribe('The Locale list directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.value('$state', {current: '', href: () => {}});
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

    this.organization = {
      usage: {
        permanent: {}
      },
      subscriptionPlan: {
        limits: {
          features: {},
          permanent: {}
        }
      }
    };

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };

    spaceContext.space = this.space = {
      data: {
        sys: {createdBy: {sys: {id: '1234'}}},
        organization: this.organization
      },
      getId: sinon.stub().returns('1234'),
      getOrganizationId: sinon.stub().returns('id')
    };

    this.$rootScope = this.$inject('$rootScope');
    this.$scope = this.$rootScope.$new();
    this.$scope.context = {};

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves(locales);
    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.accessChecker.hasFeature = sinon.stub().resolves();

    this.compileElement = function () {
      this.container = this.$compile('<div cf-locale-list />', {
        $scope: this.$scope
      });
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  it('the tab header add button is not shown', function () {
    this.compileElement();
    expect(this.container.find('button.add-entity')).toBeNgHidden();
  });

  fit('the tab header add button is shown', function () {
    this.organization.usage.permanent.locale = 1;
    this.organization.subscriptionPlan.limits.permanent.locale = 10;
    this.accessChecker.hasFeature.resolves(true);
    this.compileElement();
    this.$flush();
    this.$apply();
    this.$rootScope.$digest();
    this.$scope.$apply();
    debugger;

    // yield new Promise((resolve, reject) => {
    //   const start = Date.now();

    //   const test = () => {
    //     if (this.$scope.context.ready) {
    //       return resolve();
    //     }

    //     if (Date.now() - start >= 20000) {
    //       return reject(new Error('Controller was not ready in time'));
    //     }

    //     setTimeout(test, 500);
    //   };

    //   test();
    // });


    expect(this.container.find('button.add-entity')).not.toBeNgHidden();
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
