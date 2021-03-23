import { createOtDoc, createCmaDoc } from 'app/entity_editor/Document';
import { noop, isObject, find, includes, isString, get as getAtPath, times } from 'lodash';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';
import * as logger from 'services/logger';
import { createSpaceEndpoint } from 'data/Endpoint';
import * as Config from 'Config';
import * as Auth from 'Authentication';

/**
 * Creates a store for Document instances. Given an entity it always returns the
 * same instance. Obtained references are counted and when the last is disposed, an
 * instance is destroyed.
 *
 * @param {data/sharejs/Connection} docConnection
 * @param {data/Endpoint} spaceEndpoint
 * @param {string} organizationId
 * @param {string} spaceId
 * @returns {DocumentPool}
 */

export async function create(
  docConnection,
  spaceEndpoint,
  pubSubClient,
  organizationId,
  spaceId,
  environmentId
) {
  const instances = {};
  const isCmaDocumentEnabled = await getVariation(FLAGS.SHAREJS_REMOVAL, {
    organizationId,
    spaceId,
    environmentId,
  });
  const patchEntryUpdates = await getVariation(FLAGS.PATCH_ENTRY_UPDATES, {
    organizationId,
    spaceId,
    environmentId,
  });
  return { get, destroy, getById };

  /**
   * Gets a doc for an entity.
   *
   * @method DocumentPool#get
   * @param {API.Entity} entity
   * @param {API.ContentType} contentType
   * @param {API.User} user
   * @param {K.Poperty<void>} lifeline$ Deference the document when this property ends.
   * @returns {Document}
   */
  function get(entity, contentType, user, lifeline$) {
    const key = prepareKey(getAtPath(entity, 'data.sys', {}));
    const instance = instances[key];
    const contentTypeData = 'data' in contentType ? contentType.data : contentType;
    let doc;

    if (instance) {
      doc = instance.doc;
      instance.count += 1;
    } else {
      let cleanup;

      const entityRepoOptions = {
        skipDraftValidation: true,
        skipTransformation: true,
        indicateAutoSave: true,
        createSpaceEndpoint: (entity) =>
          createSpaceEndpoint(
            Config.apiUrl(),
            entity.sys.space.sys.id,
            Auth,
            entity.sys.environment.sys.id
          ),
      };

      // This flag is an object, but check for `true` to use with `?ui_enable_flags=`
      if (
        isCmaDocumentEnabled === true ||
        (isObject(isCmaDocumentEnabled) && isCmaDocumentEnabled[entity.data.sys.type])
      ) {
        // This is a hack that lets us get away with queue any shouts that might take place
        // in the unlikely event that the update call completes prior to the document
        // connection opening.
        // Note that sharejs messages are pooled so this will not trigger multiple requests.
        let queuedShouts = 0;
        let shout = () => queuedShouts++;
        let destroyConnection = noop;
        docConnection.open(entity).then(
          (info) => {
            shout = () => info.doc.shout(['cma-auto-save']);
            destroyConnection = () => info.destroy();
            times(queuedShouts, shout);
          },
          (error) => {
            logger.captureError(
              new Error(
                "Failed to open ShareJS connection to shout(['cma-auto-save']) required to trigger `auto_save` webhook"
              ),
              {
                originalMessage: error.message,
              }
            );
          }
        );
        const triggerCmaAutoSave = () => shout();
        const entityRepo = createEntityRepo(
          spaceEndpoint,
          pubSubClient,
          triggerCmaAutoSave,
          entityRepoOptions
        );
        doc = createCmaDoc(entity, contentTypeData, entityRepo, { patchEntryUpdates });
        cleanup = () => doc.destroy().finally(destroyConnection);
      } else {
        const entityRepo = createEntityRepo(spaceEndpoint, pubSubClient, noop, entityRepoOptions);
        doc = createOtDoc(docConnection, entity, contentTypeData, user, entityRepo);
        cleanup = () => doc.destroy();
      }

      instances[key] = { key, doc, cleanup, count: 1 };
    }

    lifeline$.onEnd(() => unref(doc));

    return doc;
  }

  function getById(entityId, type, lifeline$) {
    const key = prepareKey({
      type: type,
      id: entityId,
    });
    const instance = instances[key];
    if (instance) {
      instance.count += 1;
      lifeline$.onEnd(() => unref(instance.doc));
      return instance.doc;
    }

    return undefined;
  }

  function prepareKey(sys) {
    if (includes(['Entry', 'Asset'], sys.type) && isString(sys.id)) {
      return [sys.type, sys.id].join('!');
    } else {
      throw new Error('Invalid entity to get a doc for.');
    }
  }

  /**
   * Marks reference to a doc as not used any longer. Destroys an instance if it was the
   * last reference in use.
   */
  function unref(doc) {
    const result = find(instances, (item) => {
      return item.doc === doc;
    });

    if (result) {
      result.count -= 1;
      if (result.count < 1) {
        doc.destroy();
        delete instances[result.key];
      }
    }
  }

  /**
   * Destroys all the instances in the pool.
   */
  function destroy() {
    const cleanups = [];
    for (const key of Object.keys(instances)) {
      const instance = instances[key];
      cleanups.push(instance.cleanup());
      delete instances[key];
    }
    return cleanups;
  }
}
