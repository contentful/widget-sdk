import { Notification } from '@contentful/forma-36-react-components';
import { get } from 'lodash';
import * as logger from 'services/logger';

const NOT_RENAMEABLE_MESSAGE =
  'Cannot change the code of a locale which is fallback of another one';
const ERROR_CHECKS = [
  {
    message: 'This locale already exists.',
    check: (err) => checkUnprocessableEntityErrorName('taken', err),
  },
  {
    message: 'Fallback setting creates a loop.',
    check: (err) => checkUnprocessableEntityErrorName('fallback locale creates a loop', err),
  },
  {
    message: NOT_RENAMEABLE_MESSAGE,
    check: function (err) {
      return (
        get(err, 'statusCode') === 403 &&
        get(err, ['body', 'sys', 'id']) === 'FallbackLocaleNotRenameable'
      );
    },
  },
];

export function deleteSuccess() {
  Notification.success('Locale deleted successfully');
}

export function saveSuccess() {
  Notification.success('Locale saved successfully');
}

export function notRenameable() {
  Notification.error(NOT_RENAMEABLE_MESSAGE);
}

export function codeChangeError() {
  Notification.error('New fallback code could not be saved');
}

export function deleteError(err) {
  Notification.error('Locale could not be deleted: ' + err.body.message);
  logger.logServerWarn('Locale could not be deleted', { error: err });
}

export function saveError(err) {
  const message = getErrorMessage(err);
  if (message) {
    Notification.error('Locale could not be saved: ' + message);
  } else {
    Notification.error('Locale could not be saved');
    logger.logServerWarn('Locale could not be saved', { error: err });
  }
}

function getErrorMessage(err) {
  const found = ERROR_CHECKS.find((item) => item.check(err));

  return found && found.message;
}

function checkUnprocessableEntityErrorName(name, err) {
  const status = get(err, 'statusCode');
  const errors = get(err, 'data.details.errors', []);

  return status === 422 && !!errors.find((error) => error.name === name);
}
