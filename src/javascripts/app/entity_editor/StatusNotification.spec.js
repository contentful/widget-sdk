import React from 'react';
import { render } from '@testing-library/react';
import StatusNotification from './StatusNotification';
import DocumentStatusCode from 'data/document/statusCode';
import { range } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';

jest.mock('@contentful/forma-36-react-components', () => {
  const mock = jest.fn().mockReturnValue('id');
  return {
    Notification: {
      error: mock,
      warning: mock,
    },
  };
});

describe('StatusNotification', () => {
  const statusCodes = {
    [DocumentStatusCode.INTERNAL_SERVER_ERROR]: () => ({ title: 'Server error' }),
    [DocumentStatusCode.CONNECTION_ERROR]: () => ({ title: 'Connection error' }),
    [DocumentStatusCode.ARCHIVED]: (entityLabel) => ({
      title: `This ${entityLabel} is archived and cannot be modified. Please unarchive it to make any changes.`,
    }),
    [DocumentStatusCode.DELETED]: (entityLabel) => ({
      title: `This ${entityLabel} has been deleted and cannot be modified anymore`,
    }),
    [DocumentStatusCode.NOT_ALLOWED]: (entityLabel) => ({
      title: `You have read-only access to this ${entityLabel}. If you need to edit it please contact your administrator.`,
    }),
    [DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR]: () => ({
      title: 'This asset is missing a file for the default locale',
    }),
    [DocumentStatusCode.EDIT_CONFLICT]: (entityLabel, href) => ({
      title: `There is a new version of this ${entityLabel}`,
      cta: { textLinkProps: { href } },
    }),
  };
  const erroredLocales = [
    { name: 'English (United States)', internal_code: 'en-US', default: false },
    { name: 'Spanish (Spain)', internal_code: 'es-ES', default: true },
    { name: 'French (France)', internal_code: 'fr-FR', default: false },
    { name: 'Arabic (Egypt)', internal_code: 'ar-EG', default: false },
    { name: 'German (Germany)', internal_code: 'de-DE', default: false },
  ];
  const props = {
    entityLabel: 'entry',
    entityHref: 'hrefToTheEntityDetailsPage',
  };
  for (const status in statusCodes) {
    describe(status, () => {
      beforeEach(() => {
        props.status = status;
      });

      for (const entityLabel of ['entry', 'asset']) {
        describe(`when the entity label is "${entityLabel}"`, () => {
          beforeEach(async () => {
            props.entityLabel = entityLabel;
            render(<StatusNotification {...props} />);
            await new Promise((resolve) => setTimeout(resolve, 0));
          });

          it('triggers a notification', () => {
            expect(Notification.error).toBeCalled();
            const expected = statusCodes[status](entityLabel, props.entityHref);
            const config = Notification.error.mock.calls[0][1];
            expect(config).toMatchObject(expected);
          });
        });
      }
    });
  }

  describe('DocumentStatusCode.LOCALE_VALIDATION_ERRORS', () => {
    const errors = [
      'English (United States)',
      'Spanish (Spain) and English (United States)',
      'Spanish (Spain), English (United States), and French (France)',
      'Spanish (Spain), Arabic (Egypt), English (United States), and 1 other',
      'Spanish (Spain), Arabic (Egypt), German (Germany), and 2 others',
    ];

    beforeEach(() => {
      props.status = DocumentStatusCode.LOCALE_VALIDATION_ERRORS;
    });

    for (const n of range(1, 6)) {
      describe(`when the number of errored locales is ${n}`, () => {
        beforeEach(async () => {
          props.erroredLocales = erroredLocales.slice(0, n);
          render(<StatusNotification {...props} />);
          await new Promise((resolve) => setTimeout(resolve, 0));
        });

        it('matches snapshot', () => {
          expect(Notification.error).toBeCalled();
          const [text, config] = Notification.error.mock.calls[0];
          const { title } = config;
          expect(title).toBe('Validation error');
          expect(text).toBe(`The following locales have fields with errors: ${errors[n - 1]}`);
        });
      });
    }
  });
});
