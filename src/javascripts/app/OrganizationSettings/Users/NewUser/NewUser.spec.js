import React from 'react';
import NewUser from './NewUser.es6';
import { render, cleanup, fireEvent } from 'react-testing-library';
import 'jest-dom/extend-expect';

const mockSubmitFn = jest.fn();

jest.mock('./hooks', () => ({
  useAddToOrg: jest.fn().mockReturnValue([{ isLoading: false }, mockSubmitFn])
}));

const generateAddresses = number => {
  return Array.from(new Array(number), (_, index) => `foo+${index}@bar.com`);
};

const build = () => {
  return render(<NewUser orgId="myorg" />);
};

const submitForm = (wrapper, emails = '', role = '') => {
  const { getByTestId, getByLabelText } = wrapper;
  const button = getByTestId('new-user.submit');
  const textarea = getByTestId('new-user.emails');

  fireEvent.change(textarea.querySelector('textarea'), { target: { value: emails } });
  fireEvent.click(button);

  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = getByLabelText(role);
    fireEvent.change(roleInput, { target: { value: role.toLowerCase() } });
  }

  const emailsValidationMessage = textarea.querySelector('[data-test-id=cf-ui-validation-message]');
  const orgRoleValidationMessage = getByTestId('new-user.org-role.error');
  return { textarea, button, emailsValidationMessage, orgRoleValidationMessage };
};

describe('NewUser', () => {
  afterEach(cleanup);

  it('validates the presence of at least one email addresses', () => {
    const wrapper = build();
    const { emailsValidationMessage } = submitForm(wrapper);
    expect(emailsValidationMessage).not.toBeNull();
  });

  it('validates email addresses', () => {
    const wrapper = build();
    const { emailsValidationMessage } = submitForm(wrapper, 'invalid@');
    expect(emailsValidationMessage).not.toBeNull();
  });

  it('validates the maximum number of email addresses', () => {
    const wrapper = build();
    const emails = generateAddresses(101);
    const { emailsValidationMessage } = submitForm(wrapper, emails);
    expect(emailsValidationMessage).not.toBeNull();
  });

  it('validates that an org role was selected', () => {
    const wrapper = build();
    const { orgRoleValidationMessage } = submitForm(wrapper, 'john.doe@contentful.com', '');
    expect(orgRoleValidationMessage).not.toBeNull();
  });
});
