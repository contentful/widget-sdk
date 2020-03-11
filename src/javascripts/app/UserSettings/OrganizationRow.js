import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  CardActions,
  TableRow,
  TableCell,
  Tooltip,
  ModalConfirm,
  Notification,
  Paragraph,
  Typography,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import moment from 'moment';

import ModalLauncher from 'app/common/ModalLauncher';
import { removeMembership } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { fetchCanLeaveOrg } from './OrganizationUtils';
import { isOwnerOrAdmin, getOrganizationMembership } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import * as logger from 'services/logger';
import { go } from 'states/Navigator';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle'
  }),
  tooltip: css({
    marginLeft: '10px'
  })
};

const triggerLeaveModal = async ({ organization, userOrgMembershipId, onLeaveSuccess }) => {
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
        <Typography>
          <Paragraph>
            You are about to leave organization <b>{organization.name}.</b>
          </Paragraph>
          <Paragraph>Do you want to proceed?</Paragraph>
        </Typography>
      </React.Fragment>
    </ModalConfirm>
  ));

  if (!confirmation) {
    return;
  }

  try {
    await removeMembership(createOrganizationEndpoint(organization.sys.id), userOrgMembershipId);
  } catch (err) {
    // should we have a more actionable error?
    logger.logError('Cannot Remove membership', err);
    Notification.error(`Could not leave organization ${organization.name}`);
    return;
  }

  onLeaveSuccess(organization);
  Notification.success(`Successfully left organization ${organization.name}`);
};

const OrganizationRow = ({ organization, onLeaveSuccess }) => {
  const {
    role: userRole,
    sys: { id: userOrgMembershipId }
  } = getOrganizationMembership(organization.sys.id);

  const [canUserLeaveOrg, setCanUserLeaveOrg] = useState(true);
  let userCanAccessOrgSettings = true;

  // If it's a legacy organization (V1), then only the owner or admin can access the org settings.
  if (isLegacyOrganization(organization) && !isOwnerOrAdmin(organization)) {
    userCanAccessOrgSettings = false;
  }

  const goToOrgSettings = () => {
    go({
      path: ['account', 'organization_settings'],
      params: { orgId: organization.sys.id }
    });
  };

  useEffect(() => {
    fetchCanLeaveOrg(organization).then(setCanUserLeaveOrg);
  }, [organization]);

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
            {userCanAccessOrgSettings && (
              <DropdownListItem onClick={goToOrgSettings} testId="organization-row.go-to-org-link">
                Go to Organization Settings
              </DropdownListItem>
            )}
            <DropdownListItem
              isDisabled={!canUserLeaveOrg}
              onClick={() => {
                triggerLeaveModal({ organization, userOrgMembershipId, onLeaveSuccess });
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

OrganizationRow.propTypes = {
  organization: OrganizationPropType.isRequired,
  onLeaveSuccess: PropTypes.func.isRequired
};

export default OrganizationRow;
