describe('UserProfile Settings utils', () => {
  describe('getValidationMessageFor', () => {
    describe('firstName', () => {
      it('should return a message if no value is given', () => {});
    });

    describe('lastName', () => {
      it('should return a message if no value is given', () => {});
    });

    describe('email', () => {
      it('should return a message if no value is given', () => {});
    });

    describe('currentPassword', () => {
      it('should return null if the field has not been touched and is not dirty', () => {});

      it('should return a message if there is no value is given', () => {});
    });

    describe('newPassword', () => {
      it('should return null if the field has not been touched and is not dirty', () => {});

      it('should return null if no value is given', () => {});

      it('should return a message if the value is less than 8 characters long', () => {});
    });

    describe('newPasswordConfirm', () => {
      it('should return null if the field has not been touched and is not dirty', () => {});

      it('should return a message if the value is less than 8 characters long', () => {});

      it('should return a message if the value does not equal the value of the newPassword field', () => {});
    });
  });
});
