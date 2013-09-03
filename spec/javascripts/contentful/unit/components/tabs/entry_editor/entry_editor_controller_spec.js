'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
    scope = $rootScope;
    var locale = cfStub.locale('en-US');
    var contentType = {
      data: {
        fields: []
      }
    };
    var entry = {
      data: {
        fields: {},
        sys: {publishedVersion: 1}
      },
      isArchived: sinon.stub().returns(false)
    };
    scope.spaceContext = {
      activeLocales: [locale],
      publishedTypeForEntry: sinon.stub().returns(contentType),
      space: {
        getPublishLocales: sinon.stub().returns([locale])
      }
    };
    scope.tab = {
      params: {
        entry: entry
      }
    };
    controller = $controller('EntryEditorCtrl', {$scope: $rootScope});
    scope.$digest();
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    expect(scope.validate.called).toBe(true);
  });

});

describe('Entry Editor Controller', function () {
  var controller, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
    scope = $rootScope;
    var locales = [
       cfStub.locale('en-US'),
       cfStub.locale('de-DE', {'default': false})
    ];
    var contentType = {
      data: {
        fields: [
          cfStub.field('localized'),
          cfStub.field('nonlocalized', {localized: false})
        ]
      }
    };
    var entry = {
      data: {
        fields: {},
        //sys: {publishedVersion: 1}
      },
      isArchived: sinon.stub().returns(false)
    };
    scope.spaceContext = {
      activeLocales: [locales[0]],
      publishedTypeForEntry: sinon.stub().returns(contentType),
      getPublishLocale: function (code) {
        return _.find(this.publishLocales, {'code': code});
      },
      publishLocales: locales,
      space: {
        getPublishLocales: sinon.stub().returns(locales),
        getDefaultLocale: sinon.stub().returns(locales[0])
      }
    };
    scope.tab = {
      params: {
        entry: entry
      }
    };
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


