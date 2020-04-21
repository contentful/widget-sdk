import { Error as DocError } from './Error';
import DocumentStatusCode from './statusCode';
import { create } from './status';
import * as Kefir from 'core/utils/kefir';
import * as K from '../../../../test/utils/kefir';

jest.mock('services/logger', () => ({
  logSharejsError: jest.fn(),
  logServerError: jest.fn(),
}));

describe('Document status', () => {
  const sys$ = Kefir.createPropertyBus({ archivedVersion: null, deletedVersion: null });
  const docError$ = Kefir.createPropertyBus(null);
  const status$ = create(sys$.property, docError$.property, true);

  beforeEach(() => {
    sys$.set({ archivedVersion: null, deletedVersion: null });
    docError$.set(null);
  });

  it('is OK if no errors and can edit', () => {
    const status$ = create(sys$.property, docError$.property, true);
    K.assertCurrentValue(status$, DocumentStatusCode.OK);
  });
  it('is INTERNAL_SERVER_ERROR on CmaInternalServerError', () => {
    docError$.set(DocError.CmaInternalServerError());
    K.assertCurrentValue(status$, DocumentStatusCode.INTERNAL_SERVER_ERROR);
  });
  it('is INTERNAL_SERVER_ERROR on ShareJsInternalServerError', () => {
    docError$.set(DocError.ShareJsInternalServerError());
    K.assertCurrentValue(status$, DocumentStatusCode.INTERNAL_SERVER_ERROR);
  });
  it('is EDIT_CONFLICT on VersionMismatch', () => {
    docError$.set(DocError.VersionMismatch());
    K.assertCurrentValue(status$, DocumentStatusCode.EDIT_CONFLICT);
  });
  it('is NOT_ALLOWED on OpenForbidden', () => {
    docError$.set(DocError.OpenForbidden());
    K.assertCurrentValue(status$, DocumentStatusCode.NOT_ALLOWED);
  });
  it('is NOT_ALLOWED when cannot update', () => {
    const status$ = create(sys$.property, docError$.property, false);
    K.assertCurrentValue(status$, DocumentStatusCode.NOT_ALLOWED);
  });
  it('is CONNECTION_ERROR on Disconnected', () => {
    docError$.set(DocError.Disconnected());
    K.assertCurrentValue(status$, DocumentStatusCode.CONNECTION_ERROR);
  });
  it('is CONNECTION_ERROR on any other error', () => {
    docError$.set('error');
    K.assertCurrentValue(status$, DocumentStatusCode.CONNECTION_ERROR);
  });
  it('is ARCHIVED for an archived entity', () => {
    sys$.set({ archivedVersion: 1, deletedVersion: null });
    K.assertCurrentValue(status$, DocumentStatusCode.ARCHIVED);
  });
  it('is DELETED for an deleted entity', () => {
    sys$.set({ archivedVersion: null, deletedVersion: 1 });
    K.assertCurrentValue(status$, DocumentStatusCode.DELETED);
  });
});
