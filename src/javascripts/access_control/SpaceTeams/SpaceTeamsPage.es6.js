import React from 'react';
import PropTypes from 'prop-types';
import { map, truncate } from 'lodash';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  IconButton
} from '@contentful/forma-36-react-components';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';

import Workbench from 'app/common/Workbench.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';
import ellipsisStyle from 'ellipsisStyle.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

import { getTeamsSpaceMembershipsOfSpace } from '../TeamRepository.es6';
import { getSectionVisibility } from '../AccessChecker/index.es6';

export const TeamListFetcher = createFetcherComponent(async ({ spaceId, onReady }) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const promises = [getTeamsSpaceMembershipsOfSpace(spaceEndpoint)];

  let data;
  try {
    data = await Promise.all(promises);
  } finally {
    onReady();
  }
  return data;
});

const columnMaxWidth = '350px';

const styles = {
  contentAlignment: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: tokens.spacingL
  }),
  content: css({
    width: '100%',
    paddingRight: tokens.spacingL,
    paddingLeft: tokens.spacingL
  }),
  row: css({
    height: '95px'
  }),
  rolesColumn: css({
    width: '30%'
  }),
  cell: css({
    paddingRight: '160px'
  }),
  cellTeamName: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    maxWidth: columnMaxWidth,
    whiteSpace: 'nowrap',
    ...ellipsisStyle
  }),
  cellTeamDescription: css({
    maxWidth: columnMaxWidth,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical'
  }),
  cellRoles: css({
    maxWidth: columnMaxWidth,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em'
  })
};

export default class SpaceTeamsPage extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  render() {
    const { spaceId, onReady } = this.props;
    if (!getSectionVisibility().teams) {
      return <ForbiddenPage />;
    }

    return (
      <TeamListFetcher spaceId={spaceId} onReady={onReady}>
        {({ isLoading, isError, data }) => {
          if (isError) {
            return (
              <div className={styles.contentAlignment}>
                <UnknownErrorMessage />
              </div>
            );
          }
          if (isLoading) {
            return null;
          }

          const [teamSpaceMemberships] = data;
          const sortedMemberships = teamSpaceMemberships.sort(
            (
              {
                sys: {
                  team: { name: nameA }
                }
              },
              {
                sys: {
                  team: { name: nameB }
                }
              }
            ) => nameA.localeCompare(nameB)
          );

          return (
            <React.Fragment>
              <DocumentTitle title="Teams in Space" />
              <Workbench>
                <Workbench.Header>
                  <Workbench.Header.Left>
                    <Workbench.Icon icon="page-teams" />
                    <Workbench.Title>Teams ({teamSpaceMemberships.length})</Workbench.Title>
                  </Workbench.Header.Left>
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
                        {sortedMemberships.map(
                          ({
                            sys: {
                              id,
                              team: { name, description, memberCount }
                            },
                            roles,
                            admin
                          }) => (
                            <TableRow
                              key={id}
                              testId={`membership-row-${id}`}
                              className={styles.row}>
                              <TableCell className={styles.cell} testId={`team-cell-${id}`}>
                                <div className={styles.cellTeamName}>{name}</div>
                                {/*This truncation is a fallback for IE and pre-68 FF, which don't support css line-clamp*/}
                                <div className={styles.cellTeamDescription}>
                                  {truncate(description, { length: 130 })}
                                </div>
                              </TableCell>
                              <TableCell
                                className={cx(styles.cellRoles, styles.cell)}
                                testId={`roles-cell-${id}`}>
                                {admin ? 'Admin' : joinWithAnd(map(roles, 'name'))}
                              </TableCell>
                              <TableCell className={styles.cell} testId={`member-count-cell-${id}`}>
                                {pluralize('member', memberCount, true)}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  testId={`action-button-${id}`}
                                  label="Action"
                                  buttonType="secondary"
                                  iconProps={{ icon: 'MoreHorizontal' }}
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
            </React.Fragment>
          );
        }}
      </TeamListFetcher>
    );
  }
}
