import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Heading
} from '@contentful/forma-36-react-components';
import getOrgId from 'redux/selectors/getOrgId.es6';

import createFetcherComponent, { FetcherLoading } from '../app/common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from '../data/EndpointFactory.es6';
import StateRedirect from '../app/common/StateRedirect.es6';
import DocumentTitle from '../components/shared/DocumentTitle.es6';

import { getAllTeamsSpaceMemberships } from './TeamRepository.es6';
import { joinWithAnd } from '../utils/StringUtils.es6';

const TeamListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  const promises = [getAllTeamsSpaceMemberships(endpoint)];

  return Promise.all(promises);
});

class SpaceTeamsPage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  componentDidMount() {
    const { onReady } = this.props;
    onReady();
  }

  render() {
    return (
      <TeamListFetcher orgId={this.props.orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading teams..." />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }

          const [TSMS] = data;

          return (
            <React.Fragment>
              <DocumentTitle title="Teams in Space" />
              <Heading>{`Teams in XXX space (${TSMS.length})`}</Heading>
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
                  {TSMS.map(({ sys: { id, team: { name, description } }, roles, admin }) => (
                    <TableRow key={id}>
                      <TableCell>
                        <div>{name}</div>
                        <div>{description}</div>
                      </TableCell>
                      <TableCell>{admin ? 'Admin' : joinWithAnd(map(roles, 'name'))}</TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </React.Fragment>
          );
        }}
      </TeamListFetcher>
    );
  }
}

export default connect(state => ({ orgId: getOrgId(state) }))(SpaceTeamsPage);
