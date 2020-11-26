import { cloneDeep, set } from 'lodash';
import * as CmaDocument from './CmaDocument';
import { THROTTLE_TIME } from './CmaDocument';
import { Action } from 'data/CMA/EntityActions';
import { State as EntityState } from 'data/CMA/EntityState';
import { linkedTags, newAsset, newContentType, newEntry, PATHS } from './__fixtures__';
import testDocumentBasics, { expectDocError } from './__tests__/testDocument';
import * as K from '../../../../../test/utils/kefir';
import { Error as DocError } from '../../../data/document/Error';
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
  onContentEntityChanged: jest.fn().mockReturnValue(jest.fn()),
  onAssetFileProcessed: jest.fn().mockReturnValue(jest.fn()),
  applyAction: jest.fn(),
});
let entityRepo;

const newError = (code, msg, message) => {
  const error = new Error(msg);
  error.code = code;
  error.data = { message };
  return error;
};

const DisconnectedError = newError(-1, 'API request failed');

function createCmaDocument(initialEntity, contentTypeFields, throttleMs) {
  const contentType =
    initialEntity.sys.type === 'Entry' &&
    newContentType(initialEntity.sys.contentType.sys, contentTypeFields);
  return {
    document: CmaDocument.create(
      { data: initialEntity, setDeleted: jest.fn() },
      contentType,
      entityRepo,
      throttleMs
    ),
  };
}

