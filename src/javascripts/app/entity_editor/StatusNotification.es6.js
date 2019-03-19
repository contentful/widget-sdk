import React from 'react';
import PropTypes from 'prop-types';
import DocumentStatusCode from 'data/document/statusCode.es6';

/**
 * This component renders an alert depending on the document status.
 *
 * The available status IDs are defined in `data/document/statusCode`.
 */

// Maps status IDs to string template functions.
const messages = ({ entityLabel }) => ({
  [DocumentStatusCode.INTERNAL_SERVER_ERROR]:
    `Due to a server error, we could not process this ${entityLabel}. ` +
    'The fields are temporarily locked so that you won’t lose any ' +
    'important changes.',
  [DocumentStatusCode.CONNECTION_ERROR]:
    'It appears that you aren’t connected to internet at the moment. ' +
    'The fields are temporarily locked so that you won’t lose any ' +
    'important changes.',
  archived:
    `This ${entityLabel} is archived and cannot be ` +
    'modified. Please unarchive it to make any changes.',
  deleted: `This ${entityLabel} has been deleted and cannot be ` + 'modified anymore.',
  [DocumentStatusCode.NOT_ALLOWED]:
    `You have read-only access to this ${entityLabel}. If you need to edit ` +
    'it please contact your administrator.',
  [DocumentStatusCode.LOCALE_VALIDATION_ERRORS]: 'Some locales have validation errors.',
  [DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR]:
    'This asset is missing a file for the default locale.'
});

const StatusCodeNotification = ({ status, entityLabel }) =>
  status && status !== 'ok' && entityLabel ? (
    <div className="entity-editor__notification">
      <p>{messages({ entityLabel })[status]}</p>
    </div>
  ) : null;

StatusCodeNotification.propTypes = {
  status: PropTypes.string.isRequired,
  entityLabel: PropTypes.string.isRequired
};

export default StatusCodeNotification;
