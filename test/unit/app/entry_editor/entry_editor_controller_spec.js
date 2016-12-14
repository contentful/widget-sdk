'use strict';

describe('Entry Editor Controller', function () {
  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });


    this.createController = () => {
      const cfStub = this.$inject('cfStub');

      const $rootScope = this.$inject('$rootScope');
      const scope = $rootScope.$new();
      scope.context = {};

      const ctData = cfStub.contentTypeData();
      const space = cfStub.space('testSpace');
      const entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.editorData = {
        entity: entry,
        contentType: {
          getId: _.constant(ctData.sys.id),
          data: ctData
        },
        fieldControls: {},
        entityInfo: {
          id: entry.data.sys.id,
          type: 'Entry',
          contentTypeId: ctData.sys.id,
          contentType: ctData
        }
      };

      const $controller = this.$inject('$controller');
      $controller('EntryEditorController', {$scope: scope});

      return scope;
    };

    const createDoc = sinon.stub();
    createDoc.returns(this.$inject('mocks/entityEditor/Document').create());

    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      docPool: {get: createDoc},
      entryTitle: function (entry) {
        return dotty.get(entry, 'data.fields.title');
      }
    });

    this.scope = this.createController();
    this.$apply();
  });

  describe('when the entry title changes', function () {
    it('should update the tab title', function () {
      this.scope.otDoc.setValueAt(['fields', 'title'], 'foo');
      this.$apply();
      expect(this.scope.context.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      this.$apply();
      expect(this.scope.context.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', function () {
    it('changes according to doc state', function () {
      this.scope.otDoc.state.isDirty$.set(true);
      this.$apply();
      expect(this.scope.context.dirty).toBe(true);

      this.scope.otDoc.state.isDirty$.set(false);
      this.$apply();
      expect(this.scope.context.dirty).toBe(false);
    });
  });
});
