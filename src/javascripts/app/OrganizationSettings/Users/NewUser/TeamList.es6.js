import React, { useState, useCallback, useEffect } from 'react';
import { css } from 'emotion';
import { groupBy } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllTeamsSpaceMemberships } from 'access_control/TeamRepository.es6';
import { SectionHeading } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import TeamsAutocomplete from 'app/common/TeamsAutocomplete.es6';
import TeamSelection from './TeamSelection.es6';
import useAsync from 'app/common/hooks/useAsync.es6';

const styles = {
  count: css({
    marginTop: tokens.spacingM
  }),
  list: css({
    marginTop: tokens.spacingM
  }),
  leftColumn: css({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }),
  teamName: css({
    fontWeight: tokens.fontWeightMedium,
    width: 200
  }),
  roleEditor: css({}),
  errorIcon: css({
    marginLeft: tokens.spacingS
  })
};

/**
 * Holds an object of space memberships and role ids key'd by space id,
 * At this state, admin is held as a role with a fake id for simplicity.
 * The objects will be converted to a real space membership shape in SpaceMembershipRepo.invite
 * Calls a callback when memberships change
 * [{ space: {}, roles: [ROLE_ID_1, ROLE_ID_2]]
 */
export default function SpaceMembershipList({ orgId, onChange }) {
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
      <TeamsAutocomplete orgId={orgId} onChange={handleTeamSelected} value={teams} />
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

SpaceMembershipList.propTypes = {
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};
