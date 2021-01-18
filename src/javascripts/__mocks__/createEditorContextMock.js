import * as K from '__mocks__/kefirMock';
import _ from 'lodash';
import * as Focus from 'app/entity_editor/Focus';

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
      run: jest.fn().mockReturnValue(true),
      hasFieldError: jest.fn().mockReturnValue(false),
      hasFieldLocaleError: jest.fn().mockReturnValue(false),
      setApiResponseErrors: jest.fn((response) => {
        errors$.set(_.get(response, ['body', 'details', 'errors']));
      }),
      validateFieldLocale: jest.fn(),
    };
  }
};
