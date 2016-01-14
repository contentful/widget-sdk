'use strict';

describe('FormWidgetsController#widgets', function () {
  var scope;
  var field;

  beforeEach(function () {
    var TheLocaleStore = this.TheLocaleStoreMock = {
      getActiveLocales: sinon.stub(),
      getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'}),
      getPrivateLocales: sinon.stub().returns([{internal_code: 'en-US'}])
    };

    module('contentful/test', function ($provide) {
      $provide.value('TheLocaleStore', TheLocaleStore);
    });

    scope = this.$inject('$rootScope').$new();

    var cfStub = this.$inject('cfStub');
    var space = cfStub.space('testSpace');
    this.contentType = cfStub.contentType(space, 'testType', 'testType');

    field = cfStub.field('foo');
    this.contentType.data.fields = [field];

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
    this.createController();
  });


  it('provides the widget template', function() {
    var widgets = this.$inject('widgets');
    var widgetsStore = this.$inject('widgets/store');
    widgetsStore.getMap = sinon.stub().resolves({
      foo: {
        template: '<span class=foo></span>',
        fieldTypes: ['foo']
      }
    });
    widgets.setSpace({});
    this.$apply();

    field.type = 'foo';
    this.createController();
    expect(scope.widgets[0].template).toBe('<span class=foo></span>');
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



  describe('with multiple locales', function () {
    beforeEach(function () {
      var locales = [
        {internal_code: 'en-US'},
        {internal_code: 'de-DE'}
      ];
      this.TheLocaleStoreMock.getActiveLocales.returns(locales);
      this.TheLocaleStoreMock.getPrivateLocales.returns(locales);
    });

    it('should contain active locales if localized', function () {
      field.localized = true;
      this.$apply();
      expect(scope.widgets[0].locales.length).toBe(2);
    });

    it('should contain only default locale if not localized', function () {
      field.localized = false;
      this.$apply();
      expect(scope.widgets[0].locales.length).toBe(1);
      expect(scope.widgets[0].locales[0].internal_code).toBe('en-US');
    });

    it('should contain all error locales even if not localized', function () {
      scope.errorPaths = { foo: ['en-US', 'de-DE'] };
      field.localized = false;
      this.$apply();
      expect(scope.widgets[0].locales.length).toBe(2);
    });

    describe('with validation errors', function () {
      beforeEach(inject(function (cfStub){
        this.contentType.data.fields = [
          cfStub.field('id1', {apiName: 'apiName1',  localized: true, type: 'Symbol'}),
          cfStub.field('id2', {apiName: 'apiName2',  localized: false, type: 'Symbol'})
        ];
        scope.errorPaths = {
          'localized': ['en-US', 'de-DE'],
          'nonlocalized': ['en-US'],
        };
        this.createController();
      }));


      it('displays all locales for localized fields', function () {
        expect(scope.widgets[0].locales.length).toBe(2);
      });

      it('displays the default locale for non-localized fields', function () {
        expect(scope.widgets[1].locales.length).toBe(1);
        expect(scope.widgets[1].locales[0].internal_code).toBe('en-US');
      });
    });
  });
});
