import * as K from 'utils/kefir.es6';
import _ from 'lodash';
import sinon from 'sinon';
import createLocaleStoreMock from 'test/helpers/mocks/createLocaleStoreMock';
import { $initialize, $inject, $apply, $removeControllers } from 'test/helpers/helpers';

describe('Entry Editor Controller', function() {
  this.user = { firstName: 'John', lastName: 'Doe', sys: { id: '123' } };
  const userBus = K.createPropertyBus(null);

  beforeEach(async function() {
    this.system.set('app/EntrySidebar/EntitySidebarBridge.es6', {
      default: () => {
        return {};
      }
    });

    this.system.set('app/entity_editor/setLocaleData.es6', {
      default: () => {
        return {};
      }
    });
    this.system.set('app/entity_editor/LoadEventTracker.es6', {
      bootstrapEntryEditorLoadEvents: () => {}
    });

    this.system.set('app/entity_editor/Tracking.es6', {
      default: sinon.stub()
    });
    this.system.set('app/entity_editor/Validator.es6', {
      createForEntry: sinon.stub()
    });

    this.system.set('services/localeStore.es6', {
      default: createLocaleStoreMock()
    });
    this.system.set('services/TokenStore.es6', {
      user$: userBus.property
    });
    this.system.set('app/entry_editor/formWidgetsController.es6', {
      default: () => {}
    });

    const createEntryController = (await this.system.import(
      'app/entity_editor/EntryController.es6'
    )).default;

    module('contentful/test');

    await $initialize();

    await $removeControllers(this.system, [
      'entityEditor/StateController',
      'entityEditor/StatusNotificationsController',
      'EntryActionsController',
      'FormWidgetsController'
    ]);

    const createDocument = $inject('mocks/entityEditor/Document').create;

    const mockEditorData = {
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
      contentType: {
        data: {
          fields: []
        }
      },
      fieldControls: {},
      openDoc: () => createDocument()
    };

    const mockPreferences = {};

    this.createController = () => {
      const $rootScope = $inject('$rootScope');
      const scope = $rootScope.$new();
      scope.context = {};

      createEntryController(scope, mockEditorData, mockPreferences);

      return scope;
    };

    this.spaceContext = $inject('mocks/spaceContext').init();
    this.spaceContext.entryTitle = entry => _.get(entry, 'data.fields.title');

    userBus.set(this.user);
    this.scope = this.createController();
    $apply();
  });

  it('exposes the current user', function() {
    expect(this.scope.user).toBe(this.user);
  });

  describe('when the entry title changes', () => {
    it('updates the tab title', function() {
      this.scope.otDoc.setValueAt(['fields', 'title'], 'foo');
      $apply();
      expect(this.scope.context.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      $apply();
      expect(this.scope.context.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', () => {
    it('changes according to doc state', function() {
      this.scope.otDoc.state.isDirty$.set(true);
      $apply();
      expect(this.scope.context.dirty).toBe(true);

      this.scope.otDoc.state.isDirty$.set(false);
      $apply();
      expect(this.scope.context.dirty).toBe(false);
    });
  });
});
