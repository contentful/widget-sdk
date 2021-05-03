import React from 'react';
import { render } from '@testing-library/react';
import StatusNotification from './StatusNotification';
import { DocumentStatus as DocumentStatusCode } from '@contentful/editorial-primitives';
import { range } from 'lodash';

describe('StatusNotification', () => {
  const statusCodes = [
    DocumentStatusCode.INTERNAL_SERVER_ERROR,
    DocumentStatusCode.CONNECTION_ERROR,
    DocumentStatusCode.ARCHIVED,
    DocumentStatusCode.DELETED,
    DocumentStatusCode.NOT_ALLOWED,
    DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR,
    DocumentStatusCode.EDIT_CONFLICT,
  ];
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
  for (const status of statusCodes) {
    describe(status, () => {
      beforeEach(() => {
        props.status = status;
      });

      for (const entityLabel of ['entry', 'asset']) {
        describe(`when the entity label is "${entityLabel}"`, () => {
          it('matches snapshot', () => {
            props.entityLabel = entityLabel;
            const { baseElement } = render(<StatusNotification {...props} />);
            expect(baseElement).toMatchSnapshot();
          });
        });
      }
    });
  }

  describe('DocumentStatusCode.LOCALE_VALIDATION_ERRORS', () => {
    beforeEach(() => {
      props.status = DocumentStatusCode.LOCALE_VALIDATION_ERRORS;
    });

    for (const n of range(1, 6)) {
      describe(`when the number of errored locales is ${n}`, () => {
        it('matches snapshot', () => {
          props.erroredLocales = erroredLocales.slice(0, n);
          const { baseElement } = render(<StatusNotification {...props} />);
          expect(baseElement).toMatchSnapshot();
        });
      });
    }
  });
});
