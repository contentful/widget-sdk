import {create as createDoc} from 'entityEditor/Document';
import {find, includes, isString, get as getAtPath} from 'lodash';

/**
 * @ngdoc service
 * @name data/sharejs/connection_pool
 * @description
 * A singleton store for Document instances.
 * Given an entity it always returns the same
 * instance. Obtained references are counted
 * and when the last is disposed, an instance
 * is destroyed.
 */

export function create (docConnection) {
  const instances = {};

  return {getDoc, dispose, destroy};

  /**
   * @method connection_pool#getDoc
   * @param {API.Entity} entity
   * @param {API.ContentType} contentType
   * @param {API.User} user
   * @returns Document
   * @description
   * Gets a doc for an entity.
   */
  function getDoc (entity, contentType, user) {
    const key = prepareKey(getAtPath(entity, 'data.sys', {}));
    const instance = instances[key];

    if (instance) {
      instance.count += 1;
      return instance.doc;
    } else {
      const doc = createDoc(docConnection, entity, contentType, user);
      instances[key] = {key, doc, count: 1};
      return doc;
    }
  }

  function prepareKey (sys) {
    if (includes(['Entry', 'Asset'], sys.type) && isString(sys.id)) {
      return [sys.type, sys.id].join('!');
    } else {
      throw new Error('Invalid entity to get a doc for.');
    }
  }

  /**
   * @method connection_pool#dispose
   * @param {Document} doc
   * @description
   * Marks reference to a doc as not used any
   * longer. Destroys an instance if it was the
   * last reference in use.
   */
  function dispose (doc) {
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
   * @method connection_pool#destroy
   * @description
   * Destroys all the instances in the pool.
   */
  function destroy () {
    Object.keys(instances).forEach((key) => {
      const instance = instances[key];
      instance.doc.destroy();
      delete instances[key];
    });
  }
}
