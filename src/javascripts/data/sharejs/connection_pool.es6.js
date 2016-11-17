import {create as createDoc} from 'entityEditor/Document';
import {find} from 'lodash';

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

const instances = {};

/**
 * @method connection_pool#getDoc
 * @param {API.Entity} entity
 * @param {API.ContentType} contentType
 * @param {API.User} user
 * @returns Document
 * @description
 * Gets a doc for an entity.
 */
export function getDoc (entity, contentType, user) {
  const key = entity.data.sys.id;
  const instance = instances[key];

  if (instance) {
    instance.count += 1;
    return instance.doc;
  } else {
    const doc = createDoc(entity, contentType, user);
    instances[key] = {key, doc, count: 1};
    return doc;
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
export function dispose (doc) {
  const result = find(instances, function (item) {
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
