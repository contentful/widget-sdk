import React from 'react';
import { render, fireEvent, screen, wait, within } from '@testing-library/react';

import * as fake from 'testHelpers/fakeFactory';
import * as FORMA_CONSTANTS from 'testHelpers/Forma36Constants';

import OrganizationRow from './OrganizationRow';
import ModalLauncher from '__mocks__/app/common/ModalLauncher';
import { fetchCanLeaveOrg } from './OranizationUtils';
import { hasMemberRole, getOrganizationMembership } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import { Notification } from '@contentful/forma-36-react-components';
import { removeMembership } from 'access_control/OrganizationMembershipRepository';

const fakeOrganization = fake.Organization();
const fakeOrgMemberhip = fake.OrganizationMembership('admin');
const onLeaveSuccess = jest.fn();

jest.mock('./OranizationUtils', () => ({
  fetchCanLeaveOrg: jest.fn()
}));

jest.mock('services/OrganizationRoles', () => ({
  hasMemberRole: jest.fn(),
  getOrganizationMembership: jest.fn()
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn()
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  removeMembership: jest.fn()
}));

const buildWithoutWaiting = props => {
  return render(
    <OrganizationRow
      {...{
        organization: fakeOrganization,
        onLeaveSuccess: onLeaveSuccess,
        ...props
      }}
    />
  );
};

const build = (props = {}) => {
  buildWithoutWaiting(props);
  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
};

describe('OrganizationRow', () => {
  beforeEach(() => {
    removeMembership.mockResolvedValueOnce(jest.fn());
    fetchCanLeaveOrg.mockReturnValue(true);
    hasMemberRole.mockReturnValue(false);
    getOrganizationMembership.mockReturnValue(fakeOrgMemberhip);

    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  describe('should render correctly', () => {
    it('should display the organization name', async () => {
      await build();

      expect(screen.getByTestId('organization-row.organization-name')).toHaveTextContent(
        fakeOrganization.name
      );
    });

    it('should display the created at date', async () => {
      await build();

      expect(screen.getByTestId('organization-row.created-at')).toHaveTextContent(
        'February 20, 2020'
      );
    });

    it('should display the users role', async () => {
      await build();

      expect(screen.getByTestId('organization-row.user-role')).toHaveTextContent('admin');
    });

    it('should display the organization option dots', async () => {
      await build();

      expect(screen.getByTestId('organization-row.option-dots')).toBeVisible();
    });
  });

  describe('test canUserLeaveOrg default behavoir ', () => {
    it('should default to allow the user to leave the org, this should be caught on the backend if not valid', async () => {
      fetchCanLeaveOrg.mockReset().mockReturnValue(false);

      buildWithoutWaiting();

      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));
      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      const leaveButton = within(leaveButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );
      expect(leaveButton.hasAttribute('disabled')).toBeFalsy();

      await wait();
    });
  });

  describe('drop down', () => {
    it('should render the options when clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.getByTestId('organization-row.go-to-org-link')).toBeVisible();
      expect(screen.getByTestId('organization-row.leave-org-button')).toBeVisible();
    });

    it('should display a tooltip which explains why the user cannot leave the org', async () => {
      fetchCanLeaveOrg.mockReset().mockReturnValue(false);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.getByTestId('organization-row.tool-tip')).toHaveTextContent(
        'You cannot leave this organization since you are the only owner remaining'
      );
    });

    it('should not display a tooltip when the user can leave the org', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.queryByTestId('organization-row.tool-tip')).toBeNull();
    });

    it('should render the go to org settings button as disabled if they are a regular member of the org', async () => {
      hasMemberRole.mockReset().mockReturnValue(true);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');
      const goToOrgButton = within(goToOrgButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(goToOrgButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should render the leave button as disabled when they are the last owner of an organization', async () => {
      fetchCanLeaveOrg.mockReset().mockReturnValue(false);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      const leaveButton = within(leaveButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(leaveButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should go to the org settings if they are not a member and click on the go to org settings button', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');

      fireEvent.click(
        within(goToOrgButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organizations', 'subscription_new'],
        params: { orgId: fakeOrgMemberhip.sys.id }
      });
    });

    it('should call removed them from the org and call onLeaveSuccess if they are can leave the org and click on the leave button', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      await expect(ModalLauncher.open).toHaveBeenCalled();

      await wait();
      expect(Notification.success).toHaveBeenCalledWith(
        `Successfully left organization ${fakeOrganization.name}`
      );
      await expect(onLeaveSuccess).toHaveBeenCalled();
    });

    it('should call onLeave if they are can leave the org and click on the leave button', async () => {
      removeMembership.mockReset().mockRejectedValueOnce(new Error());

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      await expect(ModalLauncher.open).toHaveBeenCalled();

      await wait();
      expect(Notification.error).toHaveBeenCalledWith(
        `Could not leave organization ${fakeOrganization.name}`
      );
    });
  });
});
