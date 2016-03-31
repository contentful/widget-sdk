'use strict';

describe('Entry Editor Controller', function () {
  var scope;

  afterEach(function () {
    scope.$destroy();
    scope = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.value('TheLocaleStore', {
        getLocalesState: sinon.stub().returns({}),
        getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'}),
        getPrivateLocales: sinon.stub().returns([{internal_code: 'en-US'}, {internal_code: 'de-DE'}])
      });
    });

    this.createController = function () {
      var cfStub = this.$inject('cfStub');

      var $rootScope = this.$inject('$rootScope');
      scope = $rootScope.$new();

      var OtDoc = this.$inject('mocks/OtDoc');
      var doc = new OtDoc();
      scope.otDoc = {doc: doc, state: {}};

      var ctData = cfStub.contentTypeData();
      scope.contentType = {data: ctData, getId: _.constant(ctData.sys.id)};
      scope.context = {};

      var space = cfStub.space('testSpace');
      var entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.entry = entry;

      var $controller = this.$inject('$controller');
      $controller('EntryEditorController', {$scope: scope});
      return scope;
    };

    scope = this.createController();
    this.$apply();
  });

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    sinon.assert.called(scope.validate);
  });

  describe('sets the otDoc.state.disabled flag', function () {
    beforeEach(function(){
      scope = this.createController();
      scope.otDoc = { state: { disabled: false } };
      this.accessChecker = this.$inject('accessChecker');
      this.accessChecker.canUpdateEntry = sinon.stub().returns(true);
      scope.$apply();
    });

    it('to disabled', function () {
      this.accessChecker.canUpdateEntry.returns(true);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(false);
    });

    it('to enabled', function () {
      this.accessChecker.canUpdateEntry.returns(false);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(true);
    });
  });

  describe('when the entry title changes', function () {
    it('should update the tab title', function () {
      var spaceContext = this.$inject('spaceContext');
      spaceContext.entryTitle = sinon.stub();

      spaceContext.entryTitle.returns('foo');
      this.$apply();
      expect(scope.context.title).toEqual('foo');

      spaceContext.entryTitle.returns('bar');
      this.$apply();
      expect(scope.context.title).toEqual('bar');
    });
  });


  describe('when the published version changes', function () {
    it('should validate', function () {
      scope.validate = sinon.spy();
      scope.entry.data.sys.publishedVersion++;
      scope.$digest();
      sinon.assert.called(scope.validate);
    });
  });

  describe('setting the tab dirty state', function () {
    it('should be false by default', function () {
      expect(scope.context.dirty).toBe(false);
    });

    it('should be true when modified', function () {
      scope.otDoc.doc.version = scope.entry.getPublishedVersion() + 2;
      scope.$digest();
      expect(scope.context.dirty).toBe(true);
    });

    it('should be "draft" when no published version available', function () {
      scope.entry.getPublishedVersion = sinon.stub().returns(undefined);
      scope.$digest();
      expect(scope.context.dirty).toBe('draft');
    });
  });

  it('should validate when ot became editable', function () {
    scope.validate = sinon.stub();
    scope.entry.data.fields = {foo: {'en-US': 'bar'}};
    scope.$broadcast('otBecameEditable');
    sinon.assert.called(scope.validate);
  });

  it('when doc loads adds objects for every field', function () {
    scope = this.createController();
    scope.entry.data.fields = {
      A: {},
      B: {}
    };
    var doc = scope.otDoc.doc;
    expect(doc.snapshot.fields).toBe(undefined);

    this.$apply();
    expect(doc.snapshot.fields['A']).toEqual({});
    expect(doc.snapshot.fields['B']).toEqual({});
  });
});
