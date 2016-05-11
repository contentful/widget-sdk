'use strict';

angular.module('contentful/mocks')
.factory('mocks/widgetApi', [function () {
  var entrySys = {
    contentType: {sys: {id: 'CTID'}}
  };

  return function (overrides) {
    var api = {
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
        onDisabledStatusChanged: sinon.stub().returns(_.noop),
        getValue: sinon.stub(),
        setValue: sinon.stub(),
        setString: sinon.stub(),
        removeValue: sinon.stub(),
        removeValueAt: sinon.stub(),
        insertValue: sinon.stub(),
        pushValue: sinon.stub(),
        id: '',
        locale: 'en-US',
        type: ''
      },
      space: {
        getEntries: sinon.stub().resolves({ total: 0 })
      }
    };

    return _.merge(api, overrides);
  };
}]);
