import { noop } from 'lodash';
import jestKefir from 'jest-kefir';
import * as K from '../../../../../test/utils/kefir';
import * as Kefir from 'core/utils/kefir';
import * as OtDocument from './OtDocument';
import { DocLoad } from 'data/sharejs/Connection';
import ShareJsDocMock from './__mocks__/ShareJsDocMock';
import { Error as DocError } from '../../../data/document/Error';

import testDocumentBasic, { newContentType, newEntry } from './Document.spec';

const kefirHelpers = jestKefir(Kefir); // https://github.com/kefirjs/jest-kefir
expect.extend(kefirHelpers.extensions);

const newLegacyClientEntityMock = (entity) => ({ data: entity, setDeleted: noop });

jest.mock('./PresenceHub', () => ({
  createPresenceHub: () => ({
    destroy: () => jest.fn(),
    leave: () => jest.fn(),
  }),
}));

jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ internal_code: 'en-US' }, { internal_code: 'de' }],
}));
jest.mock('access_control/EntityPermissions', () => {
  const mock = {
    create: () => ({
      can: jest.fn().mockReturnValue(mock.returnValue()),
      canEditFieldLocale: jest.fn().mockReturnValue(mock.returnValue()),
      test: mock.returnValue(),
    }),
    returnValue: jest.fn().mockReturnValue(true),
  };
  return mock;
});

function createOtDocument(initialEntity, contentTypeFields) {
  const docLoader = {
    doc: K.createMockProperty(DocLoad.None()),
    destroy: jest.fn(),
    close: jest.fn(),
  };
  const docConnection = {
    getDocLoader: jest.fn().mockReturnValue(docLoader),
    refreshAuth: jest.fn().mockResolvedValue(undefined),
  };
  const user = { sys: { id: 'USER' } };
  const contentType = newContentType(initialEntity.sys.contentType.sys, contentTypeFields);
  const otDocMock = ShareJsDocMock();
  const shareJsDoc = new otDocMock(initialEntity);
  docLoader.doc.set(DocLoad.Doc(shareJsDoc));
  const entity = newLegacyClientEntityMock(initialEntity);
  return {
    document: OtDocument.create(docConnection, entity, contentType, user, 'fake/endpoint'),
    docLoader,
    shareJsDoc,
  };
}

describe('OtDocument', () => {
  testDocumentBasic(createOtDocument);

  const fieldPath = ['fields', 'fieldA', 'en-US'];
  let doc;
  let entry;

  beforeEach(() => {
    entry = newEntry();
    doc = createOtDocument(entry).document;
  });

  describe('sysProperty', () => {
    it('bumps version after update', function () {
      const newVersionSys = { ...entry.sys, version: entry.sys.version + 1 };
      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(K.getValue(doc.sysProperty)).toMatchObject(newVersionSys);
    });
  });

  describe('state', () => {
    describe('error$', () => {
      let docLoader;
      beforeEach(() => {
        const { document, docLoader: d } = createOtDocument(entry);
        doc = document;
        docLoader = d;
      });

      it('emits OpenForbidden error when document access is not allowed', () => {
        docLoader.doc.set(DocLoad.Error('forbidden'));
        K.assertCurrentValue(doc.state.error$, DocError.OpenForbidden());
      });
      it('emits Disconnected when losing ShareJs connection', () => {
        docLoader.doc.set(DocLoad.Error('disconnected'));
        K.assertCurrentValue(doc.state.error$, DocError.Disconnected());
      });
      it('emits ShareJsInternalServerError when ShareJs throws internal server error', () => {
        docLoader.doc.set(DocLoad.Error('internal-server-error'));
        K.assertCurrentValue(doc.state.error$, DocError.ShareJsInternalServerError());
      });
      it('resets the error null after recovery', () => {
        docLoader.doc.set(DocLoad.Error('disconnected'));
        docLoader.doc.set(null);
        K.assertCurrentValue(doc.state.error$, null);
      });
      it('emits "internal-server-error" when field setter throws internal server error', () => {
        // Skipping: in CMA document this case won't happen, and it's too hard to test it for ShareJS document
      });
      it('emits SetValueForbidden(path) when changing a value is not allowed', () => {
        // Same as above
      });
    });

    // Bool describing whether the document has changes unacknowledged by the server
    describe('isSaving$', () => {
      let shareJsDoc;
      beforeEach(() => {
        const newDoc = createOtDocument(entry);
        doc = newDoc.document;
        shareJsDoc = newDoc.shareJsDoc;
      });

      it('is true after a change is made', () => {
        shareJsDoc.pendingOp = true; // set pending mode
        doc.setValueAt(fieldPath, 'en-US-updated'); // trigger a change
        K.assertCurrentValue(doc.state.isSaving$, true);
      });
      it('is false after the document is saved', () => {
        shareJsDoc.pendingOp = true;
        doc.setValueAt(fieldPath, 'en-US-updated');
        shareJsDoc.pendingOp = false;
        K.assertCurrentValue(doc.state.isSaving$, false);
      });
    });

    describe('loaded$', () => {
      let docLoader;
      beforeEach(() => {
        const { document, docLoader: d } = createOtDocument(entry);
        doc = document;
        docLoader = d;
      });

      it('is a Kefir.Property', () => {
        expect(doc.state.loaded$).toBeProperty();
      });
      // From OtDoc it is not clear how and when Pending is triggered, the prop depends only on Pending
      it('is `true` when document is loaded', () => {
        K.assertCurrentValue(doc.state.loaded$, true);
      });
      it('is `true` if loading fails', () => {
        docLoader.doc.set(DocLoad.Error('forbidden'));
        K.assertCurrentValue(doc.state.loaded$, true);
      });
      it('is `false` when ShareJs doc is pending', () => {
        docLoader.doc.set(DocLoad.Pending());
        K.assertCurrentValue(doc.state.loaded$, false);
      });
    });
  });

  describe('setValueAt()', () => {
    it('throws ShareJs forbidden error on field level', async () => {
      const newDoc = createOtDocument(entry);
      doc = newDoc.document;
      const shareJsDoc = newDoc.shareJsDoc;
      shareJsDoc.setAt = jest.fn().mockImplementationOnce(() => {
        throw new Error('forbidden');
      });
      await expect(doc.setValueAt(fieldPath, 'en-US-updated')).rejects.toThrow('forbidden');
    });
  });
});
