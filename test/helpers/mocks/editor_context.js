import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import _ from 'lodash';
import * as Focus from 'app/entity_editor/Focus.es6';

angular
  .module('contentful/mocks')
  /**
   * @ngdoc service
   * @name mocks/entityEditor/Context
   * @description
   * Create a mock implementation of the entry and asset editor
   * controllers.
   *
   * The implementation is not yet complete.
   */
  .factory('mocks/entityEditor/Context', () => {
    return { create: create };

    function create() {
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
    function createValidator() {
      const errors$ = K.createMockProperty([]);

      return {
        errors$: errors$,
        run: sinon.stub().returns(true),
        hasFieldError: sinon.stub().returns(false),
        hasFieldLocaleError: sinon.stub().returns(false),
        setApiResponseErrors: sinon.spy(response => {
          errors$.set(_.get(response, ['body', 'details', 'errors']));
        }),
        validateFieldLocale: sinon.spy()
      };
    }
  });