describe('CmaDocument', () => {
  testDocumentBasics(createCmaDocument);
  const { fieldPath, anotherFieldPath, tagsPath } = PATHS;

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

    it('it doesn\'t switch to "changed" from "draft" state', async () => {
      expect(K.getValue(doc.resourceState.state$)).toBe('__DRAFT__');
    });

    it('it switches to "changed" from "published" state', async () => {
      entry = newEntry();
      entry.sys.publishedVersion = entry.sys.version;
      doc = createCmaDocument(entry).document;
      expect(K.getValue(doc.resourceState.state$)).toBe('__PUBLISHED__');

      await doc.setValueAt(fieldPath, 'en-US-updated');
      expect(K.getValue(doc.resourceState.state$)).toBe('__CHANGED__');
      expect(entityRepo.update).not.toHaveBeenCalled();
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

  describe('5 sec. after setValueAt(tagsPath) on a field', () => {
    beforeEach(async () => {
      await doc.setValueAt(tagsPath, linkedTags);
      jest.runAllTimers();
    });

    it('triggers CMA request', () => {
      expect(entityRepo.update).toBeCalledTimes(1);
    });

    it('bumps sysProperty version after remote update', () => {
      expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 1);
    });
  });

  describe('multiple changes within 5s', () => {
    it('sends only one CMA request', async () => {
      await doc.setValueAt(fieldPath, 'en-US-updated');
      await doc.setValueAt(anotherFieldPath, 'another updated');
      await doc.setValueAt(tagsPath, linkedTags);
      expect(entityRepo.update).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(entityRepo.update).toBeCalledTimes(1);
      const [entity] = entityRepo.update.mock.calls[0];
      expect(entity.fields).toMatchObject({
        fieldA: { 'en-US': 'en-US-updated' },
        fieldB: { 'en-US': 'another updated' },
      });
      expect(entity.metadata).toMatchObject({
        tags: linkedTags,
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

      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.advanceTimersByTime(THROTTLE_TIME);

      K.assertCurrentValue(doc.state.isSaving$, true);
      await doc.setValueAt(anotherFieldPath, 'value set during saving');
      cmaResolve();
      await wait();
      K.assertCurrentValue(doc.state.isSaving$, false);

      // Ensure the value was not overwritten by the response entity.
      expect(doc.getValueAt(anotherFieldPath)).toBe('value set during saving');

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

      await doc.setValueAt(fieldPath, 'A updated');

      jest.advanceTimersByTime(THROTTLE_TIME);

      // Second change, while initial change is being saved:
      await doc.setValueAt(anotherFieldPath, 'B updated');

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
        throw DisconnectedError;
      });

      await doc.setValueAt(fieldPath, 'en-US-updated');
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
      expect(entityRepo.applyAction).not.toHaveBeenCalled();

      await doc.resourceState.apply(Action.Publish());
      expect(entityRepo.update).toBeCalledTimes(1);
      expect(entityRepo.applyAction).toBeCalledTimes(1);

      jest.runAllTimers();
      await wait();
      expect(entityRepo.applyAction).toBeCalledTimes(1);
    });

    it('persists changes made during state update 5s afterwards', async () => {
      let resolveStateUpdate;
      entityRepo.update.mockImplementationOnce((entity) => {
        entry = cloneDeep(entity);
        entry.sys.version++;
        return Promise.resolve(entry);
      });
      entityRepo.applyAction.mockImplementationOnce((action, uiState, data) => {
        expect(action).toEqual(Action.Publish());
        expect(uiState).toEqual(EntityState.Draft());
        expect(data.sys.version).toBe(entry.sys.version);
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
      expect(entityRepo.applyAction).toBeCalledTimes(1);

      await doc.setValueAt(fieldPath, 'updated value');

      jest.advanceTimersByTime(THROTTLE_TIME + 100);
      await wait();
      expect(entityRepo.update).not.toHaveBeenCalled();

      resolveStateUpdate();
      await resourceStateUpdatePromise;
      expect(entityRepo.update).toBeCalledTimes(1);
    });

    it('persists changes on destroy and updates the local state', async () => {
      await doc.setValueAt(fieldPath, 'updated value');
      doc.destroy();
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
      it('emits OpenForbidden on AccessDenied error code', async () => {
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('AccessDenied', 'API request failed');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.OpenForbidden);
      });

      it('emits VersionMismatch on BadRequest error code and archived message', async () => {
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('BadRequest', 'API request failed', 'Cannot edit archived');
        });
        await doc.setValueAt(fieldPath, 'en-US-updated');
        jest.runAllTimers();
        await wait();
        expectDocError(doc.state.error$, DocError.VersionMismatch);
      });

      it('emits Disconnected on -1 error code', async () => {
        entityRepo.update.mockImplementationOnce(() => {
          throw DisconnectedError;
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
          throw DisconnectedError;
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
    it('does not happen when the remote entity was archived', async () => {
      entityRepo.update.mockImplementationOnce(() => {
        throw newError('BadRequest', 'Cannot edit archived');
      });
      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
      await wait();

      expect(track).not.toBeCalled();
    });

    it('does not happen when the remote entity was deleted', async () => {
      entityRepo.update.mockImplementationOnce(() => {
        throw newError('BadRequest', 'Missing content type parameter');
      });
      await doc.setValueAt(fieldPath, 'en-US-updated');
      jest.runAllTimers();
      await wait();

      expect(track).not.toBeCalled();
    });
  });

  describe('asset file processed event', () => {
    let asset;
    let handler;

    beforeEach(() => {
      asset = newAsset();

      entityRepo.onAssetFileProcessed.mockImplementation(({ type, id }, callback) => {
        expect(type).toBe('Asset');
        expect(id).toBe(asset.sys.id);
        handler = callback;
        return () => {};
      });

      ({ document: doc } = createCmaDocument(asset, [{ id: 'title' }, { id: 'file' }]));
    });

    it('should update processed file', async () => {
      mockGetUpdatedEntity(asset, 'fields.file.en-US', { url: 'https://example.com/bar.jpg' });
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        file: { 'en-US': { url: 'https://example.com/bar.jpg' } },
      });
    });

    it('should not overwrite files outside the changed locale-specific file', async () => {
      mockGetUpdatedEntity(asset, 'fields.file.de', { url: 'https://example.com/bar.jpg' });
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        file: {
          'en-US': { url: 'https://example.com/foo.jpg' },
          de: { url: 'https://example.com/bar.jpg' },
        },
      });
    });

    it('should show VersionMismatch when there are local pending changes on the same field locale', async () => {
      mockGetUpdatedEntity(asset, 'fields.file.en-US', { url: 'https://example.com/bar.jpg' });
      await doc.setValueAt(['fields', 'file', 'en-US'], 'bar');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
    });

    it('should update processed file when there are local pending changes on different field locale', async () => {
      mockGetUpdatedEntity(asset, 'fields.file.en-US', { url: 'https://example.com/bar.jpg' });
      await doc.setValueAt(['fields', 'title', 'en-US'], 'local-title');
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'local-title' },
        file: { 'en-US': { url: 'https://example.com/bar.jpg' } },
      });
    });

    it('blocks save process while updating the asset due to pub-sub', async () => {
      // Delay "get" that is called in the beginning of handleIncomingChange
      let cmaResolve;
      entityRepo.get.mockImplementation(() => {
        return new Promise((resolve) => {
          cmaResolve = () => resolve(set(cloneDeep(asset), 'sys.version', asset.sys.version + 1));
        });
      });

      // Trigger handleIncomingChange
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
      mockGetUpdatedEntity(editedAsset, 'fields.file.en-US', {
        url: 'https://example.com/bar.jpg',
      });

      // Trigger handleIncomingChange
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

  describe('incoming entity change event', () => {
    let entry;
    let handler;

    beforeEach(() => {
      entry = newEntry({ title: { 'en-US': 'foo' }, content: { 'en-US': 'bar' } });
      entry.sys.version = 42;

      entityRepo.onContentEntityChanged.mockClear(); // Reset call count from previous beforeEach()
      entityRepo.onContentEntityChanged.mockImplementation(({ type, id }, callback) => {
        expect(type).toBe('Entry');
        expect(id).toBe(entry.sys.id);
        handler = callback;
        return () => {};
      });

      ({ document: doc } = createCmaDocument(entry, [{ id: 'title' }, { id: 'content' }]));
    });

    afterEach(() => {
      // Sanity check as otherwise above mock implementation could be insufficient.
      expect(entityRepo.onContentEntityChanged).toBeCalledTimes(1);
    });

    it('should update doc', async () => {
      mockGetUpdatedEntity(entry, 'fields.content.en-US', 'test');
      const oldVersion = entry.sys.version;
      await handler({ newVersion: oldVersion + 1 });
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        content: { 'en-US': 'test' },
      });
      expect(doc.getVersion()).toBe(oldVersion + 1);
    });

    it('should not update doc or make unnecessary requests if old entity version is reported', async () => {
      const oldVersion = entry.sys.version;
      await handler({ newVersion: oldVersion });
      expect(entityRepo.get).not.toHaveBeenCalled(); // No unnecessary fetching!
      expect(doc.getVersion()).toBe(oldVersion);
    });

    it('should not update doc or make unnecessary requests if document is in VersionMismatch state', async () => {
      // Setup error state
      mockGetUpdatedEntity(entry, 'fields.content.en-US', 'test');
      await doc.setValueAt(['fields', 'content', 'en-US'], '#yolo');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());

      entityRepo.get.mockClear();
      const oldVersion = entry.sys.version;
      mockGetUpdatedEntity(entry, 'fields.content.en-US', 'test');
      await handler();
      expect(entityRepo.get).not.toHaveBeenCalled();
      expect(doc.getVersion()).toBe(oldVersion);
    });

    it('should not overwrite values outside the changed field-locale', async () => {
      mockGetUpdatedEntity(entry, 'fields.content.de', 'gruss gott');
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'foo' },
        content: {
          'en-US': 'bar',
          de: 'gruss gott',
        },
      });
    });

    it('should show VersionMismatch when there are local pending changes on the same field locale', async () => {
      mockGetUpdatedEntity(entry, 'fields.content.en-US', 'test');
      await doc.setValueAt(['fields', 'content', 'en-US'], '#yolo');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
    });

    it('should show VersionMismatch when remote entry has a new field because CT was changed', async () => {
      mockGetUpdatedEntity(entry, 'fields.newField.en-US', 'test');
      await handler();
      K.assertCurrentValue(doc.state.error$, DocError.VersionMismatch());
    });

    it('should update changed field when there are local pending changes on different field locale', async () => {
      mockGetUpdatedEntity(entry, 'fields.content.en-US', 'remotely changed content');
      await doc.setValueAt(['fields', 'title', 'en-US'], 'locally changed title');
      await handler();
      expect(doc.getValueAt(['fields'])).toMatchObject({
        title: { 'en-US': 'locally changed title' },
        content: { 'en-US': 'remotely changed content' },
      });
    });

    it('blocks save process while updating the entry due to pub-sub', async () => {
      // Delay "get" that is called in the beginning of handleIncomingChange
      let cmaResolve;
      entityRepo.get.mockImplementation(() => {
        return new Promise((resolve) => {
          cmaResolve = () => resolve(set(cloneDeep(entry), 'sys.version', entry.sys.version + 1));
        });
      });

      // Trigger handleIncomingChange
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
      // Init version + 1 (incoming entry) + 1 (saveEntity)
      expect(doc.getVersion()).toEqual(entry.sys.version + 2);
    });

    it('blocks local entry update process while updating it due to pub-sub', async () => {
      let cmaResolve;
      const editedEntry = cloneDeep(entry);
      entityRepo.get.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          cmaResolve = () => resolve(set(editedEntry, 'sys.version', entry.sys.version + 1));
        });
      });
      mockGetUpdatedEntity(editedEntry, 'fields.content.en-US', 'test');

      // Trigger handleIncomingChange
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
      // Init version + 1 (updated entry) + 1 (incoming change)
      expect(doc.getVersion()).toEqual(entry.sys.version + 2);
    });
  });

  describe('destroy', () => {
    it('executed only once', () => {
      doc.destroy();
    });
    it('persists changes and updates the local state', async () => {
      await doc.setValueAt(fieldPath, 'updated value');
      doc.destroy();
      await wait();

      doc.destroy();
      expect(entityRepo.update).toBeCalledTimes(1);
    });

    it('stops changes stream and throttled save function', async () => {
      await doc.setValueAt(fieldPath, 'updated value');
      doc.destroy();
      expect(entityRepo.update).toBeCalledTimes(1);

      // Updates made after destroy won't trigger another save as the stream is stopped
      await doc.setValueAt(fieldPath, 'destroyed');
      await wait();
      jest.runAllTimers();
      expect(entityRepo.update).toBeCalledTimes(1);
    });
  });

  it('does not have a truthy .isOtDocument property', () => {
    expect(doc.isOtDocument).toBeFalsy();
  });
});

function mockGetUpdatedEntity(entity, path, value) {
  entityRepo.get.mockImplementation(async () => {
    const updated = cloneDeep(entity);
    updated.sys.version++;
    return set(updated, path, value);
  });
}
