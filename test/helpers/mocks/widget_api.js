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
    const state = {
      // Set by field.isInvalid()
      isInvalid: false
    };

    const entrySys = {
      contentType: {sys: {id: 'CTID'}}
    };

    const api = {
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
        onValueChanged: sinon.stub().returns(_.noop).yields(undefined),
        onIsDisabledChanged: sinon.stub().returns(_.noop).yields(false),
        onSchemaErrorsChanged: sinon.stub().returns(_.noop).yields(null),
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
        name: '',
        locale: 'en-US',
        type: '',
        registerPublicationWarning: sinon.stub().returns(_.noop)
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
