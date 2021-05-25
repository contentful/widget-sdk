import React from 'react';
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
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { SpaceData } from 'classes/spaceContextTypes';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle',
  }),
};

type SpaceMembershipsList = {
  onLeave: (space: SpaceData) => void;
  goToSpace: (space: SpaceData) => void;
  spaces: SpaceData[];
};

const SpaceMembershipsList = ({ spaces, onLeave, goToSpace }: SpaceMembershipsList) => (
  <Workbench>
    <Workbench.Header
      icon={<ProductIcon icon="Spaces" size="large" />}
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
                          }>
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

export { SpaceMembershipsList };
