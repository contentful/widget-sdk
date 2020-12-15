import * as K from './kefir';
import _ from 'lodash';
import * as Focus from 'app/entity_editor/Focus';
import sinon from 'sinon';

// TODO replace sinon with jest when test/helpers/mocks/editor_context.js is migrated
export const createEditorContextMock = () => {
  return { create: create };

  function create() {
    return {
      validator: createValidator(),
      hasInitialFocus: false,
      focus: Focus.create(),
      entityInfo: {
        id: 'ENTITY ID',
        type: 'Entry',
      },
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
      setApiResponseErrors: sinon.spy((response) => {
        errors$.set(_.get(response, ['body', 'details', 'errors']));
      }),
      validateFieldLocale: sinon.spy(),
    };
  }
};
