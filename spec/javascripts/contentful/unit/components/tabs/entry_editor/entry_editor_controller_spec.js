'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;
  var canStub;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope;
      scope.can = canStub;
      var space = cfStub.space('testSpace');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      var entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.tab = { params: { entry: entry } };
      controller = $controller('EntryEditorCtrl', {$scope: scope});
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    expect(scope.validate.called).toBe(true);
  });

  describe('sets the otDisabled flag', function () {
    it('to disabled', function () {
      canStub.withArgs('update', scope.entry.data).returns(true);
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      canStub.withArgs('update', scope.entry.data).returns(false);
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });
  });

  describe('when the entry title changes', function () {
    beforeEach(function () {
      scope.spaceContext.entryTitle = sinon.stub().returns('foo');
    });
    it('should update the tab title', function () {
      var oldTitle = scope.tab.title;
      scope.spaceContext.entryTitle.returns('bar');
      scope.$digest();
      expect(scope.tab.title).toEqual('bar');
      expect(scope.tab.title).not.toEqual(oldTitle);
    });
  });

  describe('when it receives an entityDeleted event', function () {
    var closeSpy, otherScope;
    beforeEach(function () {
      closeSpy = scope.tab.close = sinon.spy();
      otherScope = scope.$new();
    });
    it('should close the tab', function () {
      otherScope.$emit('entityDeleted', null);
      expect(closeSpy.called).toBe(false); // wrong entry
      scope.$broadcast('entityDeleted', scope.entry);
      expect(closeSpy.called).toBe(false); // own scope
      otherScope.$emit('entityDeleted', scope.entry);
      expect(closeSpy.called).toBe(true);
    });
  });

  describe('when the published version changes', function () {
    it('should validate', function () {
      scope.validate = sinon.spy();
      scope.entry.data.sys.publishedVersion++;
      scope.$digest();
      expect(scope.validate.called).toBe(true);
    });
  });

  describe('setting the tab dirty state', function () {
    beforeEach(function () {
      scope.otDoc = {};
      scope.$digest();
    });
    it('should be false by default', function () {
      expect(scope.tab.dirty).toBe(false);
    });
    it('should be true when modified', function () {
      scope.otDoc.version = scope.entry.getPublishedVersion() + 2;
      scope.$digest();
      expect(scope.tab.dirty).toBe(true);
    });
    it('should be "draft" when no published version available', function () {
      scope.entry.getPublishedVersion = sinon.stub().returns(undefined);
      scope.$digest();
      expect(scope.tab.dirty).toBe('draft');
    });
  });

  describe('the list of fields', function () {
    var field;
    beforeEach(function () {
      inject(function (cfStub) {
        scope.preferences = {};
        contentType().data.fields = [field = cfStub.field('foo', {disabled: true})];
      });
    });

    it('should contain disabled fields if the flag is set', function () {
      scope.preferences.showDisabledFields = true;
      scope.$digest();
      expect(scope.fields.length).toBe(1);
    });

    it('should show fields that have errors even if disabled', function () {
      scope.validationResult = {
        errors: [{ path: ['fields', 'foo'] }]
      };
      scope.$digest();
      expect(scope.fields.length).toBe(1);
    });

    it('should not show a field that is disabled', function () {
      scope.$digest();
      expect(scope.fields.length).toBe(0);
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
        expect(scope.fields[0].locales.length).toBe(2);
      });

      it('should contain only default locale if not localized', function () {
        field.localized = false;
        scope.$digest();
        expect(scope.fields[0].locales.length).toBe(1);
        expect(scope.fields[0].locales[0].code).toBe('en-US');
      });

      it('should contain all error locales even if not localized', function () {
        scope.validationResult = {
          errors: [
            { path: ['fields', 'foo', 'en-US'] },
            { path: ['fields', 'foo', 'de-DE'] }
          ]
        };
        field.localized = false;
        scope.$digest();
        expect(scope.fields[0].locales.length).toBe(2);
      });
    });

    function contentType() {
      return scope.spaceContext.publishedTypeForEntry(scope.entry);
    }

  });

  it('should validate when ot became editable', function () {
    scope.validate = sinon.stub();
    scope.entry.data.fields = {foo: {'en-US': 'bar'}};
    scope.$broadcast('otBecameEditable');
    expect(scope.validate.called).toBe(true);
  });

});

describe('Entry Editor Controller with validation errors', function () {
  var controller, scope;
  var canStub;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
    canStub = sinon.stub();
    scope = $rootScope;
    scope.can = canStub;
    var space = cfStub.space('testSpace');
    var contentTypeData = cfStub.contentTypeData('testType', [
      cfStub.field('localized'),
      cfStub.field('nonlocalized', {localized: false})
    ]);
    scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    var entry = cfStub.entry(space, 'testEntry', 'testType');
    scope.tab = { params: { entry: entry } };
    controller = $controller('EntryEditorCtrl', {$scope: $rootScope});
    scope.validationResult = {
      errors: [
        {'name':'required','path':['fields','localized']},
        {'name':'required','path':['fields','nonlocalized']}
      ]
    };
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('fields with errors', function () {
    it('should display all locales for localized fields', function () {
      scope.$digest();
      expect(scope.fields[0].locales.length).toBe(2);
    });

    it('should only display the default locale for non-localized fields', function () {
      scope.$digest();
      expect(scope.fields[1].locales.length).toBe(1);
    });
  });

});


