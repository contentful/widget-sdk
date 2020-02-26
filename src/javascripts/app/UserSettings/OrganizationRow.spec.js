import React from 'react';
import { render, fireEvent, screen, wait, within } from '@testing-library/react';
import * as fake from 'testHelpers/fakeFactory';
import * as FORMA_CONSTANTS from 'testHelpers/Forma36Constants';

import OrganizationRow from './OrganizationRow';
import { fetchCanLeaveOrg } from './OranizationUtils';
import { hasMemberRole } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';

const fakeOrganization = fake.Organization();
const onLeave = jest.fn();

jest.mock('./OranizationUtils', () => ({
  fetchCanLeaveOrg: jest.fn().mockImplementation(() => {
    return true;
  })
}));

jest.mock('services/OrganizationRoles', () => ({
  hasMemberRole: jest.fn().mockImplementation(() => {
    return true;
  })
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

const build = (props = {}) => {
  render(
    <OrganizationRow
      {...{
        organization: fakeOrganization,
        onLeave: onLeave,
        ...props
      }}
    />
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
};

describe('OrganizationRow', () => {
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

    it('should display the organization option dots', async () => {
      await build();

      expect(screen.getByTestId('organization-row.option-dots')).toBeDefined();
    });
  });

  describe('test canUserLeaveOrg default behavoir ', () => {
    it('should default to allow the user to leave the org, this should be caught on the backend if not valid', async () => {
      //   Unsure how to write this test at the moment, will come back to it.
      //   fetchCanLeaveOrg.mockImplementation(() => {
      //       return false;
      //     });
      //     await build();
      //     fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));
      //     const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      //     const leaveButton = within(leaveButtonContainer).getByTestId(
      //       FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      //     );
      //     expect(leaveButton.hasAttribute('disabled')).toBeFalsy();
    });
  });

  describe('drop down', () => {
    it('should render the options when clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.getByTestId('organization-row.go-to-org-link')).toBeDefined();
      expect(screen.getByTestId('organization-row.leave-org-button')).toBeDefined();
    });

    it('should display a tooltip which explains why the user cannot leave the org', async () => {
      fetchCanLeaveOrg.mockImplementation(() => {
        return false;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.getByTestId('organization-row.tool-tip')).toHaveTextContent(
        'You cannot leave this organization since you are the only owner remaining'
      );
    });

    it('should not display a tooltip when the user can leave the org', async () => {
      fetchCanLeaveOrg.mockImplementation(() => {
        return true;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      expect(screen.queryByTestId('organization-row.tool-tip')).toBeNull();
    });

    it('should render the go to org settings button as disabled if they are a regular member of the org', async () => {
      hasMemberRole.mockImplementation(() => {
        return true;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');
      const goToOrgButton = within(goToOrgButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(goToOrgButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should render the leave button as disabled when they are the last owner of an organization', async () => {
      fetchCanLeaveOrg.mockImplementation(() => {
        return false;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      const leaveButton = within(leaveButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(leaveButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should go to the org settings if they are not a member and click on the go to org settings button', async () => {
      hasMemberRole.mockImplementation(() => {
        return false;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');

      fireEvent.click(
        within(goToOrgButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organizations', 'subscription_new'],
        params: { orgId: fakeOrganization.sys.id }
      });
    });

    it('should call onLeave if they are can leave the org and click on the leave button', async () => {
      fetchCanLeaveOrg.mockImplementation(() => {
        return true;
      });

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');

      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(onLeave).toHaveBeenCalled();
    });
  });
});
