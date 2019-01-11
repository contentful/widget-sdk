import * as K from 'utils/kefir.es6';
import _ from 'lodash';

describe('Entry Editor Controller', function() {
  this.user = { firstName: 'John', lastName: 'Doe', sys: { id: '123' } };
  const userBus = K.createPropertyBus(null);

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('app/entity_editor/Tracking.es6', sinon.stub());
      $provide.value('app/entity_editor/Validator.es6', {
        createForEntry: sinon.stub()
      });
      $provide.removeControllers(
        'entityEditor/StateController',
        'entityEditor/StatusNotificationsController',
        'EntryActionsController'
      );
    });

    const { registerFactory, registerController } = this.$inject('NgRegistry.es6');
    registerController('FormWidgetsController', function() {});
    registerFactory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);

    const createDocument = this.$inject('mocks/entityEditor/Document').create;

    this.mockService('app/entity_editor/DataLoader.es6', {
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

    this.mockService('services/TokenStore.es6', {
      user$: userBus.property
    });

    const createEntryController = this.$inject('app/entity_editor/EntryController.es6').default;

    this.createController = () => {
      const $rootScope = this.$inject('$rootScope');
      const scope = $rootScope.$new();
      scope.context = {};

      createEntryController(scope, 'testEntryId');

      return scope;
    };

    const contextHistory = this.$inject('navigation/Breadcrumbs/History.es6').default;
    contextHistory.set([{}]);

    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      entryTitle: function(entry) {
        return _.get(entry, 'data.fields.title');
      }
    });

    userBus.set(this.user);
    this.scope = this.createController();
    this.$apply();
  });

  it('should expose the current user', function() {
    expect(this.scope.user).toBe(this.user);
  });

  describe('when the entry title changes', () => {
    it('should update the tab title', function() {
      this.scope.otDoc.setValueAt(['fields', 'title'], 'foo');
      this.$apply();
      expect(this.scope.context.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      this.$apply();
      expect(this.scope.context.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', () => {
    it('changes according to doc state', function() {
      this.scope.otDoc.state.isDirty$.set(true);
      this.$apply();
      expect(this.scope.context.dirty).toBe(true);

      this.scope.otDoc.state.isDirty$.set(false);
      this.$apply();
      expect(this.scope.context.dirty).toBe(false);
    });
  });
});
