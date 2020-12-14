import { cloneDeep, set } from 'lodash';
import * as CmaDocument from './CmaDocument';
import { THROTTLE_TIME } from './CmaDocument';
import { newContentType, newEntry, newAsset, PATHS } from './__fixtures__';
import { expectDocError } from './__tests__/testDocument';
import * as K from '../../../../../test/utils/kefir';
import { Error as DocError } from '../../../data/document/Error';
import { track } from 'analytics/Analytics';
import * as fake from 'test/helpers/fakeFactory';
import { getVariation } from 'LaunchDarkly';

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

const localMetadata = [fake.Link('Tag', 'officeMontreal'), fake.Link('Tag', 'blackFriday')];
const remoteMetadata = [fake.Link('Tag', 'officeMontreal'), fake.Link('Tag', 'cyberMonday')];

const mockEntityRepo = () => ({
  update: jest.fn().mockImplementation((entity) => {
    const entry = cloneDeep(entity);
    entry.sys.version++;
    return Promise.resolve(entry);
  }),
  patch: jest.fn().mockImplementation((_entity, entity) => {
    const entry = cloneDeep(entity);
    entry.sys.version++;
    return Promise.resolve(entry);
  }),
  get: jest.fn(),
  onContentEntityChanged: jest.fn().mockReturnValue(jest.fn()),
  onAssetFileProcessed: jest.fn().mockReturnValue(jest.fn()),
});
let entityRepo;

const newError = (code, msg, message) => {
  const error = new Error(msg);
  error.code = code;
  error.data = { message };
  return error;
};

function throwVersionMismatchError() {
  throw newError('VersionMismatch', 'API request failed');
}

function createCmaDocument(initialEntity, options) {
  const contentType =
    initialEntity.sys.type === 'Entry' && newContentType(initialEntity.sys.contentType.sys);
  return {
    document: CmaDocument.create(
      { data: initialEntity, setDeleted: jest.fn() },
      contentType,
      entityRepo,
      options
    ),
  };
}

