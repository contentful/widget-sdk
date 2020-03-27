import { padEnd } from 'lodash';
import { create } from 'qrcode';
import { renderToDataURL } from 'qrcode/lib/renderer/canvas';
import * as utils from './utils';

jest.mock('qrcode', () => ({
  create: jest.fn(),
}));

jest.mock('qrcode/lib/renderer/canvas', () => ({
  renderToDataURL: jest.fn(),
}));

describe('UserProfile Settings utils', () => {
  describe('getValidationMessageFor', () => {
    describe('firstName', () => {
      it('should return a message if no value is given', () => {
        const fields = {
          firstName: {
            value: '',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'firstName')).toEqual(expect.any(String));
      });

      it('should return a message if value is longer than 100 characters', () => {
        const fields = {
          firstName: {
            value: padEnd('', 101, 'a'),
          },
        };

        expect(utils.getValidationMessageFor(fields, 'firstName')).toEqual(expect.any(String));
      });
    });

    describe('lastName', () => {
      it('should return a message if no value is given', () => {
        const fields = {
          lastName: {
            value: '',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'lastName')).toEqual(expect.any(String));
      });

      it('should return a message if value is longer than 100 characters', () => {
        const fields = {
          lastName: {
            value: padEnd('', 101, 'a'),
          },
        };

        expect(utils.getValidationMessageFor(fields, 'lastName')).toEqual(expect.any(String));
      });
    });

    describe('email', () => {
      it('should return a message if no value is given', () => {
        const fields = {
          email: {
            value: '',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'email')).toEqual(expect.any(String));
      });

      it('should return a message if value is longer than 254 characters', () => {
        const fields = {
          email: {
            value: padEnd('', 254, 'a'),
          },
        };

        expect(utils.getValidationMessageFor(fields, 'email')).toEqual(expect.any(String));
      });
    });

    describe('currentPassword', () => {
      it('should return a message if there is no value is given', () => {
        const fields = {
          currentPassword: {
            value: '',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'currentPassword')).toEqual(
          expect.any(String)
        );
      });
    });

    describe('newPassword', () => {
      it('should return a message if the trimmed value is less than 8 characters long', () => {
        const fields = {
          newPassword: {
            value: '    mypass',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'newPassword')).toEqual(expect.any(String));
      });
    });

    describe('newPasswordConfirm', () => {
      it('should return a message if the value is less than 8 characters long', () => {
        const fields = {
          newPasswordConfirm: {
            value: '    mypass',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'newPasswordConfirm')).toEqual(
          expect.any(String)
        );
      });

      it('should return a message if the value does not equal the value of the newPassword field', () => {
        const fields = {
          newPassword: {
            value: 'mypassword',
          },
          newPasswordConfirm: {
            value: 'not-mypassword',
          },
        };

        expect(utils.getValidationMessageFor(fields, 'newPasswordConfirm')).toEqual(
          expect.any(String)
        );
      });
    });
  });

  describe('createQRCodeDataURI', () => {
    it('should return null if not given data', () => {
      expect(utils.createQRCodeDataURI()).toBeNull();
    });

    it('should return null if given non-string data', () => {
      expect(utils.createQRCodeDataURI({})).toBeNull();
      expect(utils.createQRCodeDataURI(1234)).toBeNull();
      expect(utils.createQRCodeDataURI([])).toBeNull();
    });

    it('should call qrcode utilities to create the data URI', () => {
      utils.createQRCodeDataURI('hello');

      expect(create).toHaveBeenCalled();
      expect(renderToDataURL).toHaveBeenCalled();
    });
  });
});
