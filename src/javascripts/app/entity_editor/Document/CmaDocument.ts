import { get, set, cloneDeep, noop, unset, isEqual, some, intersectionBy } from 'lodash';
import * as K from 'core/utils/kefir';
import * as ResourceStateManager from 'data/document/ResourceStateManager';
import * as Permissions from 'access_control/EntityPermissions';
import { valuePropertyAt } from './documentHelpers';
import { Stream, Property } from 'kefir';
import * as Normalizer from 'data/document/Normalize';
import TheLocaleStore from 'services/localeStore';
import * as PathUtils from 'utils/Path';
import { Error as DocError } from 'data/document/Error';
import { Document, Entity, EntitySys, PropertyBus, StreamBus } from './types';
import * as StringField from 'data/document/StringFieldSetter';
import { trackEditConflict } from './analytics';
import { createNoopPresenceHub } from './PresenceHub';
import { EntityRepo, SpaceEndpoint } from 'data/CMA/EntityRepo';
import changedEntityFieldPaths from './changedEntityFieldPaths';

export const THROTTLE_TIME = 5000;
const NETWORK_ERROR = Symbol('NETWORK_ERROR');
const STATUS_UPDATED = Symbol('STATUS_UPDATED');
const DOCUMENT_SAVED = Symbol('DOCUMENT_SAVED');

/**
 * Used to edit an entry or asset through the CMA.
 */
