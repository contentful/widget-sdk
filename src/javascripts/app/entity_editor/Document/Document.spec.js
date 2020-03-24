import _ from 'lodash';
import jestKefir from 'jest-kefir';
import * as K from '../../../../../test/utils/kefir';
import * as Kefir from 'utils/kefir';
import * as OtDocument from './OtDocument';
import { DocLoad } from 'data/sharejs/Connection';
import ShareJsDocMock from './ShareJsDocMock';
import { Error as DocError } from '../../../data/document/Error';
import statusCode from '../../../data/document/statusCode';
import * as Permissions from 'access_control/EntityPermissions';

const kefirHelpers = jestKefir(Kefir); // https://github.com/kefirjs/jest-kefir
const { value } = kefirHelpers; // end
expect.extend(kefirHelpers.extensions);

const mockEntry = fields => ({
  data: {
    sys: {
      type: 'Entry',
      version: 1,
      contentType: {
        sys: { id: 'ctId' }
      },
    },
    fields: fields || {
      fieldA: { 'en-US': 'en' },
      fieldB: { 'en-US': 'val-EN', de: 'val-DE' },
      listField: { 'en-US': ['one'] },
      stringField: { 'en-US': 'value' }
    }
  },
  setDeleted: _.noop
});

// Mock Angular getModule for PresenceHub in OtDocument
jest.mock('NgRegistry', () => ({
  getModule: () => ({
    create: () => ({
      destroy: () => jest.fn(),
      leave: () => jest.fn()
    })
  })
}));
jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ internal_code: 'en-US' }, { internal_code: 'de' }]
}));
jest.mock('./Reverter', () => ({ create: jest.fn() }));
jest.mock('access_control/EntityPermissions', () => {
  const mock = {
    create: () => ({
      can: jest.fn().mockReturnValue(mock.returnValue()),
      canEditFieldLocale: jest.fn().mockReturnValue(mock.returnValue()),
      test: mock.returnValue()
    }),
    returnValue: jest.fn().mockReturnValue(true)
  };
  return mock;
});

function createOtDocument(initialEntity, spaceEndpoint = 'fake/endpoint', contentTypeFields) {
  const docLoader = {
    doc: K.createMockProperty(DocLoad.None()),
    destroy: jest.fn(),
    close: jest.fn()
  };
  const docConnection = {
    getDocLoader: jest.fn().mockReturnValue(docLoader),
    refreshAuth: jest.fn().mockResolvedValue(undefined)
  };
  const user = { sys: { id: 'USER' } };
  const contentType = {
    data: {
      sys: initialEntity.data.sys.contentType.sys,
      fields: contentTypeFields || [
        { id: 'fieldA' },
        { id: 'fieldB' },
        { id: 'listField' },
        {
          id: 'stringField',
          type: 'Text'
        }
      ]
    }
  };
  const otDocMock = ShareJsDocMock();
  const doc = new otDocMock(initialEntity.data);
  docLoader.doc.set(DocLoad.Doc(doc));
  return {
    document: OtDocument.create(docConnection, initialEntity, contentType, user, spaceEndpoint),
    docLoader,
    shareJsDoc: doc
  };
}

