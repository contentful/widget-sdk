import * as K from 'utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import { $initialize, $inject, $apply, $removeControllers } from 'test/utils/ng';

describe('Entry Editor Controller', function() {
  this.user = { firstName: 'John', lastName: 'Doe', sys: { id: '123' } };
  const userBus = K.createPropertyBus(null);

  const entryTitleId = 'fdsu4y3j432';
  const notEntryTitleId = 'notEntryTitleId';

  // stub the following function to change the data that will be used to initialize
  // the angular controller and the document
  const stubs = {
    getDefaultEntryFields: () => ({
      [entryTitleId]: {
        'en-US': 'Hey, Sunshine!',
        de: 'Hallo, Sonnenlicht!'
      },
      [notEntryTitleId]: {
        'en-US': 'this is a text in english',
        de: 'das ist ein text in Deutsch'
      }
    })
  };

  const configureForTest = async function() {
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
          fields: [
            { id: entryTitleId, apiName: 'title', name: 'title', type: 'Symbol' },
            { id: notEntryTitleId, apiName: 'secret', name: 'secret', type: 'Symbol' }
          ],
          displayField: entryTitleId
        }
      },
      fieldControls: {},
      openDoc: () =>
        createDocument({
          sys: { type: 'Entry' },
          fields: stubs.getDefaultEntryFields()
        })
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

    this.system.set('analytics/Analytics', {
      track: _.noop
    });

    this.sandbox = sinon.createSandbox();
  });

  afterEach(async function() {
    this.sandbox.restore();
  });

  it('exposes the current user', async function() {
    await configureForTest.call(this);
    expect(this.scope.user).toBe(this.user);
  });

  describe('when the entry title changes', () => {
    it('updates the tab title', async function() {
      await configureForTest.call(this);
      this.scope.otDoc.setValueAt(['fields', 'title'], 'foo');
      $apply();
      expect(this.scope.context.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      $apply();
      expect(this.scope.context.title).toEqual('bar');
    });
  });

  describe('scope.context.dirty', () => {
    it('changes according to doc state', async function() {
      await configureForTest.call(this);
      this.scope.otDoc.state.isDirty$.set(true);
      $apply();
      expect(this.scope.context.dirty).toBe(true);

      this.scope.otDoc.state.isDirty$.set(false);
      $apply();
      expect(this.scope.context.dirty).toBe(false);
    });
  });

  describe('scope.entryActions.onDuplicate', () => {
    it('should make the entity title (displayName) unique per each duplicate', async function() {
      await configureForTest.call(this);
      const entry = await this.scope.entryActions.onDuplicate();
      for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
        expect(localizedValue).toBe(`${stubs.getDefaultEntryFields()[entryTitleId][locale]} (1)`);
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
        expect(localizedValue).toBe(stubs.getDefaultEntryFields()[notEntryTitleId][locale]);
      }
    });

    it('should increment the copy index for the entry title (displayName) after each next duplicate', async function() {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (1)',
          de: 'Hallo, Sonnenlicht! (1)'
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch'
        }
      });

      await configureForTest.call(this);

      const entry = await this.scope.entryActions.onDuplicate();
      for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
        expect(localizedValue).toBe(
          stubs.getDefaultEntryFields()[entryTitleId][locale].replace('(1)', '(2)')
        );
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
        expect(localizedValue).toBe(stubs.getDefaultEntryFields()[notEntryTitleId][locale]);
      }
    });

    it('should not break down in case the entry title is not defined', async function() {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: null,
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch'
        }
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function() {
          const entry = await this.scope.entryActions.onDuplicate();
          expect(entry.fields[entryTitleId]).toBe(null);

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it("should not break down in case one of the entry title's localized values is not defined", async function() {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine!',
          de: null
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch'
        }
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function() {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            const originalValue = entryFields[entryTitleId][locale];
            if (originalValue !== null) {
              expect(localizedValue).toBe(`${originalValue} (1)`);
            } else {
              expect(localizedValue).toBe(originalValue);
            }
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should not increment a negative index after the duplication', async function() {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (-1)',
          de: 'Hallo, Sonnenlicht! (-1)'
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch'
        }
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function() {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(`${entryFields[entryTitleId][locale]} (1)`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });
  });
});
