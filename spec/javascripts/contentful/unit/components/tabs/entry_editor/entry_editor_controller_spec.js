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


