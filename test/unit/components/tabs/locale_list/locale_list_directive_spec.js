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

  it('the tab header add button is shown', function () {
    this.compileElement();
    expect(this.container.find('.add-entity button')).not.toBeNgHidden();
  });

  describe('list of locales', function () {
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
      this.list = this.container.find('.main-results-wrapper tbody');
    });

    it('list has 4 elements', function () {
      expect(this.list.find('tr').length).toBe(4);
    });

    describe('enabled column', function () {
      beforeEach(function() {
        this.tableCell = this.list.find('td.cell-enabled-for');
      });

      it('publishing and editing', function() {
        expect(this.tableCell.get(0).textContent).toMatch('Publishing and editing');
      });

      it('publishing only', function() {
        expect(this.tableCell.get(1).textContent).toMatch('Publishing only');
      });

      it('editing only', function() {
        expect(this.tableCell.get(2).textContent).toMatch('Editing only');
      });

      it('empty', function() {
        expect(this.tableCell.get(3).textContent).toMatch('-');
      });
    });
  });
});
