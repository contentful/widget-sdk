'use strict';

describe('The Locale list directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
    });

    this.container = null;
    this.compileElement = null;
    this.$q = this.$inject('$q');

    var locales = [
      {
        getId: sinon.stub().returns(1),
        getName: sinon.stub(),
        getCode: sinon.stub(),
        isDefault: sinon.stub().returns(true),
        data: {
          contentManagementApi: true,
          contentDeliveryApi: true,
          optional: false
        }
      },
      {
        getId: sinon.stub().returns(2),
        getName: sinon.stub(),
        getCode: sinon.stub(),
        isDefault: sinon.stub().returns(false),
        data: {
          contentManagementApi: false,
          contentDeliveryApi: false,
          optional: true
        }
      },
      {
        getId: sinon.stub().returns(3),
        getName: sinon.stub(),
        getCode: sinon.stub(),
        isDefault: sinon.stub().returns(false),
        data: {
          contentManagementApi: true,
          contentDeliveryApi: false
        }
      },
      {
        getId: sinon.stub().returns(4),
        getName: sinon.stub(),
        getCode: sinon.stub(),
        isDefault: sinon.stub().returns(false),
        data: {
          contentManagementApi: false,
          contentDeliveryApi: true
        }
      }
    ];

    this.scope = this.$inject('$rootScope').$new();
    this.scope.context = {};

    this.$inject('spaceContext').space = this.space = {
      data: {
        sys: {createdBy: {sys: {id: ''}}},
        organization: {
          usage: {permanent: {}},
          subscriptionPlan: {
            limits: {
              features: {},
              permanent: {}
            }
          }
        }
      },
      getLocales: sinon.stub().returns(this.$q.resolve(locales)),
      getOrganizationId: sinon.stub().returns('id')
    };

    this.compileElement = function () {
      this.container = $('<div cf-locale-list></div>');
      this.$inject('$compile')(this.container)(this.scope);
      this.scope.$digest();
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  it('the tab header add button is not shown', function () {
    this.compileElement();
    expect(this.container.find('button.add-entity')).toBeNgHidden();
  });

  it('the tab header add button is shown', function () {
    this.space.data.organization.usage.permanent.locale = 1;
    this.space.data.organization.subscriptionPlan.limits.permanent.locale = 10;
    this.space.data.organization.subscriptionPlan.limits.features.multipleLocales = true;
    this.compileElement();
    expect(this.container.find('button.add-entity')).not.toBeNgHidden();
  });

  describe('list of locales', function () {
    beforeEach(function () {
      this.compileElement();
      this.list = this.container.find('.main-results-wrapper tbody');
    });

    it('list has 4 elements', function () {
      expect(this.list.find('tr').length).toBe(4);
    });

    describe('locale flags', function () {
      beforeEach(function () {
        this.tableCell = this.list.find('td');
      });

      it('available via CDA', function () {
        expect(this.tableCell.get(2).textContent).toMatch('Enabled');
        expect(this.tableCell.get(7).textContent).toMatch('Disabled');
      });

      it('available via CMA', function () {
        expect(this.tableCell.get(3).textContent).toMatch('Enabled');
        expect(this.tableCell.get(8).textContent).toMatch('Disabled');
      });

      it('optional for publishing', function () {
        expect(this.tableCell.get(4).textContent).toMatch('Content is required');
        expect(this.tableCell.get(9).textContent).toMatch('Can be published empty');
      });
    });
  });
});
