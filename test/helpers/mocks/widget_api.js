import * as sinon from 'test/helpers/sinon';
import _ from 'lodash';
import * as K from 'test/helpers/mocks/kefir';

angular
  .module('contentful/mocks')
  /**
   * Create a mock implementation of the widget API.
   *
   * Methods are either stubbed or replaced by a mock implementation.
   *
   * Use `mockWidgetApi._state` to inspect internal state modified by methods.
   */
  .factory('mocks/widgetApi', [
    '$q',
    'app/entity_editor/PublicationWarnings/UnpublishedReferencesWarning/index.es6',
    'app/entity_editor/PublicationWarnings/index.es6',
    (
      $q,
      { registerUnpublishedReferencesWarning },
      { create: createPublicationWarningsManager }
    ) => {
      return {
        create: create,
        createField: createField
      };

      function create(overrides) {
        const state = {
          // Set by field.isInvalid()
          isInvalid: false
        };

        const entrySys = {
          contentType: { sys: { id: 'CTID' } }
        };

        const fieldProperties = {
          isDisabled$: K.createMockProperty(false),
          schemaErrors$: K.createMockProperty(null),
          access$: K.createMockProperty({ editable: true }),
          value$: K.createMockProperty()
        };

        const api = {
          _state: state,
          settings: {
            helpText: ''
          },
          _internal: {
            createReferenceContext: sinon.stub()
          },
          locales: {
            default: 'en-US',
            available: ['en-US']
          },
          contentType: {
            displayField: '',
            sys: { id: 'content-type-id' }
          },
          entry: {
            getSys: sinon.stub().returns(entrySys),
            fields: {}
          },
          fieldProperties: fieldProperties,
          field: {
            onValueChanged: sinon.spy(cb => K.onValue(fieldProperties.value$, cb)),
            onIsDisabledChanged: function(cb) {
              return K.onValue(fieldProperties.isDisabled$, cb);
            },
            onPermissionChanged: function(cb) {
              return K.onValue(fieldProperties.access$, cb);
            },
            onSchemaErrorsChanged: function(cb) {
              return K.onValue(fieldProperties.schemaErrors$, cb);
            },
            setInvalid: sinon.spy(isInvalid => {
              state.isInvalid = isInvalid;
            }),
            getValue: sinon.spy(() => K.getValue(fieldProperties.value$)),
            setValue: sinon.spy(value => {
              fieldProperties.value$.set(value);
              return $q.resolve();
            }),
            removeValue: sinon.stub(),
            removeValueAt: sinon.stub(),
            insertValue: sinon.stub(),
            pushValue: sinon.stub(),
            id: '',
            name: '',
            locale: 'en-US',
            type: '',
            registerUnpublishedReferencesWarning: sinon.spy(
              registerUnpublishedReferencesWarning(createPublicationWarningsManager())
            ),

            value$: K.createMockProperty()
          },
          space: {
            getEntries: sinon.stub().resolves({ total: 0, items: [] }),
            getAssets: sinon.stub().resolves({ total: 0, items: [] }),
            createEntry: sinon.stub().resolves({}),
            createAsset: sinon.stub().resolves({}),
            getContentTypes: sinon.stub().resolves([])
          },
          state: {
            goToEditor: sinon.stub().resolves()
          }
        };

        return _.merge(api, overrides);
      }

      function createField() {
        return {
          getValue: sinon.stub(),
          onValueChanged: sinon
            .stub()
            .returns(_.noop)
            .yields()
        };
      }
    }
  ]);
