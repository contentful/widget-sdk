import * as K from './kefir';
import _ from 'lodash';
import sinon from 'sinon';

// TODO replace sinon with jest when test/helpers/mocks/editor_context.js is migrated
export const createEditorContextMock = () => {
  return { create: create };

  function create() {
    return {
      validator: createValidator(),
      hasInitialFocus: false,
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
