'use strict';

describe('Entry Editor Controller', function () {
  let scope;

  afterEach(function () {
    scope.$destroy();
    scope = null;
  });

  beforeEach(function () {
    const createDoc = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.value('entityEditor/Document', {create: createDoc});
    });

    this.createController = function () {
      const cfStub = this.$inject('cfStub');

      const $rootScope = this.$inject('$rootScope');
      scope = $rootScope.$new();

      const ctData = cfStub.contentTypeData();
      scope.contentType = {data: ctData, getId: _.constant(ctData.sys.id)};
      scope.context = {};

      const space = cfStub.space('testSpace');
      const entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.entry = entry;
      scope.entity = entry;

      const $controller = this.$inject('$controller');
      $controller('EntryEditorController', {$scope: scope});

      scope.validate = sinon.stub();

      return scope;
    };

    createDoc.returns(this.$inject('mocks/entityEditor/Document').create());
    scope = this.createController();
    this.$apply();
  });

  describe('when the entry title changes', function () {
    it('should update the tab title', function () {
      const spaceContext = this.$inject('spaceContext');
      spaceContext.entryTitle = sinon.stub();

      spaceContext.entryTitle.returns('foo');
      this.$apply();
      expect(scope.context.title).toEqual('foo');

      spaceContext.entryTitle.returns('bar');
      this.$apply();
      expect(scope.context.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', function () {
    it('changes according to doc state', function () {
      scope.otDoc.state.isDirty$.set(true);
      this.$apply();
      expect(scope.context.dirty).toBe(true);

      scope.otDoc.state.isDirty$.set(false);
      this.$apply();
      expect(scope.context.dirty).toBe(false);
    });
  });
});
