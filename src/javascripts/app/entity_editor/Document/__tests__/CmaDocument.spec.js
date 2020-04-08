import { cloneDeep, set } from 'lodash';
import * as CmaDocument from '../unused__CmaDocument';
import testDocumentBasic, { newEntry, newContentType } from './Document.spec';
import * as K from '../../../../../../test/utils/kefir';
import { Error as DocError } from '../../../../data/document/Error';
import { THROTTLE_TIME } from '../unused__CmaDocument';

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
const mockSpaceEndpoint = () =>
  jest.fn().mockImplementation((body) => {
    const entry = cloneDeep(body.data);
    set(entry, 'sys.version', entry.sys.version + 1);
    return entry;
  });
let spaceEndpoint;

// It must be used together with jest.useRealTimers() to skip a current tick.
const wait = () => new Promise((resolve) => setTimeout(resolve, 0));

function createCmaDocument(initialEntity, contentTypeFields, throttleMs) {
  const contentType = newContentType(initialEntity.sys.contentType.sys, contentTypeFields);
  return {
    document: CmaDocument.create(
      { data: initialEntity, setDeleted: jest.fn() },
      contentType,
      spaceEndpoint,
      throttleMs
    ),
  };
}

describe('CmaDocument', () => {
  testDocumentBasic(createCmaDocument);
  const fieldPath = ['fields', 'fieldA', 'en-US'];
  /**
   * @type {Document}
   */
  let doc;
  let entry;

  beforeEach(() => {
    entry = newEntry();
    spaceEndpoint = mockSpaceEndpoint();
    doc = createCmaDocument(entry).document;
  });

  describe('initially', () => {
    it('triggers no CMA request for the next 5 sec.', () => {
      jest.useFakeTimers();
      jest.runAllTimers();
      expect(spaceEndpoint).not.toHaveBeenCalled();
    });
  });

  describe('immediately after setValueAt(fieldPath) on a field', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      doc.setValueAt(fieldPath, 'en-US-updated');
      jest.advanceTimersByTime(CmaDocument.THROTTLE_TIME - 1);
    });

    it('triggers no CMA request for the next 5 sec.', () => {
      expect(spaceEndpoint).not.toHaveBeenCalled();
    });

    it('keeps the old sysProperty version after update', () => {
      expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version);
    });
  });

  describe('5 sec. after setValueAt(fieldPath) on a field', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
    });

    it('triggers CMA request', () => {
      expect(spaceEndpoint).toBeCalledTimes(1);
    });

    it('bumps sysProperty version after update', () => {
      expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 1);
    });
  });

  describe('multiple setValueAt() calls within 5s', () => {
    it('sends one CMA request', async () => {
      jest.useFakeTimers();
      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');
      await doc.setValueAt(['fields', 'fieldB', 'en-US'], 'another updated');
      expect(spaceEndpoint).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(spaceEndpoint).toBeCalledTimes(1);
      const [body] = spaceEndpoint.mock.calls[0];
      expect(body.data.fields).toMatchObject({
        fieldA: { 'en-US': 'en-US-updated' },
        fieldB: { 'en-US': 'another updated' },
      });
    });

    it('collects changes made during saving and sends them only after 5s since last CMA request', async () => {
      jest.useFakeTimers();
      let cmaResolve;
      spaceEndpoint.mockImplementation(async (body) => {
        const entry = cloneDeep(body.data);
        return new Promise((resolve) => {
          set(entry, 'sys.version', entry.sys.version + 1);
          cmaResolve = () => resolve(entry);
        });
      });

      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');
      jest.runAllTimers();
      // Ensure the document is saving, i.e. is waiting for CMA request to finish.
      K.assertCurrentValue(doc.state.isSaving$, true);
      await doc.setValueAt(['fields', 'fieldB', 'en-US'], 'value set during saving');
      cmaResolve();
      jest.useRealTimers(); // switch back to real timers to let persistEntity to finish in the current tick
      await new Promise((resolve) => setTimeout(resolve, 0));
      K.assertCurrentValue(doc.state.isSaving$, false);
      // Ensure the value was not overwritten by the response entity.
      expect(doc.getValueAt(['fields', 'fieldB', 'en-US'])).toBe('value set during saving');

      jest.useFakeTimers();
      // Start a new CMA request with fake timer.
      await doc.setValueAt(fieldPath, doc.getValueAt(fieldPath));
      jest.advanceTimersByTime(THROTTLE_TIME - 100);
      expect(spaceEndpoint).toBeCalledTimes(1);
      jest.advanceTimersByTime(200);
      expect(spaceEndpoint).toBeCalledTimes(2);
      const [body] = spaceEndpoint.mock.calls[1]; // take second call
      expect(body.data.fields).toMatchObject({
        fieldA: { 'en-US': 'en-US-updated' },
        fieldB: { 'en-US': 'value set during saving' },
      });
    });
  });

  describe('CMA call taking longer than 5s', () => {
    it('does not persist pending changes until request succeeds', async () => {
      doc = createCmaDocument(entry, undefined, 100).document;
      jest.useFakeTimers();
      let cmaResolve;
      spaceEndpoint.mockImplementation(async (body) => {
        const entry = cloneDeep(body.data);
        return new Promise((resolve) => {
          set(entry, 'sys.version', entry.sys.version + 1);
          cmaResolve = () => resolve(entry);
        });
      });

      doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');

      jest.advanceTimersByTime(100);
      expect(spaceEndpoint).toBeCalledTimes(1);

      doc.setValueAt(['fields', 'fieldB', 'en-US'], 'en-US-updated');

      jest.advanceTimersByTime(100);
      expect(spaceEndpoint).toBeCalledTimes(1);

      cmaResolve();
      jest.useRealTimers();
      await wait();

      await new Promise((resolve) =>
        setTimeout(() => {
          expect(spaceEndpoint).toBeCalledTimes(2);
          resolve();
        }, 200)
      );
    });
  });

  describe('state', () => {
    describe('isSaving$', () => {
      let cmaResolve;

      beforeEach(() => {
        jest.useFakeTimers();
      });
      it('is [true, false] when entity is persisted', async () => {
        spaceEndpoint.mockImplementation(async (body) => {
          const entry = cloneDeep(body.data);
          return new Promise((resolve) => {
            set(entry, 'sys.version', entry.sys.version + 1);
            cmaResolve = () => resolve(entry);
          });
        });

        K.assertCurrentValue(doc.state.isSaving$, false);
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        K.assertCurrentValue(doc.state.isSaving$, true);
        // Run remaining part of persistEntity in current tick.
        jest.useRealTimers();
        cmaResolve();
        await wait();
        K.assertCurrentValue(doc.state.isSaving$, false);
      });
      it('is [true, false] when entity persisting failed', async () => {
        spaceEndpoint.mockImplementation(async (body) => {
          const entry = cloneDeep(body.data);
          return new Promise((_, reject) => {
            set(entry, 'sys.version', entry.sys.version + 1);
            cmaResolve = () => reject({ code: 'ServerError' });
          });
        });

        K.assertCurrentValue(doc.state.isSaving$, false);
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        K.assertCurrentValue(doc.state.isSaving$, true);
        // Run remaining part of persistEntity in current tick.
        jest.useRealTimers();
        cmaResolve();
        await wait();
        K.assertCurrentValue(doc.state.isSaving$, false);
      });
    });
    describe('error$', () => {
      const newError = (code, msg) => {
        const error = new Error(msg);
        error.code = code;
        return error;
      };
      // For some reason "catch" inside the throttled CMA function runs AFTER the "expect" below,
      // so have to skip few event-loop ticks first.
      const waitForTimers = () =>
        new Promise((resolve) => setTimeout(resolve, 0) && jest.runAllTimers());

      beforeEach(() => {
        jest.useFakeTimers();
      });

      it('emits VersionMismatch on VersionMismatch error code', async () => {
        spaceEndpoint.mockImplementationOnce(() => {
          throw newError('VersionMismatch', 'API request failed');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await waitForTimers();
        K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
      });
      it('emits OpenForbidden on AccessDenied error code', async () => {
        spaceEndpoint.mockImplementationOnce(() => {
          throw newError('AccessDenied', 'API request failed');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await waitForTimers();
        K.assertCurrentValue(doc.state.error$, DocError.OpenForbidden());
      });
      it('emits CmaInternalServerError(originalError) on ServerError error code', async () => {
        const error = newError('ServerError', 'API request failed');
        spaceEndpoint.mockImplementationOnce(() => {
          throw error;
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await waitForTimers();
        K.assertCurrentValue(doc.state.error$, DocError.CmaInternalServerError(error));
      });
      it('emits CmaInternalServerError(originalError) on any other error code', async () => {
        const error = newError('SomeRandomError', 'API request failed');
        spaceEndpoint.mockImplementationOnce(() => {
          throw error;
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await waitForTimers();
        K.assertCurrentValue(doc.state.error$, DocError.CmaInternalServerError(error));
      });

      // TODO: when working on status$ ticket: not connected error.
    });
  });

  describe('snapshot normalization', () => {
    beforeEach(() => {
      const notNormalizedEntry = newEntry({
        field1: { 'en-US': true, fr: true },
        field2: { 'en-US': true, de: true },
        unknownField: true,
      });
      doc = createCmaDocument(notNormalizedEntry, [
        { id: 'field1' },
        { id: 'field2', localised: false }, // disabled localization
      ]).document;
    });

    it('removes unknown fields and locales from data$ property', () => {
      expect(K.getValue(doc.data$).fields).toEqual({
        field1: { 'en-US': true },
        field2: { 'en-US': true, de: true },
      });
    });
    it('removes unknown fields and locales from getValueAt', () => {
      expect(doc.getValueAt(['fields'])).toEqual({
        field1: { 'en-US': true },
        field2: { 'en-US': true, de: true },
      });
    });

    // LocaleStore contains all environment-enabled locales, regardless on CT field-level enabled locales.
    // So the CMA request must only contain locales that are in the LocaleStore, and no unknown locales.
    it('persists all environment-enabled locales in CMA request', () => {
      jest.useFakeTimers();

      // Trigger CMA request timer.
      doc.setValueAt(['fields', 'field1', 'de'], 'new-DE');
      jest.runAllTimers();

      const [body] = spaceEndpoint.mock.calls[0];
      const { fields } = body.data;
      expect(fields).toEqual({
        field1: { 'en-US': true, de: 'new-DE' }, // 'fr' is removed
        field2: { 'en-US': true, de: true }, // field with disabled localization still must keep all known locales
      });
      expect(doc.getValueAt(['fields'])).toEqual({
        field1: { 'en-US': true, de: 'new-DE' },
        field2: { 'en-US': true, de: true },
      });
    });

    // In case of unknown fields we do not care as they should not ever existing in the
    // first place and a `PUT` request with a non-existing field (not known to the CT)
    // would simply fail.
    it('does not persist unknown fields in CMA request', () => {
      jest.useFakeTimers();

      // Trigger CMA request timer.
      doc.setValueAt(['fields', 'field1', 'en-US'], 'new value');
      jest.runAllTimers();

      const [body] = spaceEndpoint.mock.calls[0];
      const { fields } = body.data;
      expect(fields).not.toMatchObject({
        unknownField: true,
      });
    });
  });
});
