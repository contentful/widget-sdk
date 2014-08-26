'use strict';

describe('Form Widgets Controller', function () {
  var controller, scope, interf;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller, cfStub, editingInterfaces, $q){
      scope = $rootScope;
      var space = cfStub.space('testSpace');
      scope.spaceContext = cfStub.spaceContext(space, [
        cfStub.contentTypeData('testType',  [cfStub.field('fieldA')]),
        cfStub.contentTypeData('testType2', [cfStub.field('fieldB')]),
      ]);
      sinon.stub(editingInterfaces, 'forContentTypeWithId', function(contentType) {
        // Do not attempt to load from remote
        return $q.when(editingInterfaces.defaultInterface(contentType));
      });
      controller = $controller('FormWidgetsController', {$scope: scope});
      controller.contentType = scope.spaceContext.publishedContentTypes[0];
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('the editing interface', function(){
    it('updates the editing interface when the content type changes', function(){
      expect(controller.editingInterface.data.widgets[0].fieldId).toBe('fieldA');
      controller.contentType = scope.spaceContext.publishedContentTypes[1];
      scope.$apply();
      expect(controller.editingInterface.data.widgets[0].fieldId).toBe('fieldB');
    });
  });

  describe('the list of widgets', function () {
    var field;
    beforeEach(function () {
      inject(function (cfStub) {
        scope.preferences = {};
        controller.contentType.data.fields = [field = cfStub.field('foo', {disabled: true})];
        scope.$apply(); // Trigger updateEditingInterface
      });
    });

    it('should contain disabled fields if the flag is set', function () {
      scope.preferences.showDisabledFields = true;
      scope.$apply();
      expect(scope.widgets.length).toBe(1);
    });

    it('should show fields that have errors even if disabled', function () {
      scope.errorPaths = {'foo': true};
      scope.$apply();
      expect(scope.widgets.length).toBe(1);
    });

    it('should not show a field that is disabled', function () {
      scope.$apply();
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
        scope.$apply();
        expect(scope.widgets[0].locales.length).toBe(2);
      });

      it('should contain only default locale if not localized', function () {
        field.localized = false;
        scope.$apply();
        expect(scope.widgets[0].locales.length).toBe(1);
        expect(scope.widgets[0].locales[0].code).toBe('en-US');
      });

      it('should contain all error locales even if not localized', function () {
        scope.errorPaths = { foo: ['en-US', 'de-DE'] };
        field.localized = false;
        scope.$apply();
        expect(scope.widgets[0].locales.length).toBe(2);
      });
    });

    describe('with validation errors', function () {
      beforeEach(inject(function (cfStub){
        scope.preferences = {};
        controller.contentType.data.fields = [
          cfStub.field('localized'),
          cfStub.field('nonlocalized', {localized: false})
        ];
        scope.$apply();
      }));

      describe('fields with errors', function () {
        beforeEach(function () {
          scope.errorPaths = {
            'localized': ['en-US', 'de-DE'],
            'nonlocalized': ['en-US'],
          };
        });

        it('should display all locales for localized fields', function () {
          scope.$apply();
          expect(scope.widgets[0].locales.length).toBe(2);
        });

        it('should only display the default locale for non-localized fields', function () {
          scope.$apply();
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
          scope.$apply();
          expect(scope.widgets[0].locales.length).toBe(2);
        });
      });

    });
  });



});
