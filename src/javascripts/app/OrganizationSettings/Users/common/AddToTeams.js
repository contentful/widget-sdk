import React, { useState, useCallback, useEffect } from 'react';
import { css } from 'emotion';
import { groupBy } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllTeamsSpaceMemberships } from 'access_control/TeamRepository';
import { SectionHeading } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import TeamsAutocomplete from 'app/common/TeamsAutocomplete';
import TeamSelection from './TeamSelection';
import useAsync from 'app/common/hooks/useAsync';

const styles = {
  count: css({
    marginTop: tokens.spacingM
  }),
  list: css({
    marginTop: tokens.spacingM
  })
};

export default function AddToTeams({ orgId, onChange, inputWidth }) {
  const [teams, setTeams] = useState([]);
  const [teamSpaceMemberships, setTeamSpaceMemberships] = useState([]);

  const getTeamSpaceMemberships = useCallback(() => {
    const endpoint = createOrganizationEndpoint(orgId);
    return getAllTeamsSpaceMemberships(endpoint);
  }, [orgId]);

  const { data } = useAsync(getTeamSpaceMemberships);

  useEffect(() => {
    data && setTeamSpaceMemberships(groupBy(data, 'sys.team.sys.id'));
  }, [data]);

  const handleTeamSelected = team => {
    setTeams([...teams, team]);
  };

  const handleTeamRemoved = teamId => {
    setTeams(teams.filter(team => team.sys.id !== teamId));
  };

  useEffect(() => {
    onChange(teams);
  }, [onChange, teams]);

  return (
    <div data-test-id="new-user.teams">
      <TeamsAutocomplete
        orgId={orgId}
        onChange={handleTeamSelected}
        value={teams}
        inputWidth={inputWidth}
      />
      {teams.length > 0 && (
        <SectionHeading className={styles.count}>{`${pluralize(
          'team',
          teams.length,
          true
        )} selected`}</SectionHeading>
      )}
      <div className={styles.list}>
        {teams.map(team => (
          <TeamSelection
            key={team.sys.id}
            onRemove={() => handleTeamRemoved(team.sys.id)}
            team={team}
            teamSpaceMemberships={teamSpaceMemberships[team.sys.id]}></TeamSelection>
        ))}
      </div>
    </div>
  );
}

AddToTeams.propTypes = {
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  inputWidth: PropTypes.oneOf(['small', 'medium', 'large', 'full'])
};
