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
    'it please contact your administrator.'
});

export default class StatusCodeNotification extends React.Component {
  static propTypes = {
    status: PropTypes.string.isRequired,
    entityLabel: PropTypes.string.isRequired
  };

  render() {
    const { status, entityLabel } = this.props;
    if (status && status !== 'ok' && entityLabel) {
      return (
        <div className="entity-editor__notification">
          <p>{messages({ entityLabel })[status]}</p>
        </div>
      );
    } else {
      return null;
    }
  }
}
