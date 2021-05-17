import { first, get } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { truncate } from 'utils/StringUtils';
import { captureWarning } from 'core/monitoring';

/**
 * This module exports functions that trigger notifications regarding the
 * content type editor.
 */

const saveError = 'Unable to save content type: ';
const messages = {
  save: {
    success: 'Content type saved successfully',
    invalid: saveError + 'Data is invalid',
    tooManyEditors: (max) =>
      `You’ve reached the limit of ${max} active entry editors for this content type. To fix this, remove an entry editor or contact support.`,
    outdated: saveError + 'Your version is outdated. Please reload and try again',
    nofields: 'At least one field is required to save a content type.',
  },
  create: {
    exists: 'A content type with this ID already exists',
  },
  duplicate: {
    success: 'Content type duplicated successfully',
    error: 'Unable to duplicate content type: ',
  },
};

export function deleteSuccess() {
  Notification.success('Content type deleted successfully');
}

export function deleteFail(error) {
  Notification.error('Deleting content type failed: ' + getServerMessage(error));
  captureWarning(new Error('Error deleting Content Type'), { extra: { error } });
}

export function invalidAccordingToScope(errors, fieldNames) {
  errors = errors || [];
  const fieldErrors = errors.filter((error) => {
    return error.path && error.path[0] === 'fields';
  });

  const errorFieldName = first(
    fieldErrors.map((error) => {
      return fieldNames[error.path[1]];
    })
  );

  const errorWithoutFieldName = first(
    errors.map((error) => {
      return error.message;
    })
  );

  if (errorFieldName) {
    Notification.error(saveError + 'Invalid field “' + truncate(errorFieldName, 12) + '”');
  } else {
    Notification.error(errorWithoutFieldName || messages.save.invalid);
  }
}

export function saveFailure(errData, contentType) {
  const err = findActualServerError(errData);
  const errorId = get(err, 'sys.id');
  if (errorId === 'ValidationFailed') {
    saveInvalidError(errData, contentType);
  } else if (errorId === 'VersionMismatch') {
    if (contentType.sys?.version) {
      saveOutdatedError(errData, contentType);
    } else {
      saveIdExists();
    }
  } else {
    saveApiError(errData);
  }
}

export function saveSuccess() {
  Notification.success(messages.save.success);
}

export function saveInvalidError(error, contentType) {
  Notification.error(messages.save.invalid);
  captureWarning(new Error('Error saving invalid Content Type'), {
    extra: {
      error,
      contentType,
    },
  });
}

export function tooManyEditorsError(reason) {
  const max = get(reason, 'max', 10);

  Notification.error(messages.save.tooManyEditors(max), { title: 'Unable to save content type' });
}

export function saveOutdatedError() {
  Notification.error(messages.save.outdated);
}

export function saveNoFields() {
  Notification.error(messages.save.nofields);
}

export function saveIdExists() {
  Notification.error(messages.create.exists);
}

export function saveApiError(errData) {
  const message = saveError + getServerMessage(errData);
  Notification.error(message);
}

export function duplicateSuccess() {
  Notification.success(messages.duplicate.success);
}

export function duplicateError(errData) {
  Notification.error(messages.duplicate.error + getServerMessage(errData));
}

function getServerMessage(errData) {
  const err = findActualServerError(errData);
  return get(err, 'message') || get(err, 'sys.id') || 'Unknown server error';
}

function findActualServerError(errData) {
  errData = errData || {};
  const actualErr = errData.body || errData.data || errData;
  return get(actualErr, 'sys.type') === 'Error' ? actualErr : undefined;
}