describe('OtDocument', () => {
  const fieldPath = ['fields', 'fieldA', 'en-US'];
  const anotherFieldPath = ['fields', 'fieldB', 'en-US'];
  let doc;
  let entry;

  beforeEach(() => {
    entry = mockEntry();
    doc = createOtDocument(entry).document;
  });

  // a stream of changes on the document (either remotely or locally)
  describe('changes', () => {
    it('is a Kefir.Stream', () => {
      expect(doc.changes).toBeStream();
    });

    describe('emits the changed value immediately after', () => {
      const fieldPath = ['fields', 'fieldA', 'en-US'];

      it('setValueAt(fieldPath) on a field', () => {
        expect(doc.changes).toEmit([value(fieldPath)], () => {
          doc.setValueAt(fieldPath, 'en-US-updated');
        });
      });

      it('pushValueAt(fieldPath) on a field', () => {
        const listFieldPath = ['fields', 'listField', 'en-US'];
        expect(doc.changes).toEmit([value(listFieldPath)], () => {
          doc.pushValueAt(listFieldPath, 'en-US-updated-2');
        });
      });

      it('removeValueAt(fieldPath) on a field', () => {
        expect(doc.changes).toEmit([value(fieldPath)], () => {
          doc.removeValueAt(fieldPath);
        });
      });
    });
  });

  describe('data$', () => {
    it('is a Kefir.Property', () => {
      expect(doc.data$).toBeProperty();
    });

    it('emits initial entity data', () => {
      K.assertCurrentValue(doc.data$, entry.data);
    });

    it('exposes updated entity data', () => {
      const updatedEntry = _.cloneDeep(entry.data);
      _.set(updatedEntry, fieldPath, 'en-US-updated');
      _.set(updatedEntry, 'sys.version', 2);

      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(K.getValue(doc.data$)).toMatchObject(updatedEntry);
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

      it('is a Kefir.Property', () => {
        expect(doc.state.error$).toBeProperty();
      });
      it('is empty when opened document successfully', () => {
        K.assertCurrentValue(doc.state.error$, null);
      });
      it('emits OpenForbidden error when document access is not allowed', () => {
        docLoader.doc.set(DocLoad.Error('forbidden'));
        K.assertCurrentValue(doc.state.error$, DocError.OpenForbidden());
      });
      it('emits Disconnected when losing ShareJs connection', () => {
        docLoader.doc.set(DocLoad.Error('disconnected'));
        K.assertCurrentValue(doc.state.error$, DocError.Disconnected());
      });
      it('emits "internal-server-error" when ShareJs throws internal server error', () => {
        // TODO: this should use the same approach: DocError.InternalServerError constructor
        docLoader.doc.set(DocLoad.Error(statusCode.INTERNAL_SERVER_ERROR));
        K.assertCurrentValue(doc.state.error$, statusCode.INTERNAL_SERVER_ERROR);
      });
      it('resets the error null after recovery', () => {
        docLoader.doc.set(DocLoad.Error('disconnected'));
        docLoader.doc.set(null);
        K.assertCurrentValue(doc.state.error$, null);
      });
      it('emits "internal-server-error" when field setter throws internal server error', () => {
        // TODO: skipping: in CMA document this case won't happen, and it's too hard to test it for ShareJS document
      });
      it('emits SetValueForbidden(path) when changing a value is not allowed', () => {
        // TODO: same as above
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

      it('is a Kefir.Property', () => {
        expect(doc.state.isSaving$).toBeProperty();
      });
      it('is false initially', () => {
        K.assertCurrentValue(doc.state.isSaving$, false);
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

    // TODO: check if only Revert feature is using that. if so, it won't be needed in CmaDocument
    describe('isDirty$', () => {
      it('is a Kefir.Property', () => {
        expect(doc.state.isDirty$).toBeProperty();
      });
      it('is true for never-published document', () => {
        expect(doc.getValueAt(['sys', 'publishedVersion'])).toBeUndefined();
        K.assertCurrentValue(doc.state.isDirty$, true);
      });
      it('is false for a published document without changes', () => {
        doc.setValueAt(['sys', 'publishedVersion'], entry.data.sys.version);
        K.assertCurrentValue(doc.state.isDirty$, false);
      });
      it('is true for a published document with un-published changes', () => {
        doc.setValueAt(fieldPath, 'en-US-updated');
        K.assertCurrentValue(doc.state.isDirty$, true);
      });
      it('is false for a published document with published changes', () => {
        doc.setValueAt(fieldPath, 'en-US-updated');
        // Set published version to + 1 of current version, because setValueAt will bump the version again.
        doc.setValueAt(['sys', 'publishedVersion'], doc.getValueAt(['sys', 'version']) + 1);
        K.assertCurrentValue(doc.state.isDirty$, false);
      });
    });

    // NB: does not take field-based auth into account!
    describe('canEdit$', () => {
      it('is a Kefir.Property', () => {
        expect(doc.state.canEdit$).toBeProperty();
      });
      it('is true for non-archived, non-deleted document editable by the user', () => {
        const sys = doc.getValueAt(['sys']);
        expect(sys.archivedVersion).toBeUndefined();
        expect(sys.deletedVersion).toBeUndefined();
        expect(Permissions.create(entry.data.sys).can('update')).toBeTruthy();
        K.assertCurrentValue(doc.state.canEdit$, true);
      });
      it('is false for archived document', () => {
        doc.setValueAt(['sys', 'archivedVersion'], 1);
        K.assertCurrentValue(doc.state.canEdit$, false);
      });
      it('is false for deleted document', () => {
        doc.setValueAt(['sys', 'deletedVersion'], 1);
        K.assertCurrentValue(doc.state.canEdit$, false);
      });
      it('is false for document not editable by the user', () => {
        Permissions.returnValue.mockReturnValueOnce(false);
        doc = createOtDocument(entry).document; // recreate doc to use the updated permissions mock
        K.assertCurrentValue(doc.state.canEdit$, false);
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
      // TODO: from OtDoc it is not clear how and when Pending is triggered, the prop depends only on Pending
      it('is true when document is loaded', () => {
        K.assertCurrentValue(doc.state.loaded$, true);
      });
      it('is true if loading fails', () => {
        docLoader.doc.set(DocLoad.Error('forbidden'));
        K.assertCurrentValue(doc.state.loaded$, true);
      });
      it('is false when ShareJs doc is pending', () => {
        docLoader.doc.set(DocLoad.Pending());
        K.assertCurrentValue(doc.state.loaded$, false);
      });
    });
  });

  describe('sysProperty', () => {
    it('is a Kefir.Property', () => {
      expect(doc.sysProperty).toBeProperty();
    });

    it('emits entity.data.sys as initial value', function() {
      K.assertCurrentValue(doc.sysProperty, entry.data.sys);
    });

    it('bumped version after update', function() {
      const newVersionSys = { ...entry.data.sys, version: entry.data.sys.version + 1 };
      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(K.getValue(doc.sysProperty)).toMatchObject(newVersionSys);
    });
  });

  describe('getValueAt(fieldPath)', () => {
    it('returns initial value', () => {
      expect(doc.getValueAt(['fields', 'fieldA', 'en-US'])).toBe('en');
    });

    it('returns updated value for `path=fieldPath`', () => {
      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(doc.getValueAt(fieldPath)).toBe('en-US-updated');
    });

    it('returns initial value if `path=anotherFieldPath`', () => {
      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(doc.getValueAt(anotherFieldPath)).toBe('val-EN');
    });
  });

  describe('getVersion()', () => {
    it('returns version of initial entity', () => {
      expect(doc.getVersion()).toBe(1);
    });
  });

  // TODO:xxx Add Tests for basic setter functions and their important error cases!
  describe('setValueAt()', () => {
    it('sets value for a previously unset field', () => {
      doc.setValueAt(['fields', 'newField', 'en-US'], 'en-US-new-value');
      expect(doc.getValueAt(['fields', 'newField', 'en-US'])).toBe('en-US-new-value');
    });

    it('updates the existing field value', () => {
      doc.setValueAt(fieldPath, 'en-US-updated');
      expect(doc.getValueAt(fieldPath)).toBe('en-US-updated');
    });

    it('throws when string field is given invalid value', async () => {
      expect.assertions(1);
      try {
        await doc.setValueAt(['fields', 'stringField', 'en-US'], 123);
      } catch (e) {
        expect(e.message).toBe('Invalid string field value.');
      }
    });

    it('throws ShareJs forbidden error on field level', async () => {
      const newDoc = createOtDocument(entry);
      doc = newDoc.document;
      const shareJsDoc = newDoc.shareJsDoc;
      shareJsDoc.setAt = jest.fn().mockImplementationOnce(() => {
        throw new Error('forbidden');
      });

      expect.assertions(1);
      try {
        await doc.setValueAt(fieldPath, 'en-US-updated');
      } catch (e) {
        expect(e.message).toBe('forbidden');
      }
    });
  });

  describe('pushValueAt()', () => {
    it('adds an item to a list field', () => {
      doc.pushValueAt(['fields', 'listField', 'en-US'], 'new-list-value');
      expect(doc.getValueAt(['fields', 'listField', 'en-US'])).toEqual(['one', 'new-list-value']);
    });
  });

  describe('removeValueAt()', () => {
    it('removes a value from a field locale', () => {
      doc.removeValueAt(['fields', 'fieldB', 'en-US']);
      expect(doc.getValueAt(['fields', 'fieldB', 'en-US'])).toBeUndefined();
      expect(doc.getValueAt(['fields', 'fieldB', 'de'])).toBe('val-DE');
    });
    it('removes a whole field', () => {
      doc.removeValueAt(['fields', 'fieldA']);
      expect(doc.getValueAt(['fields', 'fieldA'])).toBeUndefined();
    });
    it('does not throw when removed a non-existing path', () => {
      expect(() => doc.removeValueAt(['fields', 'non-existing', 'field'])).not.toThrow();
    });
  });

  describe('snapshot normalization', () => {
    it('removes unknown fields and locales on document load', () => {
      const notNormalizedEntry = mockEntry({
        field1: { 'en-US': true, fr: true },
        field2: { 'en-US': true },
        unknownField: true
      });
      doc = createOtDocument(notNormalizedEntry, 'fake/endpoint', [
        { id: 'field1' },
        { id: 'field2' }
      ]).document;

      const normalizedFieldValues = doc.getValueAt(['fields']);
      expect(normalizedFieldValues).toEqual({
        field1: { 'en-US': true },
        field2: { 'en-US': true }
      });
    });
  });

  describe('immediately after setValueAt(fieldPath) on a field', () => {
    beforeEach(() => {
      doc.setValueAt(fieldPath, 'en-US-updated');
    });
  });
});
