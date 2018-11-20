/**
 * A FieldLocaleDocument allows one to inspect and change the value of
 * a given field and locale on a document.
 *
 */
import $q from '$q';
import { isEqual } from 'lodash';

/**
 * @ngdoc method
 * @name app/entity_editor/FieldLocaleDocument#create
 * @param {app/EntityEditor/Document} doc
 * @param {string} fieldId  Internal field ID
 * @param {string} localeCode  Internal locale code
 */
export default function create(doc, fieldId, localeCode) {
  const path = ['fields', fieldId, localeCode];

  const getValue = bindToPath('getValueAt');

  // The most recent value passed to `set()`.
  // We use this to filter change events that originate from a call to
  // `set()`.
  let lastSetValue = getValue();

  /**
   * @ngdoc property
   * @name FieldLocaleDocument#valueProperty
   * @description
   * A property that contains the most recent value at the given
   * document path.
   *
   * Change events are not triggered when `set()` is called.
   *
   * @type {Property<any>}
   */
  const valueProperty = doc
    .valuePropertyAt(path)
    .filter(value => !isEqual(value, lastSetValue))
    .toProperty(getValue);

  /**
   * @ngdoc property
   * @name FieldLocaleDocument#value$
   * @description
   * A property that contains the most recent value at the given
   * document path.
   *
   * Unlike `valueProperty` this property emits the new value when
   * calling the `set()` method.
   *
   * @type {Property<any>}
   */
  const value$ = doc.valuePropertyAt(path);

  /**
   * @ngdoc property
   * @name FieldLocaleDocument#localChanges$
   * @description
   * Emits an event whenever a change to this field value is triggered
   * by the user.
   *
   * @type {Property<void>}
   */
  const localChanges$ = doc.localFieldChanges$
    .filter(([otherFieldId, otherLocaleCode]) => {
      return otherFieldId === fieldId && otherLocaleCode === localeCode;
    })
    .map(() => undefined);

  return {
    sys: doc.sysProperty,
    set,
    get: getValue,
    remove: bindToPath('removeValueAt'),
    removeAt,
    push: bindToPath('pushValueAt'),
    insert: bindToPath('insertValueAt'),
    value$,
    valueProperty,
    collaborators: doc.collaboratorsFor(fieldId, localeCode),
    notifyFocus,
    localChanges$
  };

  function notifyFocus() {
    return doc.notifyFocus(fieldId, localeCode);
  }

  function set(value) {
    lastSetValue = value;
    return doc.setValueAt(path, value).catch(error => {
      lastSetValue = getValue();
      return $q.reject(error);
    });
  }

  function removeAt(i) {
    return doc.removeValueAt(path.concat([i]));
  }

  function bindToPath(method) {
    return doc[method].bind(null, path);
  }
}
