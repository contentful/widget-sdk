import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import {
  TableRow,
  TableCell,
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import moment from 'moment';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { fetchCanLeaveOrg } from './OranizationUtils';
import { hasMemberRole } from 'services/OrganizationRoles';
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

const OrganizationRow = ({ organization, onLeave }) => {
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
                onLeave(organization);
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
  onLeave: PropTypes.func.isRequired
};

export default OrganizationRow;
