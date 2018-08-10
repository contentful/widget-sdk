import { h } from 'ui/Framework';

/**
 * This component renders an alert depending on the document status.
 *
 * The available status IDs are defined in `data/document/status`.
 */

// Maps status IDs to string template functions.
const messages = ({entityLabel}) => ({
  'ot-connection-error':
    'It appears that you aren’t connected to internet at the moment. ' +
    'The fields are temporarily locked so that you won’t lose any ' +
    'important changes.',
  'archived':
    `This ${entityLabel} is archived and cannot be ` +
    'modified. Please unarchive it to make any changes.',
  'deleted':
    `This ${entityLabel} has been deleted and cannot be ` +
    'modified anymore.',
  'editing-not-allowed':
    `You have read-only access to this ${entityLabel}. If you need to edit ` +
    'it please contact your administrator.'
});

export default function renderStatusNotification (status, entityLabel) {
  if (status === 'ok') {
    // TODO we need this currently because the return value is used by
    // the `cf-component-bridge` directive which cannot handle
    // undefined or null values.
    return h('noscript');
  } else {
    const message = messages({entityLabel})[status];
    return h('.entity-editor__notification', [
      h('p', [ message ])
    ]);
  }
}
