import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DocumentStatusCode from 'data/document/statusCode';
import { sortBy } from 'lodash';
import { joinWithAnd } from 'utils/StringUtils';
import { Notification } from '@contentful/forma-36-react-components';

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

const messages = {
  [DocumentStatusCode.EDIT_CONFLICT]: ({ entityLabel, entityHref }) =>
    Notification.warning(
      `A new version of this ${entityLabel} was created. To view or edit, refresh your browser or open the entry in a new tab. Your current changes may be lost.`,
      {
        title: `There is a new version of this ${entityLabel}`,
        cta: {
          label: 'View entry in new tab',
          textLinkProps: { target: '_blank', href: entityHref },
        },
        duration: 0,
      }
    ),
  [DocumentStatusCode.INTERNAL_SERVER_ERROR]: ({ entityLabel }) =>
    Notification.error(
      `Due to a server error, we could not process this ${entityLabel}. ` +
        'The fields are temporarily locked so that you won’t lose any ' +
        'important changes.',
      {
        title: 'Server error',
        duration: 0,
      }
    ),
  [DocumentStatusCode.CONNECTION_ERROR]: () =>
    Notification.error(
      'It appears that you aren’t connected to internet at the moment. ' +
        'The fields are temporarily locked so that you won’t lose any ' +
        'important changes.',
      {
        title: 'Connection error',
        duration: 0,
      }
    ),
  [DocumentStatusCode.ARCHIVED]: ({ entityLabel }) =>
    Notification.error('', {
      title: `This ${entityLabel} is archived and cannot be modified. Please unarchive it to make any changes.`,
      duration: 0,
    }),
  [DocumentStatusCode.DELETED]: ({ entityLabel }) =>
    Notification.error('', {
      title: `This ${entityLabel} has been deleted and cannot be modified anymore`,
      duration: 0,
    }),
  [DocumentStatusCode.NOT_ALLOWED]: ({ entityLabel }) =>
    Notification.error('', {
      title: `You have read-only access to this ${entityLabel}. If you need to edit it please contact your administrator.`,
      duration: 0,
    }),
  [DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR]: () =>
    Notification.error('', {
      title: 'This asset is missing a file for the default locale',
      duration: 0,
    }),
  [DocumentStatusCode.LOCALE_VALIDATION_ERRORS]: ({ erroredLocales }) =>
    Notification.error(
      `The following locales have fields with errors: ${formatErroredLocales(erroredLocales)}`,
      {
        title: 'Validation error',
        duration: 0,
      }
    ),
};

const StatusCodeNotification = ({ status, entityLabel, erroredLocales, entityHref }) => {
  const activeIdRef = useRef(null);

  useEffect(() => {
    const trigger = async () => {
      if (activeIdRef.current) {
        await Notification.close(activeIdRef.current);
        activeIdRef.current = null;
      }

      if (status in messages) {
        const notification = await messages[status]({
          entityLabel,
          erroredLocales,
          entityHref,
        });
        activeIdRef.current = notification.id;
      }
    };
    // Render on the next tick to ensure it's displayed under other notifications.
    setTimeout(trigger, 0);
  }, [status, entityLabel, erroredLocales, entityHref]);

  return null;
};

StatusCodeNotification.propTypes = {
  status: PropTypes.string.isRequired,
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