export function create(
  initialEntity: { data: Entity; setDeleted: { (): void } },
  contentType: any,
  spaceEndpoint: SpaceEndpoint,
  entityRepo: EntityRepo,
  saveThrottleMs: number = THROTTLE_TIME
): Document {
  // A single source of Truth, properties like sys$ and data$ reflect the state of this variable.
  const entity: Entity = cloneDeep(initialEntity.data);
  const normalize = () =>
    Normalizer.normalize(
      { getValueAt, setValueAt },
      entity,
      contentType,
      TheLocaleStore.getPrivateLocales()
    );
  normalize();

  const sysBus: PropertyBus<EntitySys> = K.createPropertyBus(entity.sys);
  const sys$ = sysBus.property;
  const changesBus: StreamBus<string[]> = K.createStreamBus();
  const isSavingBus: PropertyBus<boolean> = K.createPropertyBus(false);
  const isSaving$: Property<boolean, any> = isSavingBus.property.skipDuplicates();
  const afterSave$: Stream<symbol, any> = isSaving$
    .changes()
    .filter((isSaving) => !isSaving)
    .map((_) => DOCUMENT_SAVED);

  const errorBus: PropertyBus<Error | null> = K.createPropertyBus(null);
  const error$ = errorBus.property.skipDuplicates((a, b) => a?.constructor === b?.constructor);
  const onNetworkError$: Stream<symbol, any> = errorBus.property
    .changes()
    .filter((error) => error instanceof DocError.Disconnected)
    .map((_) => NETWORK_ERROR);
  const cleanupTasks: Function[] = [];

  let lastSavedEntity: Entity;
  let lastSavedEntityFetchedAt: Date;
  const setLastSavedEntity = (entity) => {
    lastSavedEntity = cloneDeep(entity);
    lastSavedEntityFetchedAt = new Date(Date.now());
  };
  setLastSavedEntity(entity);

  // We assume that the permissions only depend on the immutable data like the ID the content type ID and the creator.
  const permissions = Permissions.create(entity.sys);
  const resourceState = ResourceStateManager.create(
    sys$,
    (newSys) => {
      set(entity, ['sys'], newSys);
      sysBus.set(newSys);
    },
    // "entity" local state is used, because sys$, data$ are only a reflection of the current state.
    () => cloneDeep(getValueAt([])),
    spaceEndpoint,
    saveEntity // preApplyFn - triggered and awaited before applying the state change
  );
  const afterStatusUpdate$: Stream<symbol, any> = resourceState.inProgress$
    .changes()
    .filter((isSaving) => !isSaving)
    .map((_) => STATUS_UPDATED);

  if (entity.sys.type === 'Asset') {
    const unsubscribe = entityRepo.onAssetFileProcessed(entity.sys.id, handleAssetFileProcessed);
    cleanupTasks.push(unsubscribe);
  }

  // Entities from the server might include removed locales or deleted fields which the UI can't handle.
  // So document getters work with locally normalized entity, that is created initially and on every update in this handler.
  // Make sure that this handler is the first for the changes stream.
  changesBus.stream.onValue((path) => {
    if (PathUtils.isPrefix(['fields'], path)) {
      normalize();
    }
  });

  // Persist changes if there were any in last N seconds. Also update if there were
  // any changes during the last update.
  changesBus.stream
    .filter((path) => PathUtils.isPrefix(['fields'], path))
    // The afterSave$ stream is here to make .bufferWhileBy check the value of isSaving$ again
    .merge(afterSave$)
    .bufferWhileBy(isSaving$)
    // We can ignore the buffer when it contains no field changes (only the value emited by afterSave$)
    .filter((values) => !(values.length === 1 && values[0] === DOCUMENT_SAVED))
    // In case of a status update we try to save just to be on the save side,
    // in case there's been edits while updating.
    .merge(afterStatusUpdate$)
    .merge(onNetworkError$)
    .throttle(saveThrottleMs, { leading: false })
    .onValue((_value: Array<string[] | symbol> | symbol): void => {
      // TODO: _value being `null` doesn't make any sense but happens for some reason
      // in some cases, apparently because of throttle(). Investigate why.
      saveEntityAfterAnyStatusUpdate();
    });

  /**
   * Property that is `true` if all of the following are true:
   * - The user has general permissions to change the entity
   * - The entity is not archived and has not been deleted
   *
   * Note that this does not take field based authorization into
   * account. For this see the `FieldLocaleController`.
   */
  const canEdit$: Property<boolean, any> = sys$
    .map((sys) => !sys.archivedVersion && !sys.deletedVersion && permissions.can('update'))
    .skipDuplicates();

  /**
   * Property that is `false` if and only if the document is published
   * and does not contain changes relative to the published version.
   *
   * Note that an entry is in the same state as its published version
   * if and only if its version is on more than the published version.
   */
  const isDirty$: Property<boolean, any> = sys$.map((sys) =>
    sys.publishedVersion ? sys.version > sys.publishedVersion + 1 : true
  );

  const data$ = K.combinePropertiesObject({
    sys: sys$,
    fields: valuePropertyAt({ changes: changesBus.stream, getValueAt }, ['fields']),
  });

  // Sync the data to the entity instance.
  // The entity instance is unique for the ID. Other views will share
  // the same instance and not necessarily load the data. This is why
  // we need to make sure that we keep it updated.
  data$.onValue((data) => {
    initialEntity.data = data;
    if (data.sys.deletedVersion) {
      initialEntity.setDeleted();
      // We need to remove the `data` property. Otherwise `entity.isDeleted()`
      // will return `false`.
      delete initialEntity.data;
    }
  });

  return {
    /**
     * Kefir property, contains document "sys" field.
     * Used in FieldLocaleDocument, createEntryApi both to get and subscribe to a value.
     */
    sysProperty: sys$,

    /**
     * A combined property representing a whole document:
     * - sys
     * - fields
     */
    data$,

    state: {
      // Used by Entry/Asset editor controller
      isSaving$,
      // Used by 'cfFocusOtInput' directive and 'FieldLocaleController'
      isConnected$: K.constant(true),
      // Used by Entry/Asset editor controller
      isDirty$,

      canEdit$,
      // TODO: might set False when no internet connection
      loaded$: K.constant(true),

      /**
       * This error is used by:
       * - DocumentErrorHandler that processes ONLY Error.OpenForbidden and Error.SetValueForbidden
       *
       * So it also might then contain other errors: document disconnected, open error.
       */
      error$,
    },

    /**
     * A stream of document paths (each wrapped in an array) affected by a local or remote change:
     * Internally:
     * - Used to Normalizer.normalize the document
     * - Used by valuePropertyAt to get the latest field value property
     *
     * Externally:
     * - sdk.field.onValueChanged - notifies about changes
     * - In sidebar bridge
     */
    changes: changesBus.stream,

    /**
     * Get version of the latest remote entity.
     * It is only bumped after changes were successfully persisted on the CMA.
     *
     * For the version "optimistic update" wouldn't make much sense,
     * as multiple changes by the user would just be combined into a single version bump.
     * That might accommodate some logic relying on a version bump for the first change the user does,
     * but for any subsequent change until the CMA request happens, there COULD NOT be any further "optimistic version bump".
     */
    getVersion: () => K.getValue(sys$).version,

    /**
     * Returns a constant value of the given path in the document.
     */
    getValueAt,

    setValueAt,
    async pushValueAt(path: string[], value: any) {
      const current = getValueAt(path);
      // Silently fail on non-array field modification.
      if (current && !Array.isArray(current)) {
        return entity;
      }
      set(entity, path, (current || []).concat([value]));
      changesBus.emit(path);
      return entity;
    },
    async insertValueAt(path: string[], i: number, value: any) {
      const current = getValueAt(path);
      // Silently fail on non-array field modification.
      if (current && !Array.isArray(current)) {
        return entity;
      }
      const v = !current ? [value] : [...current.slice(0, i), value, ...current.slice(i)];
      set(entity, path, v);
      changesBus.emit(path);
      return entity;
    },
    async removeValueAt(path: string[]) {
      unset(entity, path);
      changesBus.emit(path);
      return;
    },

    destroy: () => {
      // TODO: It's a bit hacky to persist on destroy. This should be the
      //  responsibility of any controller using `CmaDocument` instead.
      saveEntityAfterAnyStatusUpdate({ updateEmitters: false });
      cleanupTasks.forEach((task) => task());
    },

    resourceState,
    // Presence did rely on ShareJS. We could re-implement it using e.g. pub-sub
    // but it's out of scope for now.
    presence: createNoopPresenceHub(),
    permissions,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    reverter: {
      hasChanges: noop,
      revert: noop,
    },
  };

  /**
   * Returns a constant value of the given path in the document.
   * Also used for valuePropertyAt().
   */
  function getValueAt(path: string[]) {
    // Use normalized entity to get the data.
    return path.length === 0 ? entity : get(entity, path);
  }

  // TODO: Do we wait for the request to be made and THEN resolve or immediately?
  //  This is of importance in `widgetApi.field.setValue()` which needs to throw
  //  In case of insufficient rights to update a field (important for Slug editor).
  async function setValueAt(path: string[], value: any) {
    if (path.length === 3 && StringField.isStringField(path[1], contentType)) {
      if (!StringField.isValidStringFieldValue(value)) {
        throw new Error('Invalid string field value.');
      }
      if (value === '') {
        if (getValueAt(path) === undefined) {
          return entity;
        }
        value = undefined;
      }
    }
    // NOTE: We do not re-implement empty value `RichTextFieldSetter` behavior for now
    //  as we can rely on the RT editor to be responsible for giving us `undefined` as
    //  an empty value.

    set(entity, path, value);

    changesBus.emit(path);

    // `FileEditor` will trigger processing of the file right after `setValueAt` resolves.
    // TODO: We should keep `setValueAt` consistently synchronous, instead of having an exception
    //   for this behavior. This would mean handling this case in the FileEditor by listening
    //   to sys updates while resolving immediately in this case as in all the other cases.
    if (
      entity.sys.type === 'Asset' &&
      PathUtils.isPrefix(['fields', 'file'], path) &&
      value.upload
    ) {
      await saveEntityAfterAnyStatusUpdate();
    }

    return entity;
  }

  async function saveEntityAfterAnyStatusUpdate(...args): Promise<void> {
    if (K.getValue(resourceState.inProgress$)) {
      await afterStatusUpdate$.changes().take(1).toPromise();
      return saveEntityAfterAnyStatusUpdate(...args);
    }
    return saveEntity(...args);
  }

  /**
   * @param options.updateEmitters Is used to save an entity on destroy without updating
   *  the document that is already destroyed once CMA response is received
   */
  async function saveEntity(options = { updateEmitters: true }): Promise<void> {
    // Wait for current ongoing update, then do the next one.
    if (K.getValue(isSaving$)) {
      await afterSave$.changes().take(1).toPromise();
      return saveEntity(options);
    }
    // Do nothing if no unsaved changes - entity could be persisted
    // before the throttled handler triggered, e.g. on status change.
    if (isEqual(entity.fields, lastSavedEntity.fields)) {
      return;
    }
    // Re-try saving after connection errors but no further attempt to save otherwise.
    const lastError = K.getValue(errorBus.property);
    if (lastError && !(lastError instanceof DocError.Disconnected)) {
      return;
    }
    if (!options.updateEmitters) {
      try {
        await entityRepo.update(entity);
      } catch (e) {
        // TODO: Use affordable analytics to track how often this happens.
      }
      return;
    }

    isSavingBus.set(true);
    // Clone as `entity` could get mutated while waiting for CMA request.
    const changedLocalEntity: Entity = cloneDeep(entity);
    try {
      const newEntry = await entityRepo.update(changedLocalEntity);
      setLastSavedEntity(newEntry);
    } catch (e) {
      if (e.code === 'VersionMismatch') {
        trackVersionMismatch(changedLocalEntity);
      }
      const errors = {
        VersionMismatch: DocError.VersionMismatch(),
        AccessDenied: DocError.OpenForbidden(),
        ServerError: DocError.CmaInternalServerError(e),
        '-1': DocError.Disconnected(),
      };
      errorBus.set(errors[e.code] || errors.ServerError);
      isSavingBus.set(false);
      return;
    }

    // For now don't use the field data returned from CMA entity to not overwrite changes made during the request.
    set(entity, 'sys', lastSavedEntity.sys);
    sysBus.set(lastSavedEntity.sys);
    normalize();
    errorBus.set(null);
    isSavingBus.set(false);
  }

  function trackVersionMismatch(entity: Entity, remoteEntity?: Entity): void {
    trackEditConflict({
      entityRepo,
      localEntity: lastSavedEntity,
      localEntityFetchedAt: lastSavedEntityFetchedAt,
      changedLocalEntity: cloneDeep(entity),
      remoteEntity,
    });
  }

  async function handleAssetFileProcessed() {
    // what if two users upload a new asset at the same time?
    // should only compare a specific locale + also when emiting change (only when we need to merge fields?)
    const remoteEntity = await entityRepo.get(entity.sys.type, entity.sys.id);
    const localChangedFieldPaths = changedEntityFieldPaths(lastSavedEntity.fields, entity.fields);
    const remoteChangedFieldPaths = changedEntityFieldPaths(
      lastSavedEntity.fields,
      remoteEntity.fields
    );

    const hasConflictingPendingChanges =
      intersectionBy(localChangedFieldPaths, remoteChangedFieldPaths, (path) => path.join(':'))
        .length > 0;
    if (hasConflictingPendingChanges) {
      trackVersionMismatch(entity, remoteEntity);
      errorBus.set(DocError.VersionMismatch());
      return;
    }

    const hasRemoteVersionConflict = some(remoteChangedFieldPaths, ([path]) => path !== 'file');
    if (hasRemoteVersionConflict) {
      if (localChangedFieldPaths.length > 0) {
        trackVersionMismatch(entity, remoteEntity);
      }
      errorBus.set(DocError.VersionMismatch());
      return;
    }

    const changedRemoteFilePaths = remoteChangedFieldPaths
      .filter(([path]) => path === 'file')
      .map((path) => setValueAt(['fields', ...path], get(remoteEntity, ['fields', ...path])));
    await Promise.all([...changedRemoteFilePaths]);

    setLastSavedEntity(remoteEntity);
    set(entity, 'sys', lastSavedEntity.sys);
    sysBus.set(lastSavedEntity.sys);
    normalize();
  }
}
