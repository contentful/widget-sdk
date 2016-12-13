'use strict';

angular.module('contentful/mocks')
/**
 * @ngdoc service
 * @name mocks/entityEditor/Context
 * @description
 * Create a mock implementation of the entry and asset editor
 * controllers.
 *
 * The implementation is not yet complete.
 */
.factory('mocks/entityEditor/Context', ['require', function (require) {
  const K = require('mocks/kefir');
  const Focus = require('app/entity_editor/Focus');

  return {create: create};

  function create () {
    return {
      validator: createValidator(),
      focus: Focus.create(),
      entityInfo: {
        id: 'ENTITY ID',
        type: 'Entry'
      }
    };
  }

  // TODO replace this with the actual implementation
  function createValidator () {
    const errors$ = K.createMockProperty([]);

    return {
      errors$: errors$,
      run: sinon.stub().returns(true),
      hasFieldError: sinon.stub().returns(false),
      hasFieldLocaleError: sinon.stub().returns(false),
      setApiResponseErrors: sinon.spy(function (response) {
        errors$.set(dotty.get(response, ['body', 'details', 'errors']));
      })
    };
  }
}]);
