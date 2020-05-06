import { cloneDeep, set } from 'lodash';
import * as CmaDocument from './CmaDocument';
import { Action } from 'data/document/ResourceStateManager';
import testDocumentBasic, { newEntry, newAsset, newContentType } from './Document.spec';
import * as K from '../../../../../test/utils/kefir';
import { Error as DocError } from '../../../data/document/Error';
import { THROTTLE_TIME } from './CmaDocument';
import { track } from 'analytics/Analytics';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
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

const now = Date.now();
global.Date.now = jest.fn(() => now);

const realSetTimeout = global.setTimeout; // unaffected by jest.useFakeTimers()
const wait = () => new Promise((resolve) => realSetTimeout(resolve, 0));

const mockSpaceEndpoint = () => jest.fn();
let spaceEndpoint;

const mockEntityRepo = () => ({
  update: jest.fn().mockImplementation((entity) => {
    const entry = cloneDeep(entity);
    entry.sys.version++;
    return Promise.resolve(entry);
  }),
  get: jest.fn(),
  onAssetFileProcessed: jest.fn(),
});
let entityRepo;

const newError = (code, msg) => {
  const error = new Error(msg);
  error.code = code;
  return error;
};

function createCmaDocument(initialEntity, contentTypeFields, throttleMs) {
  const contentType =
    initialEntity.sys.type === 'Entry' &&
    newContentType(initialEntity.sys.contentType.sys, contentTypeFields);
  return {
    document: CmaDocument.create(
      { data: initialEntity, setDeleted: jest.fn() },
      contentType,
      spaceEndpoint,
      entityRepo,
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
    jest.useFakeTimers();
    entry = newEntry();
    entityRepo = mockEntityRepo();
    spaceEndpoint = mockSpaceEndpoint();
    doc = createCmaDocument(entry).document;
  });

  describe('initially', () => {
    it('triggers no CMA request for the next 5 sec.', () => {
      jest.runAllTimers();
      expect(entityRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('immediately after setValueAt(fieldPath) on a field', () => {
    beforeEach(async () => {
      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.advanceTimersByTime(CmaDocument.THROTTLE_TIME - 1);
    });

    it('triggers no CMA request for the next 5 sec.', () => {
      expect(entityRepo.update).not.toHaveBeenCalled();
    });

    it('keeps the old sysProperty version after local update', () => {
      expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version);
    });
  });

  describe('5 sec. after setValueAt(fieldPath) on a field', () => {
    beforeEach(async () => {
      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
    });

    it('triggers CMA request', () => {
      expect(entityRepo.update).toBeCalledTimes(1);
    });

    it('bumps sysProperty version after remote update', () => {
      expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 1);
    });
  });

  describe('multiple setValueAt() calls within 5s', () => {
    it('sends one CMA request', async () => {
      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');
      await doc.setValueAt(['fields', 'fieldB', 'en-US'], 'another updated');
      expect(entityRepo.update).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(entityRepo.update).toBeCalledTimes(1);
      const [entity] = entityRepo.update.mock.calls[0];
      expect(entity.fields).toMatchObject({
        fieldA: { 'en-US': 'en-US-updated' },
        fieldB: { 'en-US': 'another updated' },
      });
    });

    it('collects changes made during saving and sends them only 5s after last CMA request', async () => {
      let cmaResolve;
      entityRepo.update.mockImplementation((entity) => {
        const entry = cloneDeep(entity);
        return new Promise((resolve) => {
          entry.sys.version++;
          cmaResolve = () => resolve(entry);
        });
      });

      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');
      jest.advanceTimersByTime(THROTTLE_TIME);

      K.assertCurrentValue(doc.state.isSaving$, true);
      await doc.setValueAt(['fields', 'fieldB', 'en-US'], 'value set during saving');
      cmaResolve();
      await wait();
      K.assertCurrentValue(doc.state.isSaving$, false);

      // Ensure the value was not overwritten by the response entity.
      expect(doc.getValueAt(['fields', 'fieldB', 'en-US'])).toBe('value set during saving');

      jest.advanceTimersByTime(THROTTLE_TIME - 100);
      expect(entityRepo.update).toBeCalledTimes(1);
      jest.advanceTimersByTime(100);
      expect(entityRepo.update).toBeCalledTimes(2);
      const [entity] = entityRepo.update.mock.calls[1]; // take second call
      expect(entity.fields).toMatchObject({
        fieldA: { 'en-US': 'en-US-updated' },
        fieldB: { 'en-US': 'value set during saving' },
      });
    });
  });

  describe('CMA call taking longer than 5s', () => {
    it('saves new pending changes only after first request succeeds', async () => {
      doc = createCmaDocument(entry, undefined).document;
      let cmaResolve;
      entityRepo.update.mockImplementation((entity) => {
        const entry = cloneDeep(entity);
        return new Promise((resolve) => {
          entry.sys.version++;
          cmaResolve = () => resolve(entry);
        });
      });

      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'A updated');

      jest.advanceTimersByTime(THROTTLE_TIME);

      // Second change, while initial change is being saved:
      await doc.setValueAt(['fields', 'fieldB', 'en-US'], 'B updated');

      jest.advanceTimersByTime(THROTTLE_TIME * 2);
      cmaResolve();
      await wait();
      expect(entityRepo.update).toBeCalledTimes(1); // Only first change got persisted.

      jest.advanceTimersByTime(THROTTLE_TIME - 100);
      expect(entityRepo.update).toBeCalledTimes(1);
      jest.advanceTimersByTime(100);
      expect(entityRepo.update).toBeCalledTimes(2); // Second change just got persisted.
      const [entity] = entityRepo.update.mock.calls[1];
      expect(entity.fields).toMatchObject({
        fieldA: { 'en-US': 'A updated' },
        fieldB: { 'en-US': 'B updated' },
      });
    });
  });

  describe('when CMA call fails due to a network error', () => {
    it('retries to save every 5s until successful', async () => {
      entityRepo.update.mockImplementation(() => {
        throw newError('-1', 'API request failed');
      });

      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'en-US-updated');
      jest.advanceTimersByTime(THROTTLE_TIME);
      expect(entityRepo.update).toBeCalledTimes(1);
      expectDocError(doc.state.error$, DocError.Disconnected);

      jest.advanceTimersByTime(THROTTLE_TIME);
      expect(entityRepo.update).toBeCalledTimes(2);

      jest.advanceTimersByTime(THROTTLE_TIME);
      expect(entityRepo.update).toBeCalledTimes(3);

      entityRepo.update.mockImplementation(async (entity) => {
        entry = cloneDeep(entity);
        entry.sys.version++;
        return entry;
      });

      jest.advanceTimersByTime(THROTTLE_TIME);
      await wait();
      expect(entityRepo.update).toBeCalledTimes(4);

      expect(entityRepo.update).toBeCalledTimes(4);
      expectDocError(doc.state.error$, null);
    });
  });

  describe('state update', () => {
    it('persists pending changes first and immediately', async () => {
      entityRepo.update.mockImplementationOnce((entity) => {
        entry = cloneDeep(entity);
        entry.sys.version++;
        return Promise.resolve(entry);
      });
      spaceEndpoint.mockImplementationOnce((body) => {
        expect(body).toEqual({
          method: 'PUT',
          path: ['entries', 'published'],
          version: entry.sys.version,
        });

        entry = cloneDeep(entry);
        entry.sys.publishedVersion = entry.sys.version;
        entry.sys.version++;
        return entry;
      });

      await doc.setValueAt(fieldPath, 'updated value');
      expect(spaceEndpoint).not.toHaveBeenCalled();

      await doc.resourceState.apply(Action.Publish());
      expect(entityRepo.update).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledTimes(1);

      jest.runAllTimers();
      await wait();
      expect(spaceEndpoint).toBeCalledTimes(1);
    });

    it('persists changes made during state update 5s afterwards', async () => {
      let resolveStateUpdate;
      entityRepo.update.mockImplementationOnce((entity) => {
        entry = cloneDeep(entity);
        entry.sys.version++;
        return Promise.resolve(entry);
      });
      spaceEndpoint.mockImplementationOnce((body) => {
        expect(body).toEqual({
          method: 'PUT',
          path: ['entries', 'published'],
          version: entry.sys.version,
        });
        entry = cloneDeep(entry);
        return new Promise((resolve) => {
          entry.sys.publishedVersion = entry.sys.version;
          entry.sys.version++;
          resolveStateUpdate = () => {
            resolve(entry);
          };
        });
      });

      const resourceStateUpdatePromise = doc.resourceState.apply(Action.Publish());
      await wait();
      expect(spaceEndpoint).toBeCalledTimes(1);

      await doc.setValueAt(fieldPath, 'updated value');

      jest.advanceTimersByTime(THROTTLE_TIME + 100);
      await wait();
      expect(entityRepo.update).not.toHaveBeenCalled();

      resolveStateUpdate();
      await resourceStateUpdatePromise;
      expect(entityRepo.update).toBeCalledTimes(1);
    });
  });

  describe('state', () => {
    describe('isSaving$', () => {
      let cmaResolve;

      it('is [true, false] when entity is persisted', async () => {
        entityRepo.update.mockImplementation((entity) => {
          const entry = cloneDeep(entity);
          return new Promise((resolve) => {
            entry.sys.version++;
            cmaResolve = () => resolve(entry);
          });
        });

        K.assertCurrentValue(doc.state.isSaving$, false);
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        K.assertCurrentValue(doc.state.isSaving$, true);
        cmaResolve();
        await wait();
        K.assertCurrentValue(doc.state.isSaving$, false);
      });

      it('is [true, false] when entity persisting failed', async () => {
        entityRepo.update.mockImplementation((entity) => {
          const entry = cloneDeep(entity);
          return new Promise((_, reject) => {
            entry.sys.version++;
            cmaResolve = () => reject({ code: 'ServerError' });
          });
        });

        K.assertCurrentValue(doc.state.isSaving$, false);
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        K.assertCurrentValue(doc.state.isSaving$, true);
        cmaResolve();
        await wait();
        K.assertCurrentValue(doc.state.isSaving$, false);
      });
    });

    describe('error$', () => {
      it('emits VersionMismatch on VersionMismatch error code', async () => {
        const remoteEntity = cloneDeep(entry);
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('VersionMismatch', 'API request failed');
        });
        entityRepo.get.mockImplementationOnce(() => Promise.resolve(remoteEntity));
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.VersionMismatch);
      });

      it('emits OpenForbidden on AccessDenied error code', async () => {
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('AccessDenied', 'API request failed');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.OpenForbidden);
      });

      it('emits Disconnected on -1 error code', async () => {
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('-1', 'API request failed');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        // We don't call `await wait()` for this error because it will clear out after a retry
        expectDocError(doc.state.error$, DocError.Disconnected);
      });

      it('emits CmaInternalServerError(originalError) on ServerError error code', async () => {
        const error = newError('ServerError', 'API request failed');
        entityRepo.update.mockImplementationOnce(() => {
          throw error;
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.CmaInternalServerError(error));
      });

      it('emits CmaInternalServerError(originalError) on any other error code', async () => {
        const error = newError('SomeRandomError', 'API request failed');
        entityRepo.update.mockImplementationOnce(() => {
          throw error;
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.CmaInternalServerError(error));
      });
    });

    describe('isConnected$', () => {
      it('is `true` initially', () => {
        K.assertCurrentValue(doc.state.isConnected$, true);
      });

      it('is `false` while CMA can not be reached', async () => {
        entityRepo.update.mockImplementation(() => {
          throw newError('-1', 'API request failed');
        });

        await doc.setValueAt(fieldPath, 'new value');
        jest.advanceTimersByTime(THROTTLE_TIME);
        K.assertCurrentValue(doc.state.isConnected$, false);

        entityRepo.update.mockImplementation((entity) => {
          entry = cloneDeep(entity);
          entry.sys.version++;
          return Promise.resolve(entry);
        });

        jest.advanceTimersByTime(THROTTLE_TIME);
        await wait();
        K.assertCurrentValue(doc.state.isConnected$, true);
      });
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
    it('persists all environment-enabled locales in CMA request', async () => {
      await doc.setValueAt(['fields', 'field1', 'de'], 'new-DE');
      jest.runAllTimers();

      const [entity] = entityRepo.update.mock.calls[0];
      const { fields } = entity;
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
    it('does not persist unknown fields in CMA request', async () => {
      await doc.setValueAt(['fields', 'field1', 'en-US'], 'new value');
      jest.runAllTimers();

      const [entity] = entityRepo.update.mock.calls[0];
      const { fields } = entity;
      expect(fields).not.toMatchObject({
        unknownField: true,
      });
    });
  });

  describe('edit conflict tracking', () => {
    it('happens on VersionMismatch error', async () => {
      const remoteEntity = cloneDeep(entry);
      set(remoteEntity, fieldPath, 'en-US-remote-updated');
      remoteEntity.sys.version++;
      entityRepo.update.mockImplementationOnce(() => {
        throw newError('VersionMismatch', 'API request failed');
      });
      entityRepo.get.mockImplementationOnce(() => Promise.resolve(remoteEntity));

      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
      await wait();

      expect(track).toBeCalledTimes(1);
      const [id, body] = track.mock.calls[0];
      expect(id).toBe('entity_editor:edit_conflict');
      expect(body).toEqual({
        entityId: entry.sys.id,
        entityType: entry.sys.type,
        localChangesFieldPaths: [fieldPath.slice(1).join(':')],
        remoteChangesSinceLocalEntityFieldPaths: [fieldPath.slice(1).join(':')],
        localEntityVersion: entry.sys.version,
        remoteEntityVersion: remoteEntity.sys.version,
        localEntityUpdatedAtTstamp: entry.sys.updatedAt,
        remoteEntityUpdatedAtTstamp: entry.sys.updatedAt,
        remoteEntityUpdatedByUserId: entry.sys.updatedBy.sys.id,
        localEntityLastFetchedAtTstamp: new Date(now).toISOString(),
        isConflictAutoResolvable: false,
        autoConflictResolutionVersion: 1,
      });
    });

    it('does not happen when the remote entity was deleted', async () => {
      entityRepo.update.mockImplementationOnce(() => {
        throw newError('BadRequest', '');
      });
      entityRepo.get.mockImplementationOnce(() => {
        throw newError('NotFound', 'The resource could not be found.');
      });
      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
      await wait();

      expect(track).not.toBeCalled();
    });
  });

  describe('asset update', () => {
    let asset;
    let handler;

    beforeEach(() => {
      asset = newAsset();

      entityRepo.onAssetFileProcessed.mockImplementation((assetId, callback) => {
        expect(assetId).toBe(asset.sys.id);
        handler = callback;
      });

      ({ document: doc } = createCmaDocument(asset, [{ id: 'title' }, { id: 'file' }]));
    });

    it('should update file from a successfully processed asset', async () => {
      mockGetProcessedAsset(asset, 'fields.file.en-US', { url: 'https://example.com/bar.jpg' });
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        file: { 'en-US': { url: 'https://example.com/bar.jpg' } },
      });
    });

    it('should not overwrite files outside the changed locale-specific file', async () => {
      mockGetProcessedAsset(asset, 'fields.file.de', { url: 'https://example.com/bar.jpg' });
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        file: {
          'en-US': { url: 'https://example.com/foo.jpg' },
          de: { url: 'https://example.com/bar.jpg' },
        },
      });
    });

    it('should show VersionMismatch when has local pending changes', async () => {
      mockGetProcessedAsset(asset, 'fields.file.en-US', { url: 'https://example.com/bar.jpg' });
      await doc.setValueAt(['fields', 'file', 'en-US'], 'bar');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
    });

    it('should show VersionMismatch when last saved entity is different than remote updated', async () => {
      mockGetProcessedAsset(asset, 'fields.title.en-US', 'bar');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
      expect(K.getValue(doc.sysProperty).version).toEqual(asset.sys.version);
    });

    it('blocks save process while updating the asset due to pub-sub', async () => {
      // Delay "get" that is called in the beginning of handleAssetFileProcessed
      let cmaResolve;
      entityRepo.get.mockImplementation(() => {
        return new Promise((resolve) => {
          cmaResolve = () => resolve(set(cloneDeep(asset), 'sys.version', asset.sys.version + 1));
        });
      });

      // Trigger handleAssetFileProcessed
      handler();
      expect(entityRepo.get).toBeCalled();

      // Trigger saveEntity: must be buffered, not called
      await doc.setValueAt(['fields', 'title', 'en-US'], 'A updated');
      jest.advanceTimersByTime(THROTTLE_TIME);
      expect(entityRepo.update).not.toBeCalled();

      // Now finish the handler process
      cmaResolve();
      // Trigger throttled buffer
      await wait();
      jest.advanceTimersByTime(THROTTLE_TIME);
      await wait();

      // Now saveEntity should be triggered
      expect(entityRepo.update).toBeCalledTimes(1);
      K.assertCurrentValue(doc.state.error$, null);
      // Init version + 1 (processed asset) + 1 (saveEntity)
      expect(doc.getVersion()).toEqual(asset.sys.version + 2);
    });

    it('blocks asset update process while updating the asset due to pub-sub', async () => {
      let cmaResolve;
      const editedAsset = cloneDeep(asset);
      entityRepo.get.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          cmaResolve = () => resolve(set(editedAsset, 'sys.version', asset.sys.version + 1));
        });
      });
      mockGetProcessedAsset(editedAsset, 'fields.file.en-US', {
        url: 'https://example.com/bar.jpg',
      });

      // Trigger handleAssetFileProcessed
      handler();
      expect(entityRepo.get).toBeCalledTimes(1);

      // Second event
      handler();
      expect(entityRepo.get).toBeCalledTimes(1);

      // Now finish the first event handler
      cmaResolve();
      await wait();
      // Now second event handler should be triggered
      expect(entityRepo.get).toBeCalledTimes(2);

      K.assertCurrentValue(doc.state.error$, null);
      // Init version + 1 (processed asset) + 1 (processed asset)
      expect(doc.getVersion()).toEqual(asset.sys.version + 2);
    });
  });

  it('does not have a truthy .isOtDocument property', () => {
    expect(doc.isOtDocument).toBeFalsy();
  });
});

function mockGetProcessedAsset(asset, path, value) {
  entityRepo.get.mockImplementation(async () => {
    const processedAsset = cloneDeep(asset);
    processedAsset.sys.version++;
    return set(processedAsset, path, value);
  });
}

function expectDocError(docError$, docErrorOrConstructor) {
  const docError = K.getValue(docError$);
  if (docErrorOrConstructor === null) {
    expect(docError).toBeNull();
  } else if (typeof docErrorOrConstructor === 'function') {
    expect(docError).toBeInstanceOf(docErrorOrConstructor);
  } else {
    expect(docError).toBeInstanceOf(docErrorOrConstructor.constructor);
    expect(docError).toStrictEqual(docErrorOrConstructor);
  }
}
