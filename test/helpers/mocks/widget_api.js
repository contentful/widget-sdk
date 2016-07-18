'use strict';

angular.module('contentful/mocks')
/**
 * Create a mock implementation of the widget API.
 *
 * Methods are either stubbed or replaced by a mock implementation.
 *
 * Use `mockWidgetApi._state` to inspect internal state modified by methods.
 */
.factory('mocks/widgetApi', [function () {
  return {
    create: create,
    createField: createField
  };

  function create (overrides) {
    var state = {
      // Set by field.isInvalid()
      isInvalid: false
    };

    var entrySys = {
      contentType: {sys: {id: 'CTID'}}
    };

    var api = {
      _state: state,
      settings: {
        helpText: ''
      },
      locales: {
        default: 'en-US',
        available: ['en-US']
      },
      contentType: {
        displayField: ''
      },
      entry: {
        getSys: sinon.stub().returns(entrySys),
        fields: {}
      },
      field: {
        onValueChanged: sinon.stub().returns(_.noop),
        onDisabledStatusChanged: sinon.stub().returns(_.noop).yields(false),
        onSchemaErrorsChanged: sinon.stub().returns(_.noop),
        setInvalid: sinon.spy(function (isInvalid) {
          state.isInvalid = isInvalid;
        }),
        getValue: sinon.stub(),
        setValue: sinon.stub(),
        removeValue: sinon.stub(),
        removeValueAt: sinon.stub(),
        insertValue: sinon.stub(),
        pushValue: sinon.stub(),
        id: '',
        locale: 'en-US',
        type: ''
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


  function createField () {
    return {
      getValue: sinon.stub(),
      onValueChanged: sinon.stub().returns(_.noop).yields()
    };
  }
}]);
