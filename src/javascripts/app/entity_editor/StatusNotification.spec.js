import React from 'react';
import Enzyme from 'enzyme';
import StatusNotification from './StatusNotification';
import DocumentStatusCode from 'data/document/statusCode';
import { range } from 'lodash';

describe('StatusNotification', () => {
  const statusCodes = [
    DocumentStatusCode.INTERNAL_SERVER_ERROR,
    DocumentStatusCode.CONNECTION_ERROR,
    DocumentStatusCode.ARCHIVED,
    DocumentStatusCode.DELETED,
    DocumentStatusCode.NOT_ALLOWED,
    DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR
  ];
  const erroredLocales = [
    { name: 'English (United States)', internal_code: 'en-US', default: false },
    { name: 'Spanish (Spain)', internal_code: 'es-ES', default: true },
    { name: 'French (France)', internal_code: 'fr-FR', default: false },
    { name: 'Arabic (Egypt)', internal_code: 'ar-EG', default: false },
    { name: 'German (Germany)', internal_code: 'de-DE', default: false }
  ];
  const props = {
    entityLabel: 'entry'
  };
  const render = () => Enzyme.shallow(<StatusNotification {...props} />);

  for (const status of statusCodes) {
    describe(status, () => {
      beforeEach(() => {
        props.status = status;
      });

      for (const entityLabel of ['entry', 'asset']) {
        describe(`when the entity label is "${entityLabel}"`, () => {
          beforeEach(() => {
            props.entityLabel = 'entry';
          });

          it('matches snapshot', () => {
            expect(render()).toMatchSnapshot();
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
        beforeEach(() => {
          props.erroredLocales = erroredLocales.slice(0, n);
        });

        it('matches snapshot', () => {
          expect(render()).toMatchSnapshot();
        });
      });
    }
  });
});
