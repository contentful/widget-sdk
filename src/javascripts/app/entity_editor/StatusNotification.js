import React from 'react';
import PropTypes from 'prop-types';
import DocumentStatusCode from 'data/document/statusCode';
import { sortBy } from 'lodash';
import { cx } from 'emotion';
import { joinWithAnd } from 'utils/StringUtils';
import { Paragraph } from '@contentful/forma-36-react-components';

/**
 * This component renders an alert depending on the document status.
 *
 * The available status IDs are defined in `data/document/statusCode`.
 */

const formatLocales = ([first, second, third, ...rest]) => {
  let locales;
  if (rest.length) {
    const others = rest.length > 1 ? 'others' : 'other';
    locales = [first, second, third, `${rest.length} ${others}`];
  } else {
    locales = [first, second, third].filter(Boolean);
  }
  return joinWithAnd(locales);
};

const sortLocales = (locales) => sortBy(locales, [(l) => !l.default, 'internal_code']);

const formatErroredLocales = (erroredLocales) => {
  const locales = sortLocales(erroredLocales).map((l) => l.name);
  return formatLocales(locales);
};

const messages = ({ entityLabel, erroredLocales }) => ({
  [DocumentStatusCode.EDIT_CONFLICT]:
    'There is a new version of this entry. To view or edit, refresh your browser or open the entry in a new tab. ' +
    'Your current changes may be lost.',
  [DocumentStatusCode.INTERNAL_SERVER_ERROR]:
    `Due to a server error, we could not process this ${entityLabel}. ` +
    'The fields are temporarily locked so that you won’t lose any ' +
    'important changes.',
  [DocumentStatusCode.CONNECTION_ERROR]:
    'It appears that you aren’t connected to internet at the moment. ' +
    'The fields are temporarily locked so that you won’t lose any ' +
    'important changes.',
  [DocumentStatusCode.ARCHIVED]:
    `This ${entityLabel} is archived and cannot be ` +
    'modified. Please unarchive it to make any changes.',
  [DocumentStatusCode.DELETED]:
    `This ${entityLabel} has been deleted and cannot be ` + 'modified anymore.',
  [DocumentStatusCode.NOT_ALLOWED]:
    `You have read-only access to this ${entityLabel}. If you need to edit ` +
    'it please contact your administrator.',
  [DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR]:
    'This asset is missing a file for the default locale.',
  [DocumentStatusCode.LOCALE_VALIDATION_ERRORS]: `The following locales have fields with errors: ${formatErroredLocales(
    erroredLocales
  )}`,
});

const StatusCodeNotification = ({ status, entityLabel, erroredLocales, className }) =>
  status && status !== 'ok' && entityLabel ? (
    <div className={cx('entity-editor__notification', className)}>
      <Paragraph>{messages({ entityLabel, erroredLocales })[status]}</Paragraph>
    </div>
  ) : null;

StatusCodeNotification.propTypes = {
  status: PropTypes.string.isRequired,
  entityLabel: PropTypes.oneOf(['entry', 'asset']).isRequired,
  erroredLocales: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      default: PropTypes.bool.isRequired,
      internal_code: PropTypes.string.isRequired,
    }).isRequired
  ),
  className: PropTypes.string,
};

export default StatusCodeNotification;
