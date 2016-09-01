'use strict';

describe('Entry Editor Controller', function () {
  var scope;

  afterEach(function () {
    scope.$destroy();
    scope = null;
  });

  beforeEach(function () {
    const document = sinon.stub();
    module('contentful/test', ($provide, $controllerProvider) => {
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
      $controllerProvider.register('entityEditor/Document', document);
    });

    this.createController = function () {
      var cfStub = this.$inject('cfStub');

      var $rootScope = this.$inject('$rootScope');
      scope = $rootScope.$new();

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

      scope.validate = sinon.stub();

      return scope;
    };

    document.returns(this.$inject('mocks/entityEditor/Document').create());
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

  describe('scope.context.dirty', function () {
    it('changes according to doc state', function () {
      scope.otDoc.state.isDirty.set(true);
      this.$apply();
      expect(scope.context.dirty).toBe(true);

      scope.otDoc.state.isDirty.set(false);
      this.$apply();
      expect(scope.context.dirty).toBe(false);
    });
  });
});
