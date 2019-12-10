import * as K from 'utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import { $initialize, $inject, $apply, $removeControllers } from 'test/utils/ng';

describe('Entry Editor Controller', function() {
  this.user = { firstName: 'John', lastName: 'Doe', sys: { id: '123' } };
  const userBus = K.createPropertyBus(null);

  beforeEach(async function() {
    this.system.set('app/EntrySidebar/EntitySidebarBridge', {
      default: () => {
        return {};
      }
    });

    this.system.set('app/entity_editor/setLocaleData', {
      default: () => {
        return {};
      }
    });
    this.system.set('app/entity_editor/LoadEventTracker', {
      bootstrapEntryEditorLoadEvents: () => {}
    });

    this.system.set('app/entity_editor/Tracking', {
      default: sinon.stub()
    });
    this.system.set('app/entity_editor/Validator', {
      createForEntry: sinon.stub()
    });

    this.system.set('services/localeStore', {
      default: createLocaleStoreMock()
    });
    this.system.set('services/TokenStore', {
      user$: userBus.property
    });
    this.system.set('app/entry_editor/formWidgetsController', {
      default: () => {}
    });

    this.system.set('classes/EntityFieldValueSpaceContext', {
      entryTitle: entry => _.get(entry, 'data.fields.title')
    });

    const createEntryController = (await this.system.import('app/entity_editor/EntryController'))
      .default;

    await $initialize(this.system);

    await $removeControllers(this.system, [
      'entityEditor/StateController',
      'entityEditor/StatusNotificationsController',
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
