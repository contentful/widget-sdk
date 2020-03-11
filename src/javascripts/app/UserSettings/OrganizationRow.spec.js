import React from 'react';
import { render, fireEvent, screen, wait, within } from '@testing-library/react';

import * as fake from 'testHelpers/fakeFactory';
import * as FORMA_CONSTANTS from 'testHelpers/Forma36Constants';

import OrganizationRow from './OrganizationRow';
import ModalLauncher from '__mocks__/app/common/ModalLauncher';
import { fetchCanLeaveOrg } from './OrganizationUtils';
import { isOwnerOrAdmin, getOrganizationMembership } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { go } from 'states/Navigator';
import { removeMembership } from 'access_control/OrganizationMembershipRepository';
import { Table, TableBody } from '@contentful/forma-36-react-components';
import * as logger from 'services/logger';

const fakeOrganization = fake.Organization();
const fakeOrgMemberhip = fake.OrganizationMembership('admin');
const onLeaveSuccess = jest.fn();

jest.mock('./OrganizationUtils', () => ({
  fetchCanLeaveOrg: jest.fn(Promise.resolve())
}));

jest.mock('utils/ResourceUtils', () => ({
  isLegacyOrganization: jest.fn()
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
  getOrganizationMembership: jest.fn()
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  removeMembership: jest.fn(Promise.resolve())
}));

const build = async (options = { props: {}, wait: true }) => {
  // Wrapped with a table to prevent error of <tr> being a child of <div> that react testing auto wraps the component in.
  const renderedComponent = render(
    <Table>
      <TableBody>
        <OrganizationRow
          {...{
            organization: fakeOrganization,
            onLeaveSuccess: onLeaveSuccess,
            ...options.props
          }}
        />
      </TableBody>
    </Table>
  );

  if (options.wait) {
    await wait();
  }

  return renderedComponent;
};

describe('OrganizationRow', () => {
  beforeEach(() => {
    removeMembership.mockResolvedValueOnce(jest.fn());
    fetchCanLeaveOrg.mockResolvedValue(true);
    isOwnerOrAdmin.mockReturnValue(false);
    isLegacyOrganization.mockReturnValue(false);
    getOrganizationMembership.mockReturnValue(fakeOrgMemberhip);
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

  describe('canUserLeaveOrg, default behavior', () => {
    it('should default to allow the user to leave the org', async () => {
      fetchCanLeaveOrg.mockResolvedValue(false);

      build({ wait: false });

      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));
      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(ModalLauncher.open).toHaveBeenCalled();
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

    it('should not render the go to org settings button as disabled if they are a legacy V1 org and the user is not admin or owner', async () => {
      isLegacyOrganization.mockReturnValue(true);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.go-to-org-link');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      await expect(ModalLauncher.open).not.toHaveBeenCalled();
    });

    it('should render the leave button as disabled when they are the last owner of an organization', async () => {
      fetchCanLeaveOrg.mockResolvedValue(false);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      await expect(ModalLauncher.open).not.toHaveBeenCalled();
    });

    it('should go to the org settings if they are a V1 legacy customer and user is admin or owner and click on the go to org settings button', async () => {
      isLegacyOrganization.mockReturnValue(true);
      isOwnerOrAdmin.mockReturnValue(true);

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');

      fireEvent.click(
        within(goToOrgButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organization_settings'],
        params: { orgId: fakeOrganization.sys.id }
      });
    });

    it('should go to the org settings if they are a V2 pricing customer and click on the go to org settings button', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const goToOrgButtonContainer = screen.getByTestId('organization-row.go-to-org-link');

      fireEvent.click(
        within(goToOrgButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organization_settings'],
        params: { orgId: fakeOrganization.sys.id }
      });
    });

    it('should call removed them from the org and call onLeaveSuccess if they are can leave the org and click on the leave button', async () => {
      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(ModalLauncher.open).toHaveBeenCalled();

      expect(
        await screen.findByText(`Successfully left organization ${fakeOrganization.name}`)
      ).toBeInTheDocument();
      expect(onLeaveSuccess).toHaveBeenCalled();
    });

    it('should display an error if leaving the org request fails', async () => {
      removeMembership.mockReset().mockRejectedValueOnce(new Error());

      await build();
      fireEvent.click(screen.getByTestId('organization-row.dropdown-menu.trigger'));

      const leaveButtonContainer = screen.getByTestId('organization-row.leave-org-button');
      fireEvent.click(
        within(leaveButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(ModalLauncher.open).toHaveBeenCalled();

      expect(
        await screen.findByText(`Could not leave organization ${fakeOrganization.name}`)
      ).toBeInTheDocument();
      expect(logger.logError).toHaveBeenCalled();
      expect(screen.getByTestId('organization-row.organization-name')).toHaveTextContent(
        fakeOrganization.name
      );
    });
  });
});
