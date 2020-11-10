import * as K from 'core/utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import { $initialize, $inject, $apply, $removeControllers } from 'test/utils/ng';

describe('Entry Editor Controller', function () {
  this.user = { firstName: 'John', lastName: 'Doe', sys: { id: '123' } };
  const userBus = K.createPropertyBus(null);

  const entryTitleId = 'fdsu4y3j432';
  const notEntryTitleId = 'notEntryTitleId';
  const slugId = 'jrh32j4u92';
  const slugFieldId = 'slug';

  // stub the following function to change the data that will be used to initialize
  // the angular controller and the document
  const stubs = {
    getDefaultEntryFields: () => ({
      [entryTitleId]: {
        'en-US': 'Hey, Sunshine!',
        de: 'Hallo, Sonnenlicht!',
      },
      [slugId]: {
        'en-US': 'hey-sunshine',
        de: 'hallo-sonnenlicht',
      },
      [notEntryTitleId]: {
        'en-US': 'this is a text in english',
        de: 'das ist ein text in Deutsch',
      },
    }),
  };

  const configureForTest = async function (contentType, editorControls) {
    const createEntryController = (await this.system.import('app/entity_editor/EntryController'))
      .default;

    await $initialize(this.system);

    await $removeControllers(this.system, ['entityEditor/StatusNotificationsController']);

    const createDocument = $inject('mocks/entityEditor/Document').create;
    const defaultContentType = {
      sys: {
        id: 'ctId',
      },
      data: {
        fields: [
          {
            id: entryTitleId,
            apiName: 'title',
            name: 'Tile Field',
            required: true,
            localized: true,
            type: 'Symbol',
          },
          { id: slugId, apiName: slugFieldId, name: 'Slug Field', type: 'Symbol' },
          { id: notEntryTitleId, apiName: 'secret', name: 'Secret Field', type: 'Symbol' },
        ],
        displayField: entryTitleId,
      },
    };

    const defaultEditorControls = [
      {
        widgetId: 'slugEditor',
        id: slugId,
        fieldId: slugFieldId,
      },
    ];

    const mockEditorData = {
      entity: {
        data: {},
        getSys: () => ({}),
      },
      entityInfo: {
        id: 'testEntryId',
        type: 'Entry',
        contentType: {
          fields: {},
        },
      },
      editorInterface: {
        controls: editorControls || defaultEditorControls,
      },
      contentType: contentType || defaultContentType,
      fieldControls: {},
      openDoc: () =>
        createDocument({
          sys: { type: 'Entry' },
          fields: stubs.getDefaultEntryFields(),
        }),
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
    this.spaceContext.publishedCTs.get.callsFake(() => mockEditorData.contentType);
    // eslint-disable-next-line
    this.spaceContext.space.createEntry.callsFake((id, entry) =>
      Promise.resolve({ ...entry, data: {} })
    );

    userBus.set(this.user);
    this.scope = this.createController();
    $apply();
  };

  beforeEach(async function () {
    this.system.set('app/EntrySidebar/EntitySidebarBridge', {
      default: () => {
        return {};
      },
    });

    this.system.set('app/entity_editor/setLocaleData', {
      default: () => {
        return {};
      },
    });

    this.system.set('app/entity_editor/LoadEventTracker', {
      bootstrapEntryEditorLoadEvents: () => {},
    });

    this.system.set('app/entity_editor/Tracking', {
      default: sinon.stub(),
    });

    this.system.set('app/entity_editor/Validator', {
      createForEntry: sinon.stub(),
      createForEntity: sinon.stub(),
    });

    this.system.set('services/localeStore', {
      default: createLocaleStoreMock(),
    });

    this.system.set('services/TokenStore', {
      user$: userBus.property,
    });

    this.system.set('app/entry_editor/formWidgetsController', {
      default: () => {},
    });

    this.system.set('classes/EntityFieldValueSpaceContext', {
      entryTitle: (entry) => _.get(entry, 'data.fields.title'),
      entityTitle: (entry) => _.get(entry, 'data.fields.title'),
    });

    this.system.set('analytics/Analytics', {
      track: _.noop,
    });

    this.sandbox = sinon.createSandbox();
  });

  afterEach(async function () {
    this.sandbox.restore();
  });

  it('exposes the current user', async function () {
    await configureForTest.call(this);
    expect(this.scope.user).toBe(this.user);
  });

  describe('when the entry title changes', () => {
    it('updates the tab title', async function () {
      await configureForTest.call(this);
      this.scope.otDoc.setValueAt(['fields', 'title'], 'foo');
      $apply();
      expect(this.scope.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      $apply();
      expect(this.scope.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', () => {
    it('changes according to doc state', async function () {
      await configureForTest.call(this);
      this.scope.otDoc.state.isDirty$.set(true);
      $apply();
      expect(this.scope.context.dirty).toBe(true);

      this.scope.otDoc.state.isDirty$.set(false);
      $apply();
      expect(this.scope.context.dirty).toBe(false);
    });
  });
});
