import notification from 'notification';
import logger from 'logger';
import { get } from 'lodash';

const NOT_RENAMEABLE_MESSAGE =
  'Cannot change the code of a locale which is fallback of another one';
const ERROR_CHECKS = [
  {
    message: 'This locale already exists',
    check: err => {
      checkUnprocessableEntityErrorName('taken', err);
    }
  },
  {
    message: 'Fallback setting creates a loop',
    check: err => {
      checkUnprocessableEntityErrorName('fallback locale creates a loop', err);
    }
  },
  {
    message: NOT_RENAMEABLE_MESSAGE,
    check: function(err) {
      return status === 403 && get(err, ['body', 'sys', 'id']) === 'FallbackLocaleNotRenameable';
    }
  }
];

function deleteSuccess() {
  notification.info('Locale deleted successfully');
}

function saveSuccess() {
  notification.info('Locale saved successfully');
}

function notRenameable() {
  notification.error(NOT_RENAMEABLE_MESSAGE);
}

function codeChangeError() {
  notification.error('New fallback code could not be saved');
}

function deleteError(err) {
  notification.error('Locale could not be deleted: ' + err.body.message);
  logger.logServerWarn('Locale could not be deleted', { error: err });
}

function saveError(err) {
  const message = getErrorMessage(err);
  if (message) {
    notification.error('Locale could not be saved: ' + message);
  } else {
    notification.error('Locale could not be saved');
    logger.logServerWarn('Locale could not be saved', { error: err });
  }
}

function getErrorMessage(err) {
  const found = ERROR_CHECKS.find(item => item.check(err));

  return found && found.message;
}

function checkUnprocessableEntityErrorName(name, err) {
  const status = get(err, ['statusCode']);
  const errors = get(err, ['body', 'details', 'errors']);

  return status === 422 && errors && errors.length > 0 && errors[0].name === name;
}

export default {
  deleteSuccess,
  saveSuccess,
  notRenameable,
  codeChangeError,
  deleteError,
  saveError
};
