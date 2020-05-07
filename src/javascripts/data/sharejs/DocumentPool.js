import { createOtDoc, createCmaDoc } from 'app/entity_editor/Document';
import { isObject, find, includes, isString, get as getAtPath } from 'lodash';
import { SHAREJS_REMOVAL } from 'featureFlags';
import { getVariation } from 'LaunchDarkly';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';

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

export async function create(docConnection, spaceEndpoint, pubSubClient, organizationId, spaceId) {
  const instances = {};
  const isCmaDocumentEnabled = await getVariation(SHAREJS_REMOVAL, { organizationId, spaceId });

  return { get, destroy };

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
    let doc;

    if (instance) {
      doc = instance.doc;
      instance.count += 1;
    } else {
      // This flag is an object, but check for `true` to use with `?ui_enable_flags=`
      if (
        isCmaDocumentEnabled === true ||
        (isObject(isCmaDocumentEnabled) && isCmaDocumentEnabled[entity.data.sys.type])
      ) {
        const entityRepo = createEntityRepo(spaceEndpoint, pubSubClient, {
          skipDraftValidation: true,
          skipTransformation: true,
          indicateAutoSave: true,
        });
        doc = createCmaDoc(entity, contentType, spaceEndpoint, entityRepo);
      } else {
        doc = createOtDoc(docConnection, entity, contentType, user, spaceEndpoint);
      }

      instances[key] = { key, doc, count: 1 };
    }

    lifeline$.onEnd(() => unref(doc));

    return doc;
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
    Object.keys(instances).forEach((key) => {
      const instance = instances[key];
      instance.doc.destroy();
      delete instances[key];
    });
  }
}
