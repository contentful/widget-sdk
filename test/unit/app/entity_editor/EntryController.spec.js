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

    const {makeEditorData} = this.$inject('mocks/app/entity_editor/DataLoader');
    const createEntryController = this.$inject('app/entity_editor/EntryController').default;

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

      const editorData = makeEditorData(entry.data, ctData);
      createEntryController(scope, editorData);

      return scope;
    };

    const contextHistory = this.$inject('navigation/Breadcrumbs/History').default;
    contextHistory.set([{}]);

    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      entryTitle: function (entry) {
        return _.get(entry, 'data.fields.title');
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
