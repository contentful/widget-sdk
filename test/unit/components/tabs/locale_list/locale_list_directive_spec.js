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
        getName: sinon.stub().returns('English'),
        getCode: sinon.stub().returns('en-US'),
        isDefault: sinon.stub().returns(true),
        data: {
          contentManagementApi: true,
          contentDeliveryApi: true,
          optional: false,
          fallbackCode: null
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
          optional: true,
          fallbackCode: 'en-US'
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
      this.container = this.$compile('<div cf-locale-list />', {context: {}});
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
