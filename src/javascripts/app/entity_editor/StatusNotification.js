import React from 'react';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import { joinWithAnd } from 'utils/StringUtils';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { DocumentStatus } from '@contentful/editorial-primitives';

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

const StatusCodeNotification = ({ status, entityLabel, erroredLocales, entityHref }) => {
  switch (status) {
    case DocumentStatus.EDIT_CONFLICT:
      return (
        <Note noteType="warning" title={`There is a new version of this ${entityLabel}`}>
          A new version of this {entityLabel} was created. To view or edit, refresh your browser or
          open the {entityLabel} in a new tab. Your current changes may be lost.
          <div>
            <TextLink href={entityHref} target="_blank" rel="noopener noreferrer">
              View {entityLabel} in new tab
            </TextLink>
          </div>
        </Note>
      );
    case DocumentStatus.INTERNAL_SERVER_ERROR:
      return (
        <Note noteType="negative" title="Server error">
          Due to a server error, we could not process this {entityLabel}. The fields are temporarily
          locked so that you won’t lose any important changes.
        </Note>
      );
    case DocumentStatus.CONNECTION_ERROR:
      return (
        <Note noteType="negative" title="Connection error">
          It appears that you aren’t connected to internet at the moment. The fields are temporarily
          locked so that you won’t lose any important changes.
        </Note>
      );
    case DocumentStatus.ARCHIVED:
      return (
        <Note noteType="warning" title="Archived">
          This {entityLabel} is archived and cannot be modified. Please unarchive it to make any
          changes.
        </Note>
      );
    case DocumentStatus.DELETED:
      return (
        <Note noteType="negative" title="Deleted">
          This {entityLabel} has been deleted and cannot be modified anymore
        </Note>
      );
    case DocumentStatus.NOT_ALLOWED:
      return (
        <Note noteType="warning" title="Read-only">
          You have read-only access to this {entityLabel}. If you need to edit it please contact
          your administrator.
        </Note>
      );
    case DocumentStatus.DEFAULT_LOCALE_FILE_ERROR:
      return (
        <Note noteType="negative" title="Asset missing">
          This asset is missing a file for the default locale
        </Note>
      );
    case DocumentStatus.LOCALE_VALIDATION_ERRORS:
      return (
        <Note noteType="negative" title="Validation error">
          The following locales have fields with errors: {formatErroredLocales(erroredLocales)}
        </Note>
      );
    default:
      return null;
  }
};

StatusCodeNotification.propTypes = {
  status: PropTypes.oneOf(Object.values(DocumentStatus)).isRequired,
  entityLabel: PropTypes.oneOf(['entry', 'asset']).isRequired,
  entityHref: PropTypes.string,
  erroredLocales: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      default: PropTypes.bool.isRequired,
      internal_code: PropTypes.string.isRequired,
    }).isRequired
  ),
};

export default StatusCodeNotification;
