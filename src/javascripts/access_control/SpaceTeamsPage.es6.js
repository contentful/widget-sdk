import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { map, find, filter } from 'lodash';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Heading,
  IconButton
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { css } from 'emotion';

import Workbench from 'app/common/Workbench.es6';
import createFetcherComponent, { FetcherLoading } from '../app/common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from '../data/EndpointFactory.es6';
import StateRedirect from '../app/common/StateRedirect.es6';
import DocumentTitle from '../components/shared/DocumentTitle.es6';
import { joinWithAnd } from '../utils/StringUtils.es6';

import { getAllTeamsMemberships, getAllTeamsSpaceMemberships } from './TeamRepository.es6';

import getSpacesByOrgId from 'redux/selectors/getSpacesByOrgId.es6';

const TeamListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  const promises = [getAllTeamsSpaceMemberships(endpoint), getAllTeamsMemberships(endpoint)];

  return Promise.all(promises);
});

const cell = {
  paddingRight: '180px'
};

const styles = {
  content: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  }),
  contentAlignment: css({
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
  cellTeamName: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark
  }),
  cellTeamDescription: css({
    maxWidth: '230px',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-moz-line-clamp': '2',
    '-webkit-box-orient': 'vertical'
  }),
  cellRoles: css({
    maxWidth: '410px',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em',
    ...cell
  })
};

class SpaceTeamsPage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    spaceName: PropTypes.string.isRequired
  };

  componentDidMount() {
    const { onReady } = this.props;
    onReady();
  }

  render() {
    const { orgId, spaceName } = this.props;

    return (
      <TeamListFetcher orgId={orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading teams..." />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }

          const [teamSpaceMemberships, spaceMemberships] = data;

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
                <Workbench.Content className={styles.content}>
                  <div className={styles.contentAlignment}>
                    <Heading className={styles.header}>
                      Teams in <span className={styles.headerTeamName}>{spaceName}</span>
                      {` space (${teamSpaceMemberships.length})`}
                    </Heading>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Team</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Members</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teamSpaceMemberships.map(
                          ({
                            sys: {
                              id,
                              team: {
                                name,
                                description,
                                sys: { id: teamId }
                              }
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
                              <TableCell className={css(cell)}>
                                {
                                  filter(spaceMemberships, {
                                    sys: { team: { sys: { id: teamId } } }
                                  }).length
                                }
                              </TableCell>
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

export default connect((state, { spaceId }) => {
  const orgId = getOrgId(state);
  return {
    orgId,
    spaceName: find(getSpacesByOrgId(state)[orgId], { sys: { id: spaceId } }).name
  };
})(SpaceTeamsPage);
