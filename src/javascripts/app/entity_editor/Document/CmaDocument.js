import _, { cloneDeep } from 'lodash';
import * as K from 'utils/kefir';
import DocumentStatusCode from 'data/document/statusCode';
import * as ResourceStateManager from 'data/document/ResourceStateManager';
import { deepFreeze } from 'utils/Freeze';
import * as Permissions from 'access_control/EntityPermissions';
import { Notification } from '@contentful/forma-36-react-components';
import { valuePropertyAt } from 'app/entity_editor/Document';

/**
 * TODO Instead of passing an entity instance provided by the client library we should only pass the entity data.
 * @returns {EntityDocument}
 * @description
 * Used to edit an entry or asset through the CMA.
 */
export function create(initialEntity, spaceEndpoint) {
  // A single source of Truth, properties like sys$ and data$ reflect the state of this variable.
  const entity = cloneDeep(initialEntity);

  const getValueAt = path => _.get(entity, ['data', ...path]);

  // todo: should it be done the same way as 'fields' and be streamed from 'entity' object?
  const sysBus = K.createPropertyBus(entity.data.sys);
  const sys$ = sysBus.property;
  const changesBus = K.createBus();
  const statusBus = K.createPropertyBus(DocumentStatusCode.OK);
  const isSavingBus = K.createPropertyBus(false);

  // todo: add Normalizer

  // We assume that the permissions only depend on the immutable data
  // like the ID the content type ID and the creator.
  const permissions = Permissions.create(entity.data.sys);
  // todo: a throttled CMA request must be finished prior to the Entry status change (e.g. Publish)
  const resourceState = ResourceStateManager.create(
    sys$,
    newSys => {
      _.set(entity, ['data', 'sys'], newSys);
      sysBus.set(newSys);
    },
    // "entity" local state is used, because sys$, data$ are only a reflection of the current state.
    () => cloneDeep(getValueAt([])),
    spaceEndpoint
  );

  // todo: inject this
  const cmaPutChanges = async () => {
    const collection = 'entries'; //entity.data.sys.type;
    const body = {
      method: 'PUT',
      path: [collection, entity.data.sys.id],
      version: entity.data.sys.version,
      data: entity.data
    };

    // console.log('cmaPutChanges request', body);

    return spaceEndpoint(body, {
      'X-Contentful-Skip-Transformation': 'true'
    });
  };
  // todo: we should filter out "sys" changes, not trigger CMA request
  // todo: on page reload/close force the CMA request to trigger
  changesBus.stream.throttle(5000, { leading: false }).onValue(async () => {
    try {
      isSavingBus.set(true);
      const { sys, fields } = await cmaPutChanges(spaceEndpoint, entity);

      // Update the local entity state and corresponding Kefir props/streams.
      Object.assign(entity.data, { sys, fields });
      sysBus.set(deepFreeze(sys));

      // console.log('cmaPutChanges result', { sys, fields }, '\nEND OF CYCLE\n\n');
      Notification.success('Entity persisted');
    } catch (e) {
      // console.log('cmaPutChanges error', e.code, e);
      if (e.code === 'VersionMismatch') {
        statusBus.set(DocumentStatusCode.EDIT_CONFLICT);
        // Notification.error('Current version is outdated, please reload the entity');
      } else {
        statusBus.set(DocumentStatusCode.INTERNAL_SERVER_ERROR);
      }

      throw e;
    } finally {
      isSavingBus.set(false);
    }
  });

  /**
   * @description
   * Property that is `true` if all of the following are true
   * - The user has general permissions to change the entity
   * - The entity is not archived and has not been deleted
   * - The document is connected to the server.
   *
   * Note that this does not take field based authorization into
   * account. For this see the `FieldLocaleController`.
   *
   * @type {Property<boolean>}
   */
  const canEdit$ = sys$
    .map(sys => !sys.archivedVersion && !sys.deletedVersion && permissions.can('update'))
    .skipDuplicates();
  /**
   * @description
   * Property that is `false` if and only if the document is published
   * and does not contain changes relative to the published version.
   *
   * Note that an entry is in the same state as its published version
   * if and only if its version is on more than the published version.
   *
   * @type {Property<boolean>}
   */
  const isDirty$ = sys$.map(sys =>
    sys.publishedVersion ? sys.version > sys.publishedVersion + 1 : true
  );

  const document = {
    resourceState,

    /**
     * Kefir property, contains document "sys" field.
     * Used in FieldLocaleDocument, createEntryApi both to get and subscribe to a value.
     *
     * @type Kefir.Property<API.EntitySys>
     */
    sysProperty: sys$,

    state: {
      // Used by Entry/Asset editor controller
      isSaving$: isSavingBus.property,
      // Used by 'cfFocusOtInput' directive and 'FieldLocaleController'
      isConnected$: K.constant(true),
      // Used by Entry/Asset editor controller
      isDirty$,

      canEdit$,
      // todo: might set False when no internet connection
      loaded$: K.constant(true),

      /**
       * This error is used by:
       * - DocumentErrorHandler that processes ONLY Error.OpenForbidden and Error.SetValueForbidden
       *
       * So it also might then contain other errors: document disconnected, open error.
       */
      error$: K.never()
    },

    /**
     * Get version of the latest remote entity.
     * For now we bump it after we get it back from CMA.
     *
     * todo: think about "optimistic update"
     */
    getVersion: () => K.getValue(sys$).version,

    /**
     * Returns a constant value of the given path in the document.
     *
     * TODO: should we be doing error handling for undefined / bad path?
     */
    getValueAt,

    // todo: same question as getVersion: do we wait for the request to be made and THEN resolve or immediately?
    setValueAt: (path, value) => {
      _.set(entity, ['data', ...path], value);
      changesBus.emit(path);
      return Promise.resolve(entity);
    },
    removeValueAt: path => {
      _.unset(entity, ['data', ...path]);
      changesBus.emit(path);
      return Promise.resolve();
    },

    // todo: used by DocSetters.pushValueAt, not needed and can be removed
    // insertValueAt: docSetters.insertValueAt,

    // todo: used only in EntityController and probably can be replaced by getValueAt + setValueAt at a consumer level
    pushValueAt: (path, value) => {
      _.set(entity, ['data', ...path], (getValueAt(path) || []).concat([value]));
      changesBus.emit(path);
      return Promise.resolve(entity);
    },

    // todo: doesn't seem to be used outside DocPool which becomes redundant after ShareJS removal
    // destroy,

    /**
     * A stream of document paths (each wrapped in an array) affected by a local change:
     * Internally:
     * - Emits when handling "open", "change" events from docEventsBus todo: there's no docEventsBus yet - do we need it?
     * - Used to Normalizer.normalize the document todo: is it required to normalized CMA version of document? won't hurt at least
     * - Used by valuePropertyAt to get the latest field value property
     *
     * Externally:
     * - sdk.field.onValueChanged - notifies about changes
     * - In sidebar bridge
     *
     * @type Kefir.Stream<string>
     */
    changes: changesBus.stream,

    /**
     * Not implementing Presence for CmaDocument for now.
     */
    presence: {
      collaborators: K.constant([]),
      collaboratorsFor: () => K.constant([]),
      focus: _.noop,
      leave: _.noop,
      destroy: _.noop
    },

    /**
     * @ngdoc property
     * @name Document#reverter
     * @type {Document/Reverter}
     * @description
     * Exposes the methods `reverter.hasChanges()` and
     * `reverter.revert()` to revert to the initial data of the
     * document.
     */
    reverter: {
      hasChanges: _.noop,
      revert: _.noop
    },

    /**
     * @ngdoc method
     * @name Document#permissions.can
     * @description
     * Returns true if the given action can be taken on the document.
     *
     * Supported actions are 'update', 'delete', 'publish',
     * 'unpublish', 'archive', 'unarchive'.
     *
     * @param {string} action
     * @returns {boolean}
     */
    /**
     * @ngdoc method
     * @name Document#permissions.canEditFieldLocale
     * @description
     * Returns true if the field locale can be edited.
     *
     * Accpets public IDs as parameters.
     *
     * This method is used by the 'FieldLocaleController'.
     *
     * @param {string} fieldId
     * @param {string} localeCode
     * @returns {boolean}
     */
    permissions
  };

  /**
   * A combined property representing a whole document:
   * - sys
   * - fields
   *
   * @type Kefir.Property<API.Entity>
   */
  document.data$ = K.combinePropertiesObject({
    sys: sys$,
    fields: valuePropertyAt(document, ['fields'])
  });

  return document;
}
