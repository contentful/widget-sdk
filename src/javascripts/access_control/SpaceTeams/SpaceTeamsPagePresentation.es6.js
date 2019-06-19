import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { map, truncate } from 'lodash';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  IconButton,
  Button,
  Tooltip
} from '@contentful/forma-36-react-components';
import { cx } from 'emotion';
import pluralize from 'pluralize';

import Workbench from 'app/common/Workbench.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';
import { go } from 'states/Navigator.es6';

import LoadingPlaceholder from './LoadingPlaceholder.es6';
import RowMenu from './RowMenu.es6';
import styles from './styles.es6';

const goToAddTeams = () => go({
  path: ['spaces', 'detail', 'settings', 'teams', 'add']
});

const SpaceTeamsPagePresentation = ({ memberships, teams, isLoading }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const addTeamsButtonDisabled = memberships.length === teams.length;

  return (
    <Workbench>
      <Workbench.Header>
        <Workbench.Header.Left>
          <Workbench.Icon icon="page-teams" />
          <Workbench.Title>Teams {!isLoading && `(${memberships.length})`}</Workbench.Title>
        </Workbench.Header.Left>
        <Workbench.Header.Actions>
          <Tooltip
            place="left"
            content={
              addTeamsButtonDisabled && !isLoading
                ? 'All teams in the organization are already in this space'
                : ''
            }>
            <Button
              testId="add-teams"
              disabled={addTeamsButtonDisabled}
              onClick={goToAddTeams}>
              Add team
            </Button>
          </Tooltip>
        </Workbench.Header.Actions>
      </Workbench.Header>
      <Workbench.Content className={styles.contentAlignment}>
        <div className={styles.content}>
          <Table testId="membership-table">
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell className={styles.rolesColumn}>Role</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <LoadingPlaceholder />}
              {!isLoading &&
              memberships.map(
                ({
                   sys: {
                     id,
                     team: { name, description, memberCount }
                   },
                   roles,
                   admin
                 }) => (
                  <TableRow key={id} testId="membership-row" className={styles.row}>
                    <TableCell className={styles.cell} testId="team-cell">
                      <div className={styles.cellTeamName}>{name}</div>
                      {/*This truncation is a fallback for IE and pre-68 FF, which don't support css line-clamp*/}
                      <div className={styles.cellTeamDescription}>
                        {truncate(description, { length: 130 })}
                      </div>
                    </TableCell>
                    <TableCell className={styles.cell} testId="member-count-cell">
                      {pluralize('member', memberCount, true)}
                    </TableCell>
                    <TableCell className={cx(styles.cellRoles, styles.cell)} testId="roles-cell">
                      {admin ? 'Admin' : joinWithAnd(map(roles, 'name'))}
                    </TableCell>
                    <TableCell>
                      <RowMenu
                        membershipId={id}
                        isOpen={openMenu === id}
                        setOpen={open => setOpenMenu(open ? id : null)}
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </Workbench.Content>
    </Workbench>
  );
};

SpaceTeamsPagePresentation.propTypes = {
  memberships: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  teams: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default SpaceTeamsPagePresentation;
