import {filter, first, map, get} from 'lodash';
import logger from 'logger';
import notification from 'notification';
import {truncate} from 'stringUtils';

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

export function deleteSuccess () {
  notification.info('Content type deleted successfully');
}

export function deleteFail (err) {
  notification.error('Deleting content type failed: ' + getServerMessage(err));
  logger.logServerWarn('Error deleting Content Type', {error: err});
}

export function invalidAccordingToScope (errors, fieldNames) {
  const fieldErrors = filter(errors, function (error) {
    return error.path && error.path[0] === 'fields';
  });

  const errorFieldName = first(map(fieldErrors, function (error) {
    return fieldNames[error.path[1]];
  }));

  const errorWithoutFieldName = first(map(errors, function (error) {
    return error.message;
  }));

  if (errorFieldName) {
    notification.error(saveError + 'Invalid field “' + truncate(errorFieldName, 12) + '”');
  } else {
    notification.error(errorWithoutFieldName || messages.save.invalid);
  }
}

export function saveFailure (errData, contentType) {
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

export function saveSuccess () {
  notification.info(messages.save.success);
}

export function saveInvalidError (errData, contentType) {
  notification.error(messages.save.invalid);
  logger.logServerWarn('Error saving invalid Content Type', {
    error: errData,
    contentType: contentType.data
  });
}

export function saveOutdatedError (errData, contentType) {
  notification.error(messages.save.outdated);
  logger.logServerWarn('Error activating outdated Content Type', {
    error: errData,
    contentType: contentType.data
  });
}

export function saveIdExists () {
  notification.warn(messages.create.exists);
}

export function saveApiError (errData) {
  const message = saveError + getServerMessage(errData);
  notification.error(message);
  logger.logServerWarn('Error activating Content Type', {error: errData});
}

export function duplicateSuccess () {
  notification.info(messages.duplicate.success);
}

export function duplicateError (errData) {
  notification.error(messages.duplicate.error + getServerMessage(errData));

}

function getServerMessage (errData) {
  const err = logger.findActualServerError(errData);
  return get(err, 'message') ||
         get(err, 'sys.id') ||
         'Unknown server error';
}
