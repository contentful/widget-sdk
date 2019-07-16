import React from 'react';
import NewUser from './NewUser.es6';
import { render, cleanup, fireEvent, within, waitForElement } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { useAddToOrg } from './hooks.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';

const mockSubmitFn = jest.fn();

const mockRoles = [
  {
    name: 'Editor',
    sys: {
      id: 'editorid',
      space: { sys: { id: '123' } }
    }
  }
];

const mockSpaces = [
  {
    name: 'Foo',
    sys: { id: '123' }
  }
];

jest.mock('./hooks', () => ({
  useAddToOrg: jest.fn()
}));

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn().mockReturnValue({}),
  createSpaceEndpoint: jest.fn().mockReturnValue({})
}));

jest.mock('access_control/OrganizationMembershipRepository.es6', () => ({
  getAllRoles: jest.fn().mockResolvedValue(mockRoles),
  getAllSpaces: jest.fn().mockResolvedValue(mockSpaces)
}));

const generateAddresses = number => {
  return Array.from(new Array(number), (_, index) => `foo+${index}@bar.com`);
};

const mockOnReady = jest.fn();

const build = () => {
  useAddToOrg.mockReturnValue([{ loading: false }, mockSubmitFn]);
  getAllRoles.mockReturnValue(mockRoles);
  getAllSpaces.mockReturnValue(mockSpaces);
  return render(<NewUser orgId="myorg" onReady={mockOnReady} />);
};

const submitForm = async (wrapper, emails = '', role = '', spaceMemberships = []) => {
  const { getByTestId, getByLabelText, getAllByTestId, getByText, queryByTestId } = wrapper;
  const button = getByTestId('new-user.submit');
  const textarea = getByTestId('new-user.emails');
  const spacesAutocomplete = getByTestId('autocomplete.input');

  fireEvent.change(textarea.querySelector('textarea'), { target: { value: emails } });

  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = getByLabelText(role);
    fireEvent.click(roleInput);
  }

  if (spaceMemberships && spaceMemberships.length) {
    // focus on the autocomplete input to display dropdown with options
    fireEvent.focus(spacesAutocomplete);
    // wait for the spaces to be lodaded
    await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));

    spaceMemberships.forEach(({ spaceName, roleNames }, index) => {
      const space = getByText(spaceName);
      // select the space by name
      fireEvent.click(space);
      // get the space membership form by index
      const spaceMembershipForm = getAllByTestId('space-membership-list.item')[index];
      // for each role, click on the checkbox referenced by a label with the correct role name
      roleNames.forEach(async roleName => {
        const roleEditorButton = within(spaceMembershipForm).getByTestId(
          'space-role-editor.button'
        );
        fireEvent.click(roleEditorButton);
        const roleOption = getByLabelText(roleName);
        fireEvent.click(roleOption);
      });
    });
  }

  // submit the form
  fireEvent.click(button);

  // grab errors that might have showed up
  const emailsValidationMessage = within(textarea).queryByTestId('cf-ui-validation-message');
  const orgRoleValidationMessage = queryByTestId('new-user.org-role.error');
  const spaceMembershipsValidationMessage = queryByTestId('new-user.space-memberships.error');

  return {
    textarea,
    button,
    emailsValidationMessage,
    orgRoleValidationMessage,
    spaceMembershipsValidationMessage
  };
};

describe('NewUser', () => {
  afterEach(cleanup);
  afterEach(mockOnReady.mockReset);
  afterEach(mockSubmitFn.mockReset);

  it('dismisses the loading state', () => {
    build();
    expect(mockOnReady).toHaveBeenCalled();
  });

  it('validates the presence of at least one email addresses', async () => {
    const wrapper = build();
    const { emailsValidationMessage } = await submitForm(wrapper);
    expect(emailsValidationMessage).toBeVisible();
    expect(mockSubmitFn).not.toHaveBeenCalled();
  });

  it('validates email addresses', async () => {
    const wrapper = build();
    const { emailsValidationMessage } = await submitForm(wrapper, 'invalid@');
    expect(emailsValidationMessage).toBeVisible();
    expect(mockSubmitFn).not.toHaveBeenCalled();
  });

  it('validates the maximum number of email addresses', async () => {
    const wrapper = build();
    const emails = generateAddresses(101);
    const { emailsValidationMessage } = await submitForm(wrapper, emails);
    expect(emailsValidationMessage).toBeVisible();
    expect(mockSubmitFn).not.toHaveBeenCalled();
  });

  it('sends requests to 100 addresses', async () => {
    const wrapper = build();
    const emails = generateAddresses(100);
    const {
      emailsValidationMessage,
      orgRoleValidationMessage,
      spaceMembershipsValidationMessage
    } = await submitForm(wrapper, emails, 'Member');
    expect([
      emailsValidationMessage,
      orgRoleValidationMessage,
      spaceMembershipsValidationMessage
    ]).toEqual([null, null, null]);
    expect(mockSubmitFn).toHaveBeenCalledWith(emails, 'member', []);
  });

  it('validates that an org role was selected', async () => {
    const wrapper = build();
    const { orgRoleValidationMessage } = await submitForm(wrapper, 'john.doe@contentful.com', '');
    expect(orgRoleValidationMessage).toBeVisible();
    expect(mockSubmitFn).not.toHaveBeenCalled();
  });

  it('add to spaces', async () => {
    const wrapper = build();
    await submitForm(wrapper, 'expect@topass.com', 'Member', [
      { spaceName: 'Foo', roleNames: ['Editor'] }
    ]);

    expect(mockSubmitFn).toHaveBeenCalledWith(['expect@topass.com'], 'member', [
      {
        space: mockSpaces[0],
        roles: ['editorid']
      }
    ]);
  });

  it('it fails to send if a space role is not selected', async () => {
    const wrapper = build();
    const { spaceMembershipsValidationMessage } = await submitForm(
      wrapper,
      'expect@topass.com',
      'Member',
      [{ spaceName: 'Foo', roleNames: [] }]
    );

    expect(mockSubmitFn).not.toHaveBeenCalled();
    expect(spaceMembershipsValidationMessage).toBeVisible();
  });
});
