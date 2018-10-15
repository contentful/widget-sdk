import $q from '$q';
import * as K from 'utils/kefir.es6';

import * as StringField from 'entityEditor/Document/StringField';
import * as ShareJS from 'data/ShareJS/Utils';

import * as RichTextFieldSetter from 'app/widgets/rich_text/RichTextFieldSetter.es6';

/**
 * Create an object that exposes all methods for changing values in a
 * ShareJS document.
 *
 * This object is created and re-exposed by
 * `app/entity_editor/Document`. It is also tested in the entity editor
 * document tests.
 */
export function create({
  // Synchronously return an OtDoc instance or undefined
  getDoc,
  // Get the current document value at the given path
  getValueAt,
  // Content type for the document. This is used to determine if a
  // field is of string type and if we want to send a string diff as an
  // update.
  contentType
}) {
  const localFieldChangesBus = K.createBus();
  const errorBus = K.createBus();

  return {
    setValueAt,
    removeValueAt,
    insertValueAt,
    pushValueAt,

    /**
     * Emits an `{error, path}` pair whenever a mutation triggers an
     * error.
     *
     * The stream ends when destroy is called.
     */
    error$: errorBus.stream,

    /**
     * Emits an `[fieldName, locale]` pair whenever we make a local mutation to a field locale.
     *
     * The stream ends when destroy is called.
     */
    localFieldChange$: localFieldChangesBus.stream,

    destroy
  };

  function destroy() {
    localFieldChangesBus.end();
    errorBus.end();
  }

  function setValueAt(path, value) {
    return withRawDoc(path, doc => {
      maybeEmitLocalChange(path);
      return setValueAtRaw(doc, path, value);
    });
  }

  function setValueAtRaw(doc, path, value) {
    if (path.length === 3 && StringField.is(path[1], contentType)) {
      return StringField.setAt(doc, path, value);
    } else if (RichTextFieldSetter.is(path[1], contentType)) {
      return RichTextFieldSetter.setAt(doc, path, value);
    } else {
      return ShareJS.setDeep(doc, path, value);
    }
  }

  function removeValueAt(path) {
    return withRawDoc(path, doc => {
      maybeEmitLocalChange(path);
      return ShareJS.remove(doc, path);
    });
  }

  function insertValueAt(path, i, x) {
    return withRawDoc(path, doc => {
      if (ShareJS.peek(doc, path)) {
        maybeEmitLocalChange(path);
        return $q.denodeify(cb => {
          doc.insertAt(path, i, x, cb);
        });
      } else if (i === 0) {
        maybeEmitLocalChange(path);
        return setValueAtRaw(doc, path, [x]);
      } else {
        return $q.reject(new Error(`Cannot insert index ${i} into empty container`));
      }
    });
  }

  function pushValueAt(path, value) {
    const current = getValueAt(path);
    const pos = current ? current.length : 0;
    return insertValueAt(path, pos, value);
  }

  function maybeEmitLocalChange(path) {
    if (path.length >= 3 && path[0] === 'fields') {
      localFieldChangesBus.emit([path[1], path[2]]);
    }
  }

  function withRawDoc(path, run) {
    let result;
    const doc = getDoc();
    if (doc) {
      result = run(doc);
    } else {
      result = $q.reject(new Error('ShareJS document is not connected'));
    }
    return result.catch(error => {
      errorBus.emit({ path, error });
      return $q.reject(error);
    });
  }
}
