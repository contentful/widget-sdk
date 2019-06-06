import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Heading,
  IconButton
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { getSpace } from 'services/TokenStore.es6';

import Workbench from 'app/common/Workbench.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';
import ellipsisStyle from 'ellipsisStyle.es6';

import { getTeamsSpaceMembershipsOfSpace } from './TeamRepository.es6';

const TeamListFetcher = createFetcherComponent(({ spaceId }) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const promises = [getTeamsSpaceMembershipsOfSpace(spaceEndpoint), getSpace(spaceId)];

  return Promise.all(promises);
});

const cell = {
  paddingRight: '180px'
};

const styles = {
  contentAlignment: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  }),
  content: css({
    marginRight: tokens.spacingL,
    marginLeft: tokens.spacingL
  }),
  header: css({
    fontWeight: tokens.fontWeightNormal,
    fontSize: tokens.fontSize2Xl,
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM
  }),
  headerTeamName: css({
    fontWeight: tokens.fontWeightMedium
  }),
  row: css({
    height: '95px'
  }),
  rolesColumn: css({
    width: '30%'
  }),
  cellTeamName: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    maxWidth: '400px',
    whiteSpace: 'nowrap',
    ...ellipsisStyle
  }),
  cellTeamDescription: css({
    maxWidth: '400px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical'
  }),
  cellRoles: css({
    maxWidth: '400px',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em',
    ...cell
  })
};

export default class SpaceTeamsPage extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { spaceId } = this.props;

    return (
      <TeamListFetcher spaceId={spaceId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading teams..." />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }

          const [teamSpaceMemberships, space] = data;

          return (
            <React.Fragment>
              <DocumentTitle title="Teams in Space" />
              <Workbench>
                <Workbench.Header>
                  <Workbench.Header.Left>
                    <Workbench.Icon icon="page-teams" />
                    <Workbench.Title>Teams</Workbench.Title>
                  </Workbench.Header.Left>
                </Workbench.Header>
                <Workbench.Content className={styles.contentAlignment}>
                  <div className={styles.content}>
                    <Heading className={styles.header}>
                      Teams in <span className={styles.headerTeamName}>{space.name}</span>
                      {` space (${teamSpaceMemberships.length})`}
                    </Heading>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Team</TableCell>
                          <TableCell className={styles.rolesColumn}>Role</TableCell>
                          <TableCell>Members</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teamSpaceMemberships.map(
                          ({
                            sys: {
                              id,
                              team: { name, description, memberCount }
                            },
                            roles,
                            admin
                          }) => (
                            <TableRow key={id} className={styles.row}>
                              <TableCell className={css(cell)}>
                                <div className={styles.cellTeamName}>{name}</div>
                                <div className={styles.cellTeamDescription}>{description}</div>
                              </TableCell>
                              <TableCell className={styles.cellRoles}>
                                {admin ? 'Admin' : joinWithAnd(map(roles, 'name'))}
                              </TableCell>
                              <TableCell className={css(cell)}>{memberCount}</TableCell>
                              <TableCell>
                                <IconButton
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
