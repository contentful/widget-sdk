'use strict';

describe('FormWidgetsController#widgets', function () {
  var scope, field;

  beforeEach(function () {
    var getStoreWidgets;

    var TheLocaleStore = this.TheLocaleStoreMock = {
      getActiveLocales: sinon.stub(),
      getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'}),
      getPrivateLocales: sinon.stub().returns([{internal_code: 'en-US'}])
    };

    module('contentful/test', function ($provide) {
      function mockWidgetStore() {
        function WidgetStore(space) {
          this.space = space;
        }
        WidgetStore.prototype.getMap = getStoreWidgets;
        return WidgetStore;
      }

      $provide.factory('widgets/store', mockWidgetStore);
      $provide.value('TheLocaleStore', TheLocaleStore);
    });


    scope = this.$inject('$rootScope').$new();

    var cfStub = this.$inject('cfStub');
    var space = cfStub.space('testSpace');
    this.contentType = cfStub.contentType(space, 'testType', 'testType');

    field = cfStub.field('foo');
    this.contentType.data.fields = [field];

    this.setupWidgets = function (ws) {
      getStoreWidgets = sinon.stub().resolves(ws);
      var widgets = this.$inject('widgets');
      widgets.setSpace();
      this.$apply();
      this.createController();
    };

    this.createController = function () {
      var editingInterfaces = this.$inject('editingInterfaces');
      var $controller = this.$inject('$controller');
      $controller('FormWidgetsController', {
        $scope: scope,
        contentType: this.contentType,
        editingInterface: editingInterfaces.defaultInterface(this.contentType)
      });
      this.$apply();
    };

  });


  it('provides the widget template', function() {
    field.type = 'foo';
    this.setupWidgets({
      foo: {
        template: '<span class=foo></span>',
        fieldTypes: ['foo']
      }
    });
    expect(scope.widgets[0].template).toBe('<span class=foo></span>');
  });

  it('filters sidebar widgets', function () {
    field.type = 'foo';
    this.setupWidgets({
      foo: {
        template: '<span class=foo></span>',
        fieldTypes: ['foo'],
        sidebar: true
      }
    });
    expect(scope.widgets.length).toBe(0);
  });


  describe('with disabled field', function () {
    beforeEach(function () {
      scope.preferences = {};
      field.disabled = true;
      this.createController();
    });

    it('does not show the field', function () {
      this.$apply();
      expect(scope.widgets.length).toBe(0);
    });

    it('shows the fields if the preference flag is set', function () {
      scope.preferences.showDisabledFields = true;
      this.$apply();
      expect(scope.widgets.length).toBe(1);
    });

    it('shows the field if it has errors', function () {
      scope.errorPaths = {'foo': true};
      this.$apply();
      expect(scope.widgets.length).toBe(1);
    });
  });
});
