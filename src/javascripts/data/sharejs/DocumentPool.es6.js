import {create as createDoc} from 'app/entity_editor/Document';
import {find, includes, isString, get as getAtPath} from 'lodash';

/**
 * @ngdoc service
 * @name data/sharejs/DocumentPool
 * @description
 * A singleton store for Document instances.
 * Given an entity it always returns the same
 * instance. Obtained references are counted
 * and when the last is disposed, an instance
 * is destroyed.
 */

export function create (docConnection, spaceEndpoint) {
  const instances = {};

  return {get, destroy};

  /**
   * @method DocumentPool#get
   * @param {API.Entity} entity
   * @param {API.ContentType} contentType
   * @param {API.User} user
   * @param {K.Poperty<void>} lifeline$
   *   Unreference the document when this property ends
   * @returns Document
   * @description
   * Gets a doc for an entity.
   */
  function get (entity, contentType, user, lifeline$) {
    const key = prepareKey(getAtPath(entity, 'data.sys', {}));
    const instance = instances[key];
    let doc;

    if (instance) {
      doc = instance.doc;
      instance.count += 1;
    } else {
      doc = createDoc(docConnection, entity, contentType, user, spaceEndpoint);
      instances[key] = {key, doc, count: 1};
    }

    lifeline$.onEnd(() => unref(doc));

    return doc;
  }


  function prepareKey (sys) {
    if (includes(['Entry', 'Asset'], sys.type) && isString(sys.id)) {
      return [sys.type, sys.id].join('!');
    } else {
      throw new Error('Invalid entity to get a doc for.');
    }
  }

  /**
   * Marks reference to a doc as not used any
   * longer. Destroys an instance if it was the
   * last reference in use.
   */
  function unref (doc) {
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
   * @method DocumentPool#destroy
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
