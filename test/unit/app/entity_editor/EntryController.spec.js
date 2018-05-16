import {create as createDocument} from 'helpers/mocks/entity_editor_document';
import * as K from 'utils/kefir';

describe('Entry Editor Controller', function () {
  this.user = {firstName: 'John', lastName: 'Doe', sys: {id: '123'}};
  const userBus = K.createPropertyBus(null);

  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.value('app/entity_editor/Tracking', sinon.stub());
      $provide.value('app/entity_editor/Validator', {
        createForEntry: sinon.stub()
      });
      $provide.value('app/entity_editor/DataLoader', {
        loadEntry: () => ({
          entity: {
            data: {},
            getSys: () => ({})
          },
          entityInfo: {
            id: 'testEntryId',
            contentType: {
              fields: {}
            }
          },
          fieldControls: {},
          openDoc: () => createDocument()
        })
      });
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StateController',
        'entityEditor/StatusNotificationsController',
        'EntryActionsController'
      );
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    this.mockService('services/TokenStore', {
      user$: userBus.property
    });

    const createEntryController = this.$inject('app/entity_editor/EntryController').default;

    this.createController = () => {
      const $rootScope = this.$inject('$rootScope');
      const scope = $rootScope.$new();
      scope.context = {};

      createEntryController(scope, 'testEntryId');

      return scope;
    };

    const contextHistory = this.$inject('navigation/Breadcrumbs/History').default;
    contextHistory.set([{}]);

    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      entryTitle: function (entry) {
        return _.get(entry, 'data.fields.title');
      }
    });

    userBus.set(this.user);
    this.scope = this.createController();
    this.$apply();
  });

  it('should expose the current user', function () {
    expect(this.scope.user).toBe(this.user);
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