describe('CmaDocument - conflict resolution', () => {
  const { fieldPath, anotherFieldPath, otherLocalePath, tagsPath } = PATHS;

  /**
   * @type {Document}
   */
  let doc;
  let entry;
  let remoteEntity;

  const newRemoteEntity = (entity) => {
    const newEntity = cloneDeep(entity);
    newEntity.sys.version++;
    newEntity.sys.updatedAt = '2020-06-06T13:58:25.641Z';
    newEntity.sys.updatedBy.sys.id = 'otherUserId';
    return newEntity;
  };

  beforeEach(() => {
    getVariation.mockClear().mockResolvedValue(false);
    jest.useFakeTimers();
    entry = newEntry();
    entityRepo = mockEntityRepo();
    doc = createCmaDocument(entry).document;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('autoConflictResolutionVersion info', () => {
    const setupConflictEntity = (entity) => {
      const newEntity = newRemoteEntity(entity);
      set(newEntity, fieldPath, 'en-US-remote-updated');
      return newEntity;
    };

    it('is 3 without CmaDocument `patchEntryUpdates` option', async () => {
      remoteEntity = setupConflictEntity(entry);
      entityRepo.update.mockImplementationOnce(throwVersionMismatchError);
      doc = createCmaDocument(entry, { patchEntryUpdates: false }).document;
      await doc.setValueAt(fieldPath, 'en-US-updated');
      entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

      jest.runAllTimers();
      await wait();

      expectDocError(doc.state.error$, DocError.VersionMismatch);
      expect(track.mock.calls[0][1].autoConflictResolutionVersion).toEqual(3);
    });

    it('is 4 with CmaDocument `patchEntryUpdates` option', async () => {
      remoteEntity = setupConflictEntity(entry);
      entityRepo.patch.mockImplementationOnce(throwVersionMismatchError);
      doc = createCmaDocument(entry, { patchEntryUpdates: true }).document;
      await doc.setValueAt(fieldPath, 'en-US-updated');
      entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

      jest.runAllTimers();
      await wait();

      expectDocError(doc.state.error$, DocError.VersionMismatch);
      expect(track.mock.calls[0][1].autoConflictResolutionVersion).toEqual(4);
    });

    it('is 3 with CmaDocument `patchEntryUpdates` on an asset', async () => {
      const asset = newAsset();
      remoteEntity = setupConflictEntity(asset);
      entityRepo.update.mockImplementationOnce(throwVersionMismatchError);
      doc = createCmaDocument(asset, { patchEntryUpdates: false }).document;
      await doc.setValueAt(fieldPath, 'en-US-updated');
      entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

      jest.runAllTimers();
      await wait();

      expectDocError(doc.state.error$, DocError.VersionMismatch);
      expect(track.mock.calls[0][1].autoConflictResolutionVersion).toEqual(3);
    });
  });

  describe('basic field/metadata conflict resolution', () => {
    describe('when there is a conflict on the same field locale', () => {
      beforeEach(async () => {
        remoteEntity = newRemoteEntity(entry);
        set(remoteEntity, fieldPath, 'en-US-remote-updated');
        entityRepo.update.mockImplementationOnce(throwVersionMismatchError);

        await doc.setValueAt(fieldPath, 'en-US-updated');
      });

      it('tracks the conflict and emits VersionMismatch', async () => {
        entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

        jest.runAllTimers();
        await wait();

        expectDocError(doc.state.error$, DocError.VersionMismatch);

        expectEditConflictTracking([
          {
            entity: entry,
            remoteEntity,
            localChangesPaths: [fieldPath.join(':')],
            remoteChangesPaths: [fieldPath.join(':')],
            isConflictAutoResolvable: false,
            precomputed: {
              sameFieldLocaleConflictsCount: 1,
              localFieldLocaleChangesCount: 1,
              remoteFieldLocaleChangesCount: 1,
              sameMetadataConflictsCount: 0,
              localMetadataChangesCount: 0,
              remoteMetadataChangesCount: 0,
            },
          },
        ]);
      });

      it('handles an error on fetching remote entity', async () => {
        entityRepo.get.mockImplementationOnce(() => {
          throw newError('NotFound', '');
        });

        jest.runAllTimers();
        await wait();

        expectDocError(doc.state.error$, DocError.CmaInternalServerError);
        expect(entityRepo.update).toBeCalledTimes(1);
        expect(track).toBeCalledTimes(0);
      });
    });

    describe('when there is a conflict on the same metadata property', () => {
      let remoteEntity;

      beforeEach(async () => {
        remoteEntity = newRemoteEntity(entry);
        set(remoteEntity, tagsPath, remoteMetadata);
        entityRepo.update.mockImplementationOnce(throwVersionMismatchError);

        await doc.setValueAt(tagsPath, localMetadata);
      });

      it('tracks the conflict and emits VersionMismatch', async () => {
        entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

        jest.runAllTimers();
        await wait();

        expectDocError(doc.state.error$, DocError.VersionMismatch);

        expectEditConflictTracking([
          {
            entity: entry,
            remoteEntity,
            localChangesPaths: [tagsPath.join(':')],
            remoteChangesPaths: [tagsPath.join(':')],
            isConflictAutoResolvable: false,
            precomputed: {
              sameFieldLocaleConflictsCount: 0,
              localFieldLocaleChangesCount: 0,
              remoteFieldLocaleChangesCount: 0,
              sameMetadataConflictsCount: 1,
              localMetadataChangesCount: 1,
              remoteMetadataChangesCount: 1,
            },
          },
        ]);
      });
    });

    describe('when there is a conflict on a different field locale', () => {
      let remoteEntity;

      beforeEach(async () => {
        remoteEntity = newRemoteEntity(entry);
        set(remoteEntity, fieldPath, 'en-US-updated-remotely');
        entityRepo.update.mockImplementationOnce(throwVersionMismatchError);
        entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity));

        await doc.setValueAt(otherLocalePath, 'de-updated-locally');
      });

      it('tracks the conflict, applies remote changes locally and updates remote entity', async () => {
        expect.assertions(8);

        doc.changes.onValue((path) => {
          expect(path).toStrictEqual(fieldPath);
        });

        jest.advanceTimersByTime(THROTTLE_TIME);
        await wait();

        expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 2);
        expect(K.getValue(doc.data$).fields).toMatchObject({
          [fieldPath[1]]: { [fieldPath[2]]: 'en-US-updated-remotely' },
          [otherLocalePath[1]]: { [otherLocalePath[2]]: 'de-updated-locally' },
        });
        expectDocError(doc.state.error$, null);

        expect(entityRepo.update).toBeCalledTimes(2);

        expectEditConflictTracking([
          {
            entity: entry,
            remoteEntity,
            localChangesPaths: [otherLocalePath.join(':')],
            remoteChangesPaths: [fieldPath.join(':')],
            isConflictAutoResolvable: true,
            precomputed: {
              sameFieldLocaleConflictsCount: 0,
              localFieldLocaleChangesCount: 1,
              remoteFieldLocaleChangesCount: 1,
              sameMetadataConflictsCount: 0,
              localMetadataChangesCount: 0,
              remoteMetadataChangesCount: 0,
            },
          },
        ]);
      });

      it('handles another VersionMismatch on updating remote entity', async () => {
        const remoteEntity2 = newRemoteEntity(remoteEntity);
        remoteEntity2.sys.updatedBy.sys.id = 'anotherUserId';
        set(remoteEntity2, anotherFieldPath, 'en-US-B-updated-remotely');
        entityRepo.update.mockImplementationOnce(() => {
          throw newError('VersionMismatch', 'API request failed');
        });
        entityRepo.get.mockImplementationOnce(async () => cloneDeep(remoteEntity2));

        expect.assertions(9);

        doc.changes.bufferWithCount(2).onValue((paths) => {
          expect(paths).toIncludeSameMembers([fieldPath, anotherFieldPath]);
        });

        jest.advanceTimersByTime(THROTTLE_TIME);
        await wait();

        expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 3);
        expect(K.getValue(doc.data$).fields).toMatchObject({
          [fieldPath[1]]: { [fieldPath[2]]: 'en-US-updated-remotely' },
          [anotherFieldPath[1]]: { [anotherFieldPath[2]]: 'en-US-B-updated-remotely' },
          [otherLocalePath[1]]: { [otherLocalePath[2]]: 'de-updated-locally' },
        });

        expect(entityRepo.update).toBeCalledTimes(3);

        expectEditConflictTracking([
          {
            entity: entry,
            remoteEntity,
            localChangesPaths: [otherLocalePath.join(':')],
            remoteChangesPaths: [fieldPath.join(':')],
            isConflictAutoResolvable: true,
            precomputed: {
              sameFieldLocaleConflictsCount: 0,
              localFieldLocaleChangesCount: 1,
              remoteFieldLocaleChangesCount: 1,
              sameMetadataConflictsCount: 0,
              localMetadataChangesCount: 0,
              remoteMetadataChangesCount: 0,
            },
          },
          {
            entity: remoteEntity,
            remoteEntity: remoteEntity2,
            localChangesPaths: [otherLocalePath.join(':')],
            remoteChangesPaths: [anotherFieldPath.join(':')],
            isConflictAutoResolvable: true,
            precomputed: {
              sameFieldLocaleConflictsCount: 0,
              localFieldLocaleChangesCount: 1,
              remoteFieldLocaleChangesCount: 1,
              sameMetadataConflictsCount: 0,
              localMetadataChangesCount: 0,
              remoteMetadataChangesCount: 0,
            },
          },
        ]);
      });
    });

    describe('when there is a conflict on multiple different field locales and metadata properties', () => {
      let remoteEntity;

      beforeEach(async () => {
        remoteEntity = cloneDeep(entry);
        remoteEntity.sys.version++;
        remoteEntity.sys.updatedAt = '2020-06-06T13:58:25.641Z';
        remoteEntity.sys.updatedBy.sys.id = 'otherUserId';
        set(remoteEntity, fieldPath, 'en-US-updated-remotely');
        set(remoteEntity, anotherFieldPath, 'en-US-updated-remotely-2');
        set(remoteEntity, tagsPath, remoteMetadata);

        entityRepo.update.mockImplementationOnce(throwVersionMismatchError);
        entityRepo.get.mockImplementationOnce(async () => remoteEntity);

        await doc.setValueAt(otherLocalePath, 'de-updated-locally');
      });

      it('tracks the conflict, applies remote changes locally and updates remote entity', async (done) => {
        doc.changes.bufferWithCount(2).onValue((paths) => {
          expect(paths).toIncludeSameMembers([fieldPath, anotherFieldPath]);
          done();
        });

        jest.advanceTimersByTime(THROTTLE_TIME);
        await wait();

        expect(K.getValue(doc.sysProperty).version).toEqual(entry.sys.version + 2);
        expect(K.getValue(doc.data$).fields).toMatchObject({
          [fieldPath[1]]: { [fieldPath[2]]: 'en-US-updated-remotely' },
          [anotherFieldPath[1]]: { [anotherFieldPath[2]]: 'en-US-updated-remotely-2' },
          [otherLocalePath[1]]: { [otherLocalePath[2]]: 'de-updated-locally' },
        });
        expect(K.getValue(doc.data$).metadata.tags).toMatchObject(remoteMetadata);

        expect(entityRepo.update).toBeCalledTimes(2);

        expectEditConflictTracking([
          {
            entity: entry,
            remoteEntity,
            localChangesPaths: [otherLocalePath.join(':')],
            remoteChangesPaths: [
              fieldPath.join(':'),
              anotherFieldPath.join(':'),
              tagsPath.join(':'),
            ],
            isConflictAutoResolvable: true,
            precomputed: {
              sameFieldLocaleConflictsCount: 0,
              localFieldLocaleChangesCount: 1,
              remoteFieldLocaleChangesCount: 2,
              sameMetadataConflictsCount: 0,
              localMetadataChangesCount: 0,
              remoteMetadataChangesCount: 1,
            },
          },
        ]);

        expect.assertions(8);
      });
    });
  });
});

function expectEditConflictTracking(conflicts) {
  expect(track).toBeCalledTimes(conflicts.length);

  for (let i = 0; i < conflicts.length; i++) {
    const [id, body] = track.mock.calls[i];
    expect(id).toBe('entity_editor:edit_conflict');

    const { entity, remoteEntity, ...otherData } = conflicts[i];
    expect(body).toEqual({
      entityId: entity.sys.id,
      entityType: entity.sys.type,
      localEntityState: 'draft',
      localStateChange: null,
      remoteEntityState: 'draft',
      localEntityVersion: entity.sys.version,
      remoteEntityVersion: remoteEntity.sys.version,
      localEntityUpdatedAtTstamp: entity.sys.updatedAt,
      remoteEntityUpdatedAtTstamp: remoteEntity.sys.updatedAt,
      remoteEntityUpdatedByUserId: remoteEntity.sys.updatedBy.sys.id,
      localEntityLastFetchedAtTstamp: new Date(now).toISOString(),
      autoConflictResolutionVersion: 3,
      ...otherData,
    });
  }
}
