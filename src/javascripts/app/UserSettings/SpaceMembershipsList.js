import React from 'react';
import PropTypes from 'prop-types';
import {
  CardActions,
  TableRow,
  TableCell,
  DropdownList,
  DropdownListItem,
  Tooltip,
  Workbench,
  Table,
  TableHead,
  TableBody,
} from '@contentful/forma-36-react-components';
import moment from 'moment';
import { css } from 'emotion';

import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import NavigationIcon from 'ui/Components/NavigationIcon';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle',
  }),
};

const SpaceMembershipsList = ({ spaces, onLeave, goToSpace }) => (
  <Workbench>
    <Workbench.Header
      icon={<NavigationIcon icon="spaces" size="large" color="green" />}
      title={`Space memberships (${(spaces || []).length})`}
    />
    <Workbench.Content type="default">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Organization</TableCell>
            <TableCell>Invited at</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(spaces || []).map((space) => {
            return (
              <TableRow key={space.sys.id} testId="membership-row">
                <TableCell testId="space-cell">{space.name}</TableCell>
                <TableCell testId="organization-cell">{space.organization.name}</TableCell>
                <TableCell title={moment(space.sys.createdAt).format('MMMM DD, YYYY')}>
                  {moment(space.sys.createdAt, moment.ISO_8601).fromNow()}
                </TableCell>
                <TableCell testId="organization-row.actions-cell" className={styles.dotsRow}>
                  <CardActions
                    iconButtonProps={{
                      buttonType: 'primary',
                      testId: 'organization-row.dropdown-menu.trigger',
                    }}
                    data-test-id="organization-row.dropdown-menu">
                    <DropdownList>
                      <DropdownListItem
                        onClick={() => {
                          goToSpace(space);
                        }}
                        testId="membership-row.go-to-space-link">
                        Go to Space
                      </DropdownListItem>
                      <DropdownListItem
                        isDisabled={!space.spaceMembership}
                        onClick={() => {
                          onLeave(space);
                        }}
                        testId="membership-row.leave-space-button">
                        <Tooltip
                          place="top"
                          content={
                            !space.spaceMembership
                              ? 'You have access to this space through a team. To leave the space you must be removed from the team.'
                              : ''
                          }
                          className={styles.tooltip}>
                          Leave Space
                        </Tooltip>
                      </DropdownListItem>
                    </DropdownList>
                  </CardActions>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Workbench.Content>
  </Workbench>
);

SpaceMembershipsList.propTypes = {
  onLeave: PropTypes.func.isRequired,
  goToSpace: PropTypes.func.isRequired,
  spaces: PropTypes.arrayOf(SpacePropType),
};

export default SpaceMembershipsList;
