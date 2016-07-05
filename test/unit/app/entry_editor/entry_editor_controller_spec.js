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
        'entityEditor/Document',
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

      scope.otDoc = {
        doc: doc,
        open: sinon.stub(),
        close: sinon.stub()
      };

      scope.validate = sinon.stub();

      return scope;
    };

    scope = this.createController();
    this.$apply();
  });

  it('should validate if the published version has changed', function () {
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    sinon.assert.called(scope.validate);
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
});
