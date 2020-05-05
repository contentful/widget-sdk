import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import { createTeam } from '../services/TeamRepo';

export class TeamDetailsRoute extends React.Component {
  save = async ({ name, description }) => {
    return await createTeam({ name, description });
  };

  render() {
    return (
      <React.Fragment>
        <DocumentTitle title="Team Details" />
        <TeamDetails save={this.save} />
      </React.Fragment>
    );
  }
}
