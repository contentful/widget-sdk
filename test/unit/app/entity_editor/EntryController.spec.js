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

    await $removeControllers(this.system, [
      'entityEditor/StatusNotificationsController',
      'FormWidgetsController',
    ]);

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
      expect(this.scope.context.title).toEqual('foo');
      this.scope.otDoc.setValueAt(['fields', 'title'], 'bar');
      $apply();
      expect(this.scope.context.title).toEqual('bar');
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

  describe('scope.entryActions.onDuplicate', () => {
    it('should not break and add index to displayField if slugEditor field doesnt exist in contentType', async function () {
      const contentType = {
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
            { id: notEntryTitleId, apiName: 'secret', name: 'Secret Field', type: 'Symbol' },
          ],
          displayField: entryTitleId,
        },
      };
      await configureForTest.call(this, contentType);

      const entry = await this.scope.entryActions.onDuplicate();
      expect(entry.fields).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (1)',
          de: 'Hallo, Sonnenlicht! (1)',
        },
        [slugId]: stubs.getDefaultEntryFields()[slugId],
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });
    });

    it("should not break and add index to title if slug exists in contentType, but it's value is undefined", async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine!',
          de: 'Hallo, Sonnenlicht!',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      const contentType = {
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

      await configureForTest.call(this, contentType);

      const entry = await this.scope.entryActions.onDuplicate();
      expect(entry.fields).toEqual({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (1)',
          de: 'Hallo, Sonnenlicht! (1)',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });
    });

    it('should index the entity title (displayName) and slug', async function () {
      await configureForTest.call(this);
      const entry = await this.scope.entryActions.onDuplicate();
      for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
        expect(localizedValue).toBe(`${stubs.getDefaultEntryFields()[entryTitleId][locale]} (1)`);
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
        expect(localizedValue).toBe(`${stubs.getDefaultEntryFields()[slugId][locale]}-1`);
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
        expect(localizedValue).toBe(stubs.getDefaultEntryFields()[notEntryTitleId][locale]);
      }
    });

    it('should increment the index for the entry title (displayName) and slug after each next duplicate', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (1)',
          de: 'Hallo, Sonnenlicht! (1)',
        },
        [slugId]: {
          'en-US': 'hey-sunshine-1',
          de: 'hallo-sonnenlicht-1',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      const contentType = {
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

      await configureForTest.call(this, contentType);

      const entry = await this.scope.entryActions.onDuplicate();
      for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
        expect(localizedValue).toBe(
          stubs.getDefaultEntryFields()[entryTitleId][locale].replace('(1)', '(2)')
        );
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
        expect(localizedValue).toBe(
          stubs.getDefaultEntryFields()[slugId][locale].replace('1', '2')
        );
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
        expect(localizedValue).toBe(stubs.getDefaultEntryFields()[notEntryTitleId][locale]);
      }
    });

    it("should set untitled slug if it is marked as required but it's value is null", async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (1)',
          de: null,
        },
        [slugId]: {
          'en-US': 'hey-sunshine-1',
          de: null,
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      const contentType = {
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
            {
              id: slugId,
              apiName: slugFieldId,
              name: 'Slug Field',
              required: true,
              type: 'Symbol',
            },
            { id: notEntryTitleId, apiName: 'secret', name: 'Secret Field', type: 'Symbol' },
          ],
          displayField: entryTitleId,
        },
      };

      await configureForTest.call(this, contentType);

      const entry = await this.scope.entryActions.onDuplicate();
      expect(entry.fields[entryTitleId]).toEqual({
        'en-US': stubs.getDefaultEntryFields()[entryTitleId]['en-US'].replace('(1)', '(2)'),
        de: null,
      });

      for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
        const original = stubs.getDefaultEntryFields()[slugId][locale];
        if (original) {
          expect(localizedValue).toBe(
            stubs.getDefaultEntryFields()[slugId][locale].replace('1', '2')
          );
        } else if (original === null) {
          expect(localizedValue).not.toBeNull();
        }
      }

      for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
        expect(localizedValue).toBe(stubs.getDefaultEntryFields()[notEntryTitleId][locale]);
      }
    });

    it('should not break down in case the entry title is not defined', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: null,
        [slugId]: null,
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();
          expect(entry.fields[entryTitleId]).toBe(null);

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it("should not set untitled slug if it's not required and it's value is null", async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine!',
          de: null,
        },
        [slugId]: {
          'en-US': 'hey-sunshine',
          de: null,
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            const originalValue = entryFields[entryTitleId][locale];
            if (originalValue !== null) {
              expect(localizedValue).toBe(`${originalValue} (1)`);
            } else {
              expect(localizedValue).toBe(originalValue);
            }
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
            const originalValue = entryFields[slugId][locale];
            if (originalValue !== null) {
              expect(localizedValue).toBe(`${originalValue}-1`);
            } else {
              expect(localizedValue).toBe(null);
            }
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should not increment a negative index after the duplication', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (-1)',
          de: 'Hallo, Sonnenlicht! (-1)',
        },
        [slugId]: {
          'en-US': 'hey-sunshine-1',
          de: 'hallo-sonnenlicht-1',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(`${entryFields[entryTitleId][locale]} (1)`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
            expect(localizedValue).toBe(`${entryFields[slugId][locale]}-1`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should not increment a zero index after the duplication', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (0)',
          de: 'Hallo, Sonnenlicht! (0)',
        },
        [slugId]: {
          'en-US': 'hey-sunshine-0',
          de: 'hallo-sonnenlicht-0',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(`${entryFields[entryTitleId][locale]} (1)`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
            expect(localizedValue).toBe(`${entryFields[slugId][locale]}-1`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should increment multi-digit indexes after the duplication', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Hey, Sunshine! (10)',
          de: 'Hallo, Sonnenlicht! (10)',
        },
        [slugId]: {
          'en-US': 'hey-sunshine-10',
          de: 'hallo-sonnenlicht-10',
        },
        [notEntryTitleId]: {
          'en-US': 'this is a text in english',
          de: 'das ist ein text in Deutsch',
        },
      });

      await configureForTest.call(this);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(entryFields[entryTitleId][locale].replace('(10)', '(11)'));
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[slugId])) {
            expect(localizedValue).toBe(entryFields[slugId][locale].replace('10', '11'));
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should fall back to id if apiName doesnt match the slug fieldId', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Test string',
          de: 'Test string de',
        },
        [slugFieldId]: {
          'en-US': 'test-string',
          de: 'test-string-de',
        },
        [notEntryTitleId]: {
          'en-US': 'random string',
          de: 'random string de',
        },
      });

      const editorControls = [
        {
          widgetId: 'slugEditor',
          id: slugId,
          fieldId: slugFieldId,
        },
      ];

      const contentType = {
        data: {
          fields: [
            { id: entryTitleId, name: 'Tile Field', localized: true, type: 'Symbol' },
            { id: slugFieldId, apiName: 'something-weird', name: 'Slug Field', type: 'Symbol' },
            { id: notEntryTitleId, name: 'Secret Field', type: 'Symbol' },
          ],
          displayField: entryTitleId,
        },
      };

      await configureForTest.call(this, contentType, editorControls);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(`${entryFields[entryTitleId][locale]} (1)`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[slugFieldId])) {
            expect(localizedValue).toBe(`${entryFields[slugFieldId][locale]}-1`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });

    it('should sync slugs for each locale if title being localized: false', async function () {
      this.sandbox.stub(stubs, 'getDefaultEntryFields').returns({
        [entryTitleId]: {
          'en-US': 'Test string',
        },
        [slugId]: {
          'en-US': 'test-string',
          de: 'test-string',
        },
        [notEntryTitleId]: {
          'en-US': 'random string',
          de: 'random string de',
        },
      });

      const editorControls = [
        {
          widgetId: 'slugEditor',
          id: slugId,
          fieldId: slugId,
        },
      ];

      const contentType = {
        data: {
          fields: [
            {
              id: entryTitleId,
              name: 'Tile Field',
              required: true,
              localized: false,
              type: 'Symbol',
            },
            { id: slugId, apiName: slugId, name: 'Slug Field', type: 'Symbol' },
            { id: notEntryTitleId, name: 'Secret Field', type: 'Symbol' },
          ],
          displayField: entryTitleId,
        },
      };

      await configureForTest.call(this, contentType, editorControls);

      const entryFields = stubs.getDefaultEntryFields();

      expect(
        async function () {
          const entry = await this.scope.entryActions.onDuplicate();

          for (const [locale, localizedValue] of Object.entries(entry.fields[entryTitleId])) {
            expect(localizedValue).toBe(`${entryFields[entryTitleId][locale]} (1)`);
          }

          for (const [_, localizedValue] of Object.entries(entry.fields[slugId])) {
            expect(localizedValue).toBe(`${entryFields[slugId]['en-US']}-1`);
          }

          for (const [locale, localizedValue] of Object.entries(entry.fields[notEntryTitleId])) {
            expect(localizedValue).toBe(entryFields[notEntryTitleId][locale]);
          }
        }.bind(this)
      ).not.toThrow();
    });
  });
});
