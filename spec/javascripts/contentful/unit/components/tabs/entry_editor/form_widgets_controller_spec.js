'use strict';

describe('Form Widgets Controller', function () {
  var controller, scope, interf;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope;
      var space = cfStub.space('testSpace');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      controller = $controller('FormWidgetsController', {$scope: scope});
      controller.contentType = scope.spaceContext.publishedContentTypes[0];
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('the list of widgets', function () {
    var field;
    beforeEach(function () {
      inject(function (cfStub, editingInterfaces, $q) {
        scope.preferences = {};
        controller.contentType.data.fields = [field = cfStub.field('foo', {disabled: true})];
        interf = editingInterfaces.defaultInterface(controller.contentType);
        sinon.stub(editingInterfaces ,'forContentTypeWithId').returns($q.when(interf));
        controller.updateWidgets();
      });
    });

    it('should contain disabled fields if the flag is set', function () {
      scope.preferences.showDisabledFields = true;
      scope.$digest();
      expect(scope.widgets.length).toBe(1);
    });

    it('should show fields that have errors even if disabled', function () {
      scope.errorPaths = {'foo': true};
      scope.$digest();
      expect(scope.widgets.length).toBe(1);
    });

    it('should not show a field that is disabled', function () {
      scope.$digest();
      expect(scope.widgets.length).toBe(0);
    });

    describe('locales for a field', function () {
      beforeEach(function () {
        field.disabled = false;
        scope.spaceContext.localeStates['de-DE'] = true;
        scope.spaceContext.refreshActiveLocales();
      });

      it('should contain active locales if localized', function () {
        field.localized = true;
        scope.$digest();
        expect(scope.widgets[0].locales.length).toBe(2);
      });

      it('should contain only default locale if not localized', function () {
        field.localized = false;
        scope.$digest();
        expect(scope.widgets[0].locales.length).toBe(1);
        expect(scope.widgets[0].locales[0].code).toBe('en-US');
      });

      it('should contain all error locales even if not localized', function () {
        scope.errorPaths = { foo: ['en-US', 'de-DE'] };
        field.localized = false;
        scope.$digest();
        expect(scope.widgets[0].locales.length).toBe(2);
      });
    });

    describe('with validation errors', function () {
      beforeEach(inject(function ($rootScope, $controller, cfStub, editingInterfaces){
        scope.preferences = {};
        controller.contentType.data.fields = [
          cfStub.field('localized'),
          cfStub.field('nonlocalized', {localized: false})
        ];
        interf.widgets = editingInterfaces.defaultInterface(controller.contentType).widgets;
        controller.updateWidgets();
      }));

      describe('fields with errors', function () {
        beforeEach(function () {
          scope.errorPaths = {
            'localized': ['en-US', 'de-DE'],
            'nonlocalized': ['en-US'],
          };
        });

        it('should display all locales for localized fields', function () {
          scope.$digest();
          expect(scope.widgets[0].locales.length).toBe(2);
        });

        it('should only display the default locale for non-localized fields', function () {
          scope.$digest();
          expect(scope.widgets[1].locales.length).toBe(1);
        });
      });

      describe('field with data in a disabled locale', function () {
        beforeEach(function () {
          scope.spaceContext.space.data.locales[1].publish = false;
          scope.spaceContext.refreshLocales();

          scope.errorPaths = {
            'localized': ['de-DE']
          };
        });

        it('should show the field with the error', function () {
          scope.$digest();
          expect(scope.widgets[0].locales.length).toBe(2);
        });
      });

    });
  });



});
