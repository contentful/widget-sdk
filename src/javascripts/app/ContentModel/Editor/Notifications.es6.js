import { first, get } from 'lodash';
import logger from 'logger';
import { Notification } from '@contentful/ui-component-library';
import { truncate } from 'utils/StringUtils.es6';

/**
 * This module exports functions that trigger notifications regarding the
 * content type editor.
 */

const saveError = 'Unable to save content type: ';
const messages = {
  save: {
    success: 'Content type saved successfully',
    invalid: saveError + 'Data is invalid',
    outdated: saveError + 'Your version is outdated. Please reload and try again'
  },
  create: {
    exists: 'A content type with this ID already exists'
  },
  duplicate: {
    success: 'Content type duplicated successfully',
    error: 'Unable to duplicate content type: '
  }
};

export function deleteSuccess() {
  Notification.success('Content type deleted successfully');
}

export function deleteFail(err) {
  Notification.error('Deleting content type failed: ' + getServerMessage(err));
  logger.logServerWarn('Error deleting Content Type', { error: err });
}

export function invalidAccordingToScope(errors, fieldNames) {
  errors = errors || [];
  const fieldErrors = errors.filter(error => {
    return error.path && error.path[0] === 'fields';
  });

  const errorFieldName = first(
    fieldErrors.map(error => {
      return fieldNames[error.path[1]];
    })
  );

  const errorWithoutFieldName = first(
    errors.map(error => {
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
  const err = logger.findActualServerError(errData);
  const errorId = get(err, 'sys.id');
  if (errorId === 'ValidationFailed') {
    saveInvalidError(errData, contentType);
  } else if (errorId === 'VersionMismatch') {
    if (contentType.getVersion()) {
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
  logger.logServerWarn('Error saving invalid Content Type', {
    error,
    contentType: contentType.data
  });
}

export function saveOutdatedError(error, contentType) {
  Notification.error(messages.save.outdated);
  logger.logServerWarn('Error activating outdated Content Type', {
    error,
    contentType: contentType.data
  });
}

export function saveIdExists() {
  Notification.error(messages.create.exists);
}

export function saveApiError(errData) {
  const message = saveError + getServerMessage(errData);
  Notification.error(message);
  logger.logServerWarn('Error activating Content Type', { error: errData });
}

export function duplicateSuccess() {
  Notification.success(messages.duplicate.success);
}

export function duplicateError(errData) {
  Notification.error(messages.duplicate.error + getServerMessage(errData));
}

function getServerMessage(errData) {
  const err = logger.findActualServerError(errData);
  return get(err, 'message') || get(err, 'sys.id') || 'Unknown server error';
}
