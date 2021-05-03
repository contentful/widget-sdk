/**
 * A FieldLocaleDocument allows one to inspect and change the value of
 * a given field and locale on a document.
 *
 */
import { isEqual } from 'lodash';
import { localFieldChanges, valuePropertyAt, createStatus } from '@contentful/editorial-primitives';

import * as K from 'core/utils/kefir';

import { DocumentStatus as DocumentStatusCode } from '@contentful/editorial-primitives';
import { FieldAccess } from './EntityField/EntityFieldAccess';
import { statusErrorHandler } from 'core/monitoring/error-tracking/capture';

/**
 * @ngdoc method
 * @name app/entity_editor/FieldLocaleDocument#create
 * @param {Document} doc
 * @param {Object} field
 * @param {string} localeCode  Internal locale code
 */
export const createFieldLocaleDocument = (doc, field, localeCode, canEditLocale) => {
  const fieldId = field.id;

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
  const valueProperty = valuePropertyAt(doc, path)
    .filter((value) => !isEqual(value, lastSetValue))
    .onValue((value) => (lastSetValue = value))
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
  const value$ = valuePropertyAt(doc, path);

  /**
   * @ngdoc property
   * @name FieldLocaleDocument#localChanges$
   * @description
   * Emits an event whenever a change to this field value is triggered
   * by the user.
   *
   * @type {Property<void>}
   */
  const localChanges$ = localFieldChanges(doc)
    .filter(([otherFieldId, otherLocaleCode]) => {
      return otherFieldId === fieldId && otherLocaleCode === localeCode;
    })
    .map(() => undefined);

  const documentStatus$ =
    createStatus(doc.sysProperty, doc.state.error$, doc.state.canEdit$, statusErrorHandler) ||
    K.constant();

  const collaborators = doc.presence.collaboratorsFor(fieldId, localeCode);

  /**
   * Holds information about the access to the current field locale.
   *
   * The object has a number of boolean properties that are set
   * according to the connection state and editing permissions.
   *
   * - `disconnected` No ShareJS connection
   * - `denied` The user does not have permission to edit the field
   * - `editing_disabled` The field is disabled at the content type level
   * - `disabled` Is true if one of the above is true
   * - `editable` Is true if 'disabled' is false
   */

  const access$ = K.combine(
    [documentStatus$, doc.state.isConnected$, collaborators],
    (status, isConnected, collaborators) => {
      if (field.disabled) {
        return FieldAccess.EDITING_DISABLED;
      } else if (!canEditLocale) {
        return FieldAccess.DENIED;
      } else if (
        isCollaborativeEditingDisabledForFieldType(field.type) &&
        collaborators &&
        collaborators.length > 0
      ) {
        return FieldAccess.OCCUPIED;
      } else if (isConnected) {
        // CmaDocument is always "connected" by design (unless internet down)
        // so we need to be more granular than in case of `OtDocument`.
        return [
          DocumentStatusCode.INTERNAL_SERVER_ERROR,
          DocumentStatusCode.EDIT_CONFLICT,
          DocumentStatusCode.ARCHIVED,
          DocumentStatusCode.DELETED,
          DocumentStatusCode.CONNECTION_ERROR,
        ].includes(status)
          ? FieldAccess.DISCONNECTED
          : FieldAccess.EDITABLE;
      } else {
        return FieldAccess.DISCONNECTED;
      }
    }
  ).toProperty();

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
    collaborators,
    notifyFocus: () => doc.presence.focus(fieldId, localeCode),
    localChanges$,
    access$,
  };

  function set(value) {
    lastSetValue = value;
    return doc.setValueAt(path, value).catch((error) => {
      lastSetValue = getValue();
      return Promise.reject(error);
    });
  }

  function removeAt(i) {
    return doc.removeValueAt(path.concat([i]));
  }

  function bindToPath(method) {
    return doc[method].bind(null, path);
  }
};

function isCollaborativeEditingDisabledForFieldType(fieldType) {
  return fieldType === 'RichText';
}
