describe('AccountDetails', () => {
  it('should show the first and last name, email, and user avatar', () => {});

  it('should show the password if the password is set', () => {});

  it('should allow the user to set their password if the password is not set', () => {});

  it('should show the open identities section', () => {});

  it('should open the UserEditModal component if the user attempts to edit their profile', () => {});

  it('should do nothing if the UserEditModal result is false', () => {});

  it('should update the user if the UserEditModal result is not false', () => {});

  it('should open the AddPasswordModal component if the user attempts to add a password', () => {});

  it('should do nothing if the AddPasswordModal result is false', () => {});

  it('should update the user if the AddPasswordModal result is not false', () => {});

  it('should show the unconfirmed email separately', () => {});

  describe('SSO restricted', () => {
    it('should tell the user that the account is SSO enabled', () => {});

    it('should not show if the password is set, even if it is set', () => {});

    it('should not allow the user to set their password if the password is not set', () => {});

    it('should not show the open identities section', () => {});
  });
});
