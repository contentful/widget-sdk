import { createEditorContextMock } from '../../../../test/utils/createEditorContextMock';
import { createFieldLocaleController } from './fieldLocaleController';
import { createDocumentMock } from '../../../../test/utils/createDocumentMock';
import * as K from '../../../../test/utils/kefir';
import { noop } from 'lodash';

import { waitFor } from '@testing-library/dom';

jest.mock('services/logger', () => ({
  logSharejsError: jest.fn(),
  logServerError: jest.fn(),
}));

let args;
const create = (patchArgs = noop) => {
  const doc = createDocumentMock().create();
  args = {
    field: { id: 'FID' },
    locale: { internal_code: 'LID' },
    doc,
    editorContext: createEditorContextMock().create(),
    entrySidebarProps: {
      emitter: {
        on: jest.fn(),
      },
    },
  };
  patchArgs(args);
  return createFieldLocaleController(args);
};

describe('fieldLocaleController', () => {
  describe('#errors$ and #errors', () => {
    it('get filtered items from "validator.errors"', () => {
      const fieldLocaleController = create();

      const fieldLocaleErrors = [
        { path: ['fields', 'FID'] },
        { path: ['fields', 'FID', 'LID'] },
        { path: ['fields', 'FID', 'LID', 'X'] },
      ];

      const otherErrors = [
        { path: ['fields', 'FID', 'LID-2'] },
        { path: ['fields', 'FID-2', 'LID'] },
        { path: ['fields', 'FID-2'] },
        { path: null },
      ];

      const errorsStream = K.extractValues(fieldLocaleController.errors$);
      args.editorContext.validator.errors$.set(fieldLocaleErrors.concat(otherErrors));
      expect(fieldLocaleController.errors).toEqual(fieldLocaleErrors);
      expect(errorsStream[0]).toEqual(fieldLocaleErrors);
    });

    it('is set to "null" if no errors match', () => {
      const fieldLocaleController = create();
      args.editorContext.validator.errors$.set([{ path: 'does not match' }]);
      const errorsStream = K.extractValues(fieldLocaleController.errors$);
      expect(fieldLocaleController.errors).toBeNull();
      expect(errorsStream[0]).toBeNull();
    });

    it('excludes field-level "required" error if a locale is optional', () => {
      const errors = [
        { path: ['fields', 'FID'], name: 'required' },
        { path: ['fields', 'FID'], name: 'other' },
      ];
      const fieldLocaleController = create((args) => (args.locale.optional = true));
      const errorsStream = K.extractValues(fieldLocaleController.errors$);
      args.editorContext.validator.errors$.set(errors);
      expect(fieldLocaleController.errors).toEqual([errors[1]]);
      expect(errorsStream[0]).toEqual([errors[1]]);
    });
  });

  describe('#isRequired', () => {
    let isRequired;
    describe('for entries', () => {
      beforeEach(() => {
        isRequired = (required, optional) => {
          return create((args) => {
            args.field.required = required;
            args.locale.optional = optional;
          }).isRequired;
        };
      });

      it('is required when field is required and locale is not optional', () => {
        expect(isRequired(true, false)).toBe(true);
      });

      it('is not required when field is not required', () => {
        expect(isRequired(false, false)).toBe(false);
      });

      it('is not required when field is required but locale is optional', () => {
        expect(isRequired(true, true)).toBe(false);
      });
    });

    describe('for assets', () => {
      beforeEach(() => {
        isRequired = (required, def) => {
          return create((args) => {
            args.editorContext.entityInfo.type = 'Asset';
            args.field.required = required;
            args.locale.default = def;
          }).isRequired;
        };
      });

      it('is required for required fields for the default locale', () => {
        expect(isRequired(true, true)).toBe(true);
      });

      it('is not required for required fields for non-default locales', () => {
        expect(isRequired(true, false)).toBe(false);
      });

      it('is not required for non-required fields in the default locale', () => {
        expect(isRequired(false, true)).toBe(false);
      });
    });
  });

  describe('#collaborators', () => {
    it('watches "docPresence" with path', () => {
      const fieldLocaleController = create((args) => {
        args.doc.presence.collaboratorsFor().set(['USER']);
      });
      expect(fieldLocaleController.collaborators).toEqual(['USER']);
    });
  });

  describe('#access', () => {
    it('is "disabled" and "disconnected" without connection and with permission', () => {
      const fieldLocaleController = create((args) => {
        args.doc.permissions.canEditFieldLocale.returns(true);
        args.doc.state.isConnected$.set(false);
      });
      expect(fieldLocaleController.access).toEqual({
        disconnected: true,
        disabled: true,
        type: 'DISCONNECTED',
      });
    });

    it('is "disconnected" and "disabled" when is connected with an erroneous document status', () => {
      const fieldLocaleController = create((args) => {
        args.doc.state.error$ = K.createMockProperty('internal-server-error');
        args.doc.state.isConnected$.set(true);
      });
      expect(fieldLocaleController.access).toEqual({
        type: 'DISCONNECTED',
        disconnected: true,
        disabled: true,
      });
    });

    it('is "disabled" and "editing_disabled" if a field is disabled', () => {
      const fieldLocaleController = create((args) => {
        args.field.disabled = true;
        args.doc.permissions.canEditFieldLocale.returns(true);
      });
      expect(fieldLocaleController.access).toEqual({
        editing_disabled: true,
        disabled: true,
        type: 'EDITING_DISABLED',
      });
    });

    it('is "disabled" and "occupied" for `RichText` field with collaborators', () => {
      const fieldLocaleController = create((args) => {
        args.doc.presence.collaboratorsFor.returns(K.createMockProperty([{}]));
        args.field.type = 'RichText';
      });
      expect(fieldLocaleController.access).toEqual({
        occupied: true,
        disabled: true,
        type: 'OCCUPIED',
      });
    });

    it('is "disabled" and "denied" without permissions and with connection', () => {
      const fieldLocaleController = create((args) => {
        args.doc.state.isConnected$.set(false);
        args.doc.permissions.canEditFieldLocale.returns(false);
      });
      expect(fieldLocaleController.access).toEqual({
        denied: true,
        disabled: true,
        type: 'DENIED',
      });
    });

    it('is "disabled" and "denied" without permissions and connection', () => {
      const fieldLocaleController = create((args) => {
        args.doc.state.isConnected$.set(false);
        args.doc.permissions.canEditFieldLocale.returns(false);
      });
      expect(fieldLocaleController.access).toEqual({
        denied: true,
        disabled: true,
        type: 'DENIED',
      });
    });

    it('is "editable" with permissions and connection', () => {
      const fieldLocaleController = create((args) => {
        args.doc.permissions.canEditFieldLocale.returns(true);
      });
      expect(fieldLocaleController.access).toEqual({
        editable: true,
        type: 'EDITABLE',
      });
    });
  });

  it('revalidates the field locale whenever the user has stopped editing for 800ms', async () => {
    jest.useFakeTimers();
    create();
    args.doc.changes.emit(['fields', 'FID', 'LID']);
    const validator = args.editorContext.validator;
    expect(validator.validateFieldLocale.notCalled).toBe(true);
    jest.advanceTimersByTime(800);
    await waitFor(() =>
      expect(validator.validateFieldLocale.calledOnceWith('FID', 'LID')).toBe(true)
    );
  });
});
