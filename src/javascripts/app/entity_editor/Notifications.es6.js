/**
 * @ngdoc service
 * @name app/entity_editor/Notifications
 * @description
 * Exports a factory that creates an notification function to be used for
 * in-app notifications from the entity editor.
 *
 * ~~~js
 * import {Notification, makeNotify} from 'app/entity_editor/Notifications'
 * const notify = makeNotify('Entry', () => 'entry title')
 * notify(Notification.Success('publish'))
 * notify(Notification.Error('delete', response))
 * notify(Notification.ValidationError())
 * ~~~
 *
 * The `Notification.Succes` and `Notification.Error` constructors
 * accept an action string as their first argument. This string is used
 * to select the message template. Possible values are
 * - `delete`
 * - `archive`
 * - `unarchive`
 * - `publish`
 * - `unpublish`
 * - `duplicate`
 * - `revert`
 *
 * The `Notification.Error` constructor accepts an additional HTTP
 * error response object like the one returned by 'data/Endpoint'.
 *
 * Among the inspected response properties are
 * - `reponse.data.sys.id`
 * - `reponse.data.details.errors`
 */
import { makeSum, caseof } from 'sum-types';
import Notifier from 'notification';
import { get as getAtPath, first, template as _makeTemplate, assign } from 'lodash';

export const Notification = makeSum({
  Success: ['action'],
  // 'response' is an HTTP error response as returned by
  // 'data/spaceEndoint' for example.
  Error: ['action', 'response'],
  ValidationError: []
});

const publishValidationFailMessage = publishFail(
  'Validation failed. Please check the individual fields for errors.'
);

const publishServerFailMessage = makeTemplate(
  'Publishing %{title} has failed due to a server issue. ' + 'We have been notified.'
);

const successMessages = {
  // We cannot use `getTitle()` because that function will
  // return undefined after the entity has been deleted
  delete: makeTemplate('%{Type} deleted successfully'),

  archive: makeTemplate('%{title} archived successfully'),
  unarchive: makeTemplate('%{title} unarchived successfully'),
  publish: makeTemplate('%{title} published successfully'),
  unpublish: makeTemplate('%{title} unpublished successfully'),
  revert: makeTemplate('Discarded changes of %{title} successfully'),
  duplicate: null
};

const errorMessages = {
  delete: makeTemplate('Error deleting %{title} (%{error})'),
  archive: makeTemplate('Error archiving %{title} (%{error})'),
  unarchive: makeTemplate('Error unarchiving %{title} (%{error})'),
  publish: makeTemplate('Error publishing %{title} (%{error})'),
  unpublish: makeTemplate('Error unpublishing %{title} (%{error})'),
  revert: makeTemplate('Error discarding changes of %{title}'),
  duplicate: makeTemplate('Could not duplicate %{type}')
};

export function makeNotify(Type, getTitle) {
  if (Type !== 'Entry' && Type !== 'Asset') {
    throw new Error(`Unknown entity type ${Type}`);
  }
  const type = Type.toLowerCase();

  return function notify(notification) {
    caseof(notification, [
      [Notification.Success, ({ action }) => notifySuccess(action)],
      [Notification.Error, ({ action, response }) => notifyError(action, response)],
      [
        Notification.ValidationError,
        () => {
          Notifier.error(renderTemplate(publishValidationFailMessage));
        }
      ]
    ]);
  };

  function notifySuccess(action) {
    const template = successMessages[action];
    if (template === undefined) {
      throw new Error(`Unknown success notification "${action}"`);
    }

    if (template) {
      Notifier.success(renderTemplate(template));
    }
  }

  function notifyError(action, apiResponse) {
    Notifier.error(getErrorMessage(action, apiResponse));
  }

  function getErrorMessage(action, apiResponse) {
    const template =
      action === 'publish' ? publishErrorMessage(apiResponse) : errorMessages[action];

    if (template === undefined) {
      throw new Error(`Unknown error notification "${action}"`);
    }

    const error = getAtPath(apiResponse, 'data.sys.id');
    return renderTemplate(template, { error: error });
  }

  function renderTemplate(template, env) {
    return template(
      assign(
        {
          Type: Type,
          type: type,
          title: getTitle()
        },
        env
      )
    );
  }
}

function makeTemplate(tpl) {
  return _makeTemplate(tpl, { interpolate: /%{([\s\S]+?)}/ });
}

/**
 * Given an API response from the '/published' endpoint returns the
 * message template for the error notification.
 */
function publishErrorMessage(error) {
  const errorId = getAtPath(error, 'data.sys.id');
  if (errorId === 'ValidationFailed') {
    return publishValidationFailMessage;
  } else if (errorId === 'VersionMismatch') {
    return publishFail('Can only publish most recent version');
  } else if (errorId === 'UnresolvedLinks') {
    return publishFail('Some linked entries are missing.');
  } else if (errorId === 'InvalidEntry') {
    if (isLinkValidationError(error)) {
      return publishFail(getLinkValidationErrorMessage(error));
    } else if (error.data.message === 'Validation error') {
      return publishValidationFailMessage;
    } else {
      return publishServerFailMessage;
    }
  } else {
    return publishServerFailMessage;
  }
}

function publishFail(message) {
  return makeTemplate(`Error publishing %{title}: ${message}`);
}

function isLinkValidationError(response) {
  const errors = getAtPath(response, 'data.details.errors');
  return (
    response.data.message === 'Validation error' &&
    errors.length > 0 &&
    errors[0].name === 'linkContentType'
  );
}

function getLinkValidationErrorMessage(response) {
  const error = first(getAtPath(response, 'data.details.errors'));
  return error && error.details;
}
