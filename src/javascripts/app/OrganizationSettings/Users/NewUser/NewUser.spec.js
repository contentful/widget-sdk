import React from 'react';
import NewUser from './NewUser.es6';
import {
  render,
  cleanup,
  fireEvent,
  within,
  waitForElement,
  act,
  wait
} from '@testing-library/react';
import 'jest-dom/extend-expect';
import {
  getAllSpaces,
  getAllRoles,
  invite,
  createOrgMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';

const mockRoles = [
  {
    name: 'Editor',
    sys: {
      id: 'editorid',
      space: { sys: { id: '123' } }
    }
  },
  {
    name: 'Author',
    sys: {
      id: 'authorid',
      space: { sys: { id: '456' } }
    }
  }
];

const mockSpaces = [
  {
    name: 'Foo',
    sys: { id: '123' }
  },
  {
    name: 'Bar',
    sys: { id: '456' }
  }
];

const mockOrgEndpoint = jest.fn().mockName('org endpoint');
const mockSpaceEndpoint = jest.fn().mockName('space endpoint');
const mockInviteToSpaceFn = jest.fn();

jest.mock('data/EndpointFactory.es6', () => ({
  createOrganizationEndpoint: jest.fn().mockName('create org endpoint'),
  createSpaceEndpoint: jest.fn()
}));

jest.mock('access_control/OrganizationMembershipRepository.es6', () => ({
  getAllRoles: jest.fn().mockResolvedValue(mockRoles),
  getAllSpaces: jest.fn().mockResolvedValue(mockSpaces),
  invite: jest.fn().mockResolvedValue({}),
  createOrgMembership: jest.fn().mockResolvedValue({})
}));

jest.mock('access_control/SpaceMembershipRepository.es6', () => ({
  create: jest.fn()
}));

const generateAddresses = number => {
  return Array.from(new Array(number), (_, index) => `foo+${index}@bar.com`);
};

const mockOnReady = jest.fn();

describe('NewUser', () => {
  beforeEach(() => {
    mockInviteToSpaceFn.mockResolvedValue({});
    createOrganizationEndpoint.mockReturnValue(mockOrgEndpoint);
    createSpaceEndpoint.mockReturnValue(mockSpaceEndpoint);
    createSpaceMembershipRepo.mockReturnValue({
      invite: mockInviteToSpaceFn
    });
  });
  afterEach(() => {
    mockOnReady.mockReset();
    createOrgMembership.mockReset();
    mockInviteToSpaceFn.mockReset();
    createSpaceEndpoint.mockReset();
    createSpaceMembershipRepo.mockReset();
    invite.mockReset();
    cleanup();
  });

  it('dismisses the loading state', () => {
    build();
    expect(mockOnReady).toHaveBeenCalled();
  });

  it('does not show the owner role as an option to non owners', () => {
    const { queryByLabelText } = build(false, false);
    expect(queryByLabelText('Owner')).toBeNull();
  });

  it('shows the owner role as an option to org owners', () => {
    const { getByLabelText } = build(false, true);
    expect(getByLabelText('Owner')).toBeVisible();
  });

  describe('validation fails', () => {
    it('validates the presence of at least one email addresses', async () => {
      const wrapper = build();
      const { emailsValidationMessage } = await submitForm(wrapper);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates email addresses', async () => {
      const wrapper = build();
      const { emailsValidationMessage } = await submitForm(wrapper, 'invalid@');
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates the maximum number of email addresses', async () => {
      const wrapper = build();
      const emails = generateAddresses(101);
      const { emailsValidationMessage } = await submitForm(wrapper, emails);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates that an org role was selected', async () => {
      const wrapper = build();
      const { orgRoleValidationMessage } = await submitForm(wrapper, 'john.doe@contentful.com', '');
      expect(orgRoleValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('add to spaces', async () => {
      const wrapper = build();
      await submitForm(wrapper, 'expect@topass.com', 'Member', [
        { spaceName: 'Foo', roleNames: ['Editor'] }
      ]);
      expect(createOrganizationEndpoint).toHaveBeenCalledWith('myorg');
      expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
        role: 'member',
        email: 'expect@topass.com',
        spaceInvitations: [
          {
            admin: false,
            roleIds: ['editorid'],
            spaceId: '123'
          }
        ]
      });
      expect(createSpaceMembershipRepo).not.toHaveBeenCalled();
      expect(mockInviteToSpaceFn).not.toHaveBeenCalled();
    });

    it('it fails to send if a space role is not selected', async () => {
      const wrapper = build();
      const { spaceMembershipsValidationMessage } = await submitForm(
        wrapper,
        'expect@topass.com',
        'Member',
        [{ spaceName: 'Foo', roleNames: [] }]
      );

      expect(invite).not.toHaveBeenCalled();
      expect(spaceMembershipsValidationMessage).toBeVisible();
    });
  });

  describe('validation passes', () => {
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
      expect(invite).toHaveBeenCalledTimes(100);
    });

    it('will not submit if the confirmation dialog is not confirmed', async () => {
      const wrapper = build();
      ModalLauncher.open.mockResolvedValueOnce(false);
      await submitForm(wrapper, ['john.doe@enterprise.com'], 'Owner');
      expect(invite).not.toHaveBeenCalled();
    });

    it('shows a success message', async () => {
      const wrapper = build();
      await submitForm(wrapper, ['john.doe@enterprise.com'], 'Owner');
      await wait(() => wrapper.getByTestId('new-user.done'));
      const successState = wrapper.getByTestId('new-user.done.success');
      expect(successState).toBeVisible();
      expect(invite).toHaveBeenCalledTimes(1);
    });
  });
});

function build(hasSsoEnabled = false, isOwner = true) {
  // useAddToOrg.mockReturnValue([{ loading: false }, mockSubmitFn]);
  getAllRoles.mockReturnValue(mockRoles);
  getAllSpaces.mockReturnValue(mockSpaces);
  return render(
    <NewUser orgId="myorg" onReady={mockOnReady} hasSsoEnabled={hasSsoEnabled} isOwner={isOwner} />
  );
}

async function submitForm(wrapper, emails = '', role = '', spaceMemberships = []) {
  const { getByTestId, getByLabelText, queryByTestId } = wrapper;
  const button = getByTestId('new-user.submit');
  const textarea = getByTestId('new-user.emails');

  // fill in the emails field
  fireEvent.change(textarea.querySelector('textarea'), { target: { value: emails } });

  // select org role
  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = getByLabelText(role);
    fireEvent.click(roleInput);
  }

  // add spaces and space roles
  if (spaceMemberships && spaceMemberships.length) {
    await addSpaceMemberships(wrapper, spaceMemberships);
  }

  // submit the form
  act(() => {
    fireEvent.click(button);
  });

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
}

async function addSpaceMemberships(wrapper, spaceMemberships) {
  const { getByTestId, getAllByTestId, getByLabelText, getByText } = wrapper;
  const spacesAutocomplete = getByTestId('autocomplete.input');

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
      const roleEditorButton = within(spaceMembershipForm).getByTestId('space-role-editor.button');
      fireEvent.click(roleEditorButton);
      const roleOption = getByLabelText(roleName);
      fireEvent.click(roleOption);
    });
  });
}
