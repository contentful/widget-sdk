'use strict';

describe('The Locale list directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('PermissionController');
    });

    this.container = null;
    this.compileElement = null;
    this.$q = this.$inject('$q');
    this.scope = this.$inject('$rootScope').$new();
    this.scope.spaceContext = {
      space: {
        data: {sys: {createdBy: {sys: {id: ''}}}},
        getLocales: sinon.stub().returns(this.$q.defer().promise)
      }
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

  describe('the tab header add button', function () {
    it('is shown', function () {
      this.compileElement();
      expect(this.container.find('.tab-header .add-entity .btn--primary')).not.toBeNgHidden();
    });
  });

  describe('list of locales', function () {
    var list;
    beforeEach(function () {
      this.scope.locales = [
        {
          getId: sinon.stub().returns(1),
          getName: sinon.stub(),
          getCode: sinon.stub(),
          isDefault: sinon.stub().returns(true),
          data: {
            contentManagementApi: true,
            contentDeliveryApi: true
          }
        },
        {
          getId: sinon.stub().returns(2),
          getName: sinon.stub(),
          getCode: sinon.stub(),
          isDefault: sinon.stub().returns(false),
          data: {
            contentManagementApi: false,
            contentDeliveryApi: true
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
            contentDeliveryApi: false
          }
        }
      ];

      this.compileElement();
      list = this.container.find('.main-results tbody');
    });

    it('list has 4 elements', function () {
      expect(list.find('tr').length).toBe(4);
    });

    it('enabled info is correctly shown', function () {
      expect(list.find('td.cell-enabled-for a')[0].textContent).toBe('Publishing and editing');
      expect(list.find('td.cell-enabled-for a')[1].textContent).toBe('Publishing only');
      expect(list.find('td.cell-enabled-for a')[2].textContent).toBe('Editing only');
      expect(list.find('td.cell-enabled-for a')[3].textContent).toBe('-');
    });
  });
});
