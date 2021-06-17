import { createCmaDoc, createEntityRepo } from '@contentful/editorial-primitives';
import { find, get as getAtPath, includes, isString, noop } from 'lodash';
import { FLAGS, getVariation } from 'core/feature-flags';

import { create as createPermissions } from 'access_control/EntityPermissions';
import { createSpaceEndpoint } from 'data/Endpoint';
import * as Config from 'Config';
import * as Auth from 'Authentication';
import TheLocaleStore from 'services/localeStore';
import { makeApply } from 'data/CMA/EntityState';
import * as Analytics from 'analytics/Analytics';
import { captureError } from 'core/monitoring';

/**
 * Creates a store for Document instances. Given an entity it always returns the
 * same instance. Obtained references are counted and when the last is disposed, an
 * instance is destroyed.
 *
 * @param {data/Endpoint} spaceEndpoint
 * @param {string} organizationId
 * @param {string} spaceId
 * @returns {DocumentPool}
 */

export async function create(
  pubSubClient,
  organizationId,
  spaceId,
  environment,
  cmaClient,
  spaceEndpoint
) {
  const instances = {};

  const patchEntryUpdates = await getVariation(FLAGS.PATCH_ENTRY_UPDATES, {
    organizationId,
    spaceId,
    environmentId: environment?.sys.id,
  });
  return { get, destroy, getById };

  /**
   * Gets a doc for an entity.
   *
   * @method DocumentPool#get
   * @param {API.Entity} entity
   * @param {API.ContentType} contentType
   * @param {K.Poperty<void>} lifeline$ Deference the document when this property ends.
   * @returns {Document}
   */
  function get(entity, contentType, lifeline$) {
    const key = prepareKey(getAtPath(entity, 'data.sys', {}));
    const instance = instances[key];
    const contentTypeData = 'data' in contentType ? contentType.data : contentType;
    let doc;

    if (instance) {
      doc = instance.doc;
      instance.count += 1;
    } else {
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

      const applyAction = makeApply(spaceEndpoint);
      const entityRepo = createEntityRepo({
        cmaClient,
        environment,
        pubSubClient,
        triggerCmaAutoSave: noop,
        applyAction,
        options: entityRepoOptions,
      });

      doc = createCmaDoc({
        initialEntity: entity,
        contentType: contentTypeData,
        entityRepo: entityRepo,
        getLocales: () => TheLocaleStore.getPrivateLocales(),
        trackEditConflict: (data) => Analytics.track('entity_editor:edit_conflict', data),
        createPermissions,
        options: {
          patchEntryUpdates,
        },
        onError: (errorName, data) => {
          //we track unhandled entity states
          if (errorName === 'unhandledState') {
            const state = data;
            captureError(new Error(`Unhandled entity state ${state}`), {
              extra: {
                entityState: state,
              },
            });
          }
        },
      });
      const cleanup = () => doc.destroy();

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
