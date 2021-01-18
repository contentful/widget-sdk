import { createFieldLocaleController } from './fieldLocaleController';
import * as K from '__mocks__/kefirMock';
import { noop } from 'lodash';

import { waitFor } from '@testing-library/dom';
import { createDocumentMock } from './Document/__mocks__/createDocumentMock';
import { createEditorContextMock } from '__mocks__/createEditorContextMock';

jest.mock('services/logger', () => ({
  logSharejsError: jest.fn(),
  logServerError: jest.fn(),
}));

let args;
const create = (patchArgs = noop) => {
  const otDoc = createDocumentMock().create();
  args = {
    widget: {
      field: { id: 'FID' },
    },
    locale: { internal_code: 'LID' },
    otDoc,
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
            args.widget.field.required = required;
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
            args.widget.field.required = required;
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
        args.otDoc.presence.collaboratorsFor().set(['USER']);
      });
      expect(fieldLocaleController.collaborators).toEqual(['USER']);
    });
  });

  describe('#setActive()', () => {
    it('calls "otDoc.presence.focus()" if set to true', () => {
      const fieldLocaleController = create();
      fieldLocaleController.setActive(true);
      expect(args.otDoc.presence.focus).toHaveBeenCalledWith('FID', 'LID');
    });

    it('sets the editor context field focus', () => {
      const fieldLocaleController = create();
      K.assertCurrentValue(args.editorContext.focus.field$, null);
      fieldLocaleController.setActive(true);
      K.assertCurrentValue(args.editorContext.focus.field$, 'FID');
    });

    it('does not set focus on a disabled field', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(false);
      });
      fieldLocaleController.setActive(true);
      K.assertCurrentValue(args.editorContext.focus.field$, null);
    });

    it('unsets the editor context field focus', () => {
      const fieldLocaleController = create();
      fieldLocaleController.setActive(true);
      K.assertCurrentValue(args.editorContext.focus.field$, 'FID');
      fieldLocaleController.setActive(false);
      K.assertCurrentValue(args.editorContext.focus.field$, null);
    });
  });

  describe('#access', () => {
    it('is "disabled" and "disconnected" without connection and with permission', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(true);
        args.otDoc.state.isConnected$.set(false);
      });
      expect(fieldLocaleController.access).toEqual({
        disconnected: true,
        disabled: true,
        type: 'DISCONNECTED',
      });
    });

    it('is "disconnected" and "disabled" when is connected with an erroneous document status', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.state.error$ = K.createMockProperty('internal-server-error');
        args.otDoc.state.isConnected$.set(true);
      });
      expect(fieldLocaleController.access).toEqual({
        type: 'DISCONNECTED',
        disconnected: true,
        disabled: true,
      });
    });

    it('is "disabled" and "editing_disabled" if a field is disabled', () => {
      const fieldLocaleController = create((args) => {
        args.widget.field.disabled = true;
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(true);
      });
      expect(fieldLocaleController.access).toEqual({
        editing_disabled: true,
        disabled: true,
        type: 'EDITING_DISABLED',
      });
    });

    it('is "disabled" and "occupied" for `RichText` field with collaborators', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.presence.collaboratorsFor.mockReturnValue(K.createMockProperty([{}]));
        args.widget.field.type = 'RichText';
      });
      expect(fieldLocaleController.access).toEqual({
        occupied: true,
        disabled: true,
        type: 'OCCUPIED',
      });
    });

    it('is "disabled" and "denied" without permissions and with connection', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.state.isConnected$.set(false);
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(false);
      });
      expect(fieldLocaleController.access).toEqual({
        denied: true,
        disabled: true,
        type: 'DENIED',
      });
    });

    it('is "disabled" and "denied" without permissions and connection', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.state.isConnected$.set(false);
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(false);
      });
      expect(fieldLocaleController.access).toEqual({
        denied: true,
        disabled: true,
        type: 'DENIED',
      });
    });

    it('is "editable" with permissions and connection', () => {
      const fieldLocaleController = create((args) => {
        args.otDoc.permissions.canEditFieldLocale.mockReturnValue(true);
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
    args.otDoc.changes.emit(['fields', 'FID', 'LID']);
    const validator = args.editorContext.validator;
    expect(validator.validateFieldLocale).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    await waitFor(() => {
      expect(validator.validateFieldLocale).toHaveBeenCalledTimes(1);
      expect(validator.validateFieldLocale).toHaveBeenCalledWith('FID', 'LID');
    });
  });
});
