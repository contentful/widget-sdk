import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import {
  TableRow,
  TableCell,
  TextLink,
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import moment from 'moment';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { fetchCanLeaveOrg } from './OranizationUtils';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle'
  }),
  tooltip: css({
    marginLeft: '10px'
  })
};

const OrganizationRow = ({ orgMembership, onLeave }) => {
  const [canUserLeaveOrg, setCanUserLeaveOrg] = useState(false);

  useAsync(
    useCallback(async () => {
      const canUserLeaveOrg = await fetchCanLeaveOrg(orgMembership);
      setCanUserLeaveOrg(canUserLeaveOrg);
    }, [orgMembership])
  );

  const toolTipContent = !canUserLeaveOrg
    ? 'You cannot leave this organization since you are the only owner remaining'
    : '';

  return (
    <TableRow key={orgMembership.sys.id} testId="membership-row">
      <TableCell testId="orgMembership-cell">
        <TextLink href={`/orgMemberships/${orgMembership.sys.id}`}>{orgMembership.name}</TextLink>
      </TableCell>
      <TableCell title={moment(orgMembership.sys.createdAt).format('MMMM DD, YYYY')}>
        {moment(orgMembership.sys.createdAt, moment.ISO_8601).format('MMMM DD, YYYY')}
      </TableCell>

      <TableCell testId="subscription-page.spaces-list.option-dots" className={styles.dotsRow}>
        <CardActions
          iconButtonProps={{
            buttonType: 'primary',
            testId: 'subscription-page.spaces-list.dropdown-menu.trigger'
          }}
          data-test-id="subscription-page.spaces-list.dropdown-menu">
          <DropdownList>
            <Tooltip place="top" content={toolTipContent} className={styles.tooltip}>
              <DropdownListItem
                isDisabled={!canUserLeaveOrg}
                onClick={() => {
                  onLeave(orgMembership);
                }}
                testId="subscription-page.spaces-list.change-space-link">
                Leave Organization
              </DropdownListItem>
            </Tooltip>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
};

// Throwing prop errors
OrganizationRow.propTypes = {
  orgMembership: OrganizationPropType,
  onLeave: PropTypes.func.isRequired
};

export default OrganizationRow;
