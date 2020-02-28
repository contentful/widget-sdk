import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import {
  CardActions,
  TableRow,
  TableCell,
  Tooltip,
  ModalConfirm,
  Notification,
  Paragraph,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import moment from 'moment';

import ModalLauncher from 'app/common/ModalLauncher';
import { removeMembership } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { fetchCanLeaveOrg } from './OranizationUtils';
import { hasMemberRole, getRole } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';

const triggerLeaveModal = async (organization, onLeaveSuccess) => {
  const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      testId="organization-row.leave-confirmation"
      title="Leave organization"
      confirmLabel="Leave"
      intent="negative"
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}>
      <React.Fragment>
        <Paragraph>
          You are about to leave organization <b>{organization.name}.</b>
        </Paragraph>
        <Paragraph>Do you want to proceed?</Paragraph>
      </React.Fragment>
    </ModalConfirm>
  ));

  if (!confirmation) {
    return;
  }

  try {
    await removeMembership(createOrganizationEndpoint(organization.sys.id), organization.sys.id);
  } catch (e) {
    // should we have a more actionable error?
    Notification.error(`Could not leave organization ${organization.name}`);
    return;
  }
  onLeaveSuccess(organization);
  Notification.success(`Successfully left organization ${organization.name}`);
};

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle'
  }),
  tooltip: css({
    marginLeft: '10px'
  })
};

const OrganizationRow = ({ organization, onLeaveSuccess }) => {
  const userRole = getRole(organization.sys.id);

  const [canUserLeaveOrg, setCanUserLeaveOrg] = useState(true);

  // If the user has a role different than 'member' it means they have more permissions and should be able to access the org settings page.
  const canAccessOrgSettings = !hasMemberRole(organization);

  const goToOrgSettings = () => {
    go({
      path: ['account', 'organizations', 'subscription_new'],
      params: { orgId: organization.sys.id }
    });
  };

  useAsync(
    useCallback(async () => {
      const canUserLeaveOrg = await fetchCanLeaveOrg(organization);
      setCanUserLeaveOrg(canUserLeaveOrg);
    }, [organization])
  );

  const toolTipContent = !canUserLeaveOrg
    ? 'You cannot leave this organization since you are the only owner remaining'
    : '';

  return (
    <TableRow key={organization.sys.id} testId="organization-row">
      <TableCell testId="organization-row.organization-name">{organization.name}</TableCell>
      <TableCell
        title={moment(organization.sys.createdAt).format('MMMM DD, YYYY')}
        testId="organization-row.created-at">
        {moment(organization.sys.createdAt, moment.ISO_8601).format('MMMM DD, YYYY')}
      </TableCell>
      <TableCell testId="organization-row.user-role">{userRole}</TableCell>
      <TableCell testId="organization-row.option-dots" className={styles.dotsRow}>
        <CardActions
          iconButtonProps={{
            buttonType: 'primary',
            testId: 'organization-row.dropdown-menu.trigger'
          }}
          data-test-id="organization-row.dropdown-menu">
          <DropdownList>
            <DropdownListItem
              isDisabled={!canAccessOrgSettings}
              onClick={goToOrgSettings}
              testId="organization-row.go-to-org-link">
              Go to Organization Settings
            </DropdownListItem>
            <DropdownListItem
              isDisabled={!canUserLeaveOrg}
              onClick={() => {
                triggerLeaveModal(organization, onLeaveSuccess);
              }}
              testId="organization-row.leave-org-button">
              <Tooltip
                place="top"
                testId="organization-row.tool-tip"
                content={toolTipContent}
                className={styles.tooltip}>
                Leave Organization
              </Tooltip>
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
};

// Throwing prop errors
OrganizationRow.propTypes = {
  organization: OrganizationPropType.isRequired,
  onLeaveSuccess: PropTypes.func.isRequired
};

export default OrganizationRow;
