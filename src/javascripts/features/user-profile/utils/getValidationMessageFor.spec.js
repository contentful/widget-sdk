import { padEnd } from 'lodash';
import { getValidationMessageFor } from './getValidationMessageFor';

describe('getValidationMessageFor', () => {
  describe('firstName', () => {
    it('should return a message if no value is given', () => {
      const fields = {
        firstName: {
          value: '',
        },
      };

      expect(getValidationMessageFor(fields, 'firstName')).toEqual(expect.any(String));
    });

    it('should return a message if value is longer than 100 characters', () => {
      const fields = {
        firstName: {
          value: padEnd('', 101, 'a'),
        },
      };

      expect(getValidationMessageFor(fields, 'firstName')).toEqual(expect.any(String));
    });
  });

  describe('lastName', () => {
    it('should return a message if no value is given', () => {
      const fields = {
        lastName: {
          value: '',
        },
      };

      expect(getValidationMessageFor(fields, 'lastName')).toEqual(expect.any(String));
    });

    it('should return a message if value is longer than 100 characters', () => {
      const fields = {
        lastName: {
          value: padEnd('', 101, 'a'),
        },
      };

      expect(getValidationMessageFor(fields, 'lastName')).toEqual(expect.any(String));
    });
  });

  describe('email', () => {
    it('should return a message if no value is given', () => {
      const fields = {
        email: {
          value: '',
        },
      };

      expect(getValidationMessageFor(fields, 'email')).toEqual(expect.any(String));
    });

    it('should return a message if value is longer than 254 characters', () => {
      const fields = {
        email: {
          value: padEnd('', 254, 'a'),
        },
      };

      expect(getValidationMessageFor(fields, 'email')).toEqual(expect.any(String));
    });
  });

  describe('currentPassword', () => {
    it('should return a message if there is no value is given', () => {
      const fields = {
        currentPassword: {
          value: '',
        },
      };

      expect(getValidationMessageFor(fields, 'currentPassword')).toEqual(expect.any(String));
    });
  });

  describe('newPassword', () => {
    it('should return a message if the trimmed value is less than 8 characters long', () => {
      const fields = {
        newPassword: {
          value: '    mypass',
        },
      };

      expect(getValidationMessageFor(fields, 'newPassword')).toEqual(expect.any(String));
    });
  });

  describe('newPasswordConfirm', () => {
    it('should return a message if the value is less than 8 characters long', () => {
      const fields = {
        newPasswordConfirm: {
          value: '    mypass',
        },
      };

      expect(getValidationMessageFor(fields, 'newPasswordConfirm')).toEqual(expect.any(String));
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

      expect(getValidationMessageFor(fields, 'newPasswordConfirm')).toEqual(expect.any(String));
    });
  });
});
