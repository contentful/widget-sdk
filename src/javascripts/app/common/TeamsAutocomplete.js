import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Space } from 'app/OrganizationSettings/PropTypes';
import { Autocomplete } from '@contentful/forma-36-react-components/dist/alpha';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllTeams } from 'access_control/TeamRepository';
import useAsync from 'app/common/hooks/useAsync';

export default function SpacesAutoComplete({
  value,
  orgId,
  disabled = false,
  validationMessage,
  onChange
}) {
  const [teams, setTeams] = useState([]);
  const [lastQuery, setLastQuery] = useState('');

  const getTeams = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    return getAllTeams(endpoint);
  }, [orgId]);

  const { isLoading, data } = useAsync(getTeams);

  useEffect(() => {
    data && setTeams(data);
  }, [data]);

  const handleChange = item => {
    onChange(item);
  };

  const handleQueryChange = query => {
    setLastQuery(query);
  };

  // Get the updated list of items, filtered by the last query (autocomplete input value)
  const items = useMemo(
    () =>
      teams.filter(item => {
        const name = item.name.toLowerCase();
        return name.includes((lastQuery || '').toLowerCase()) && !value.includes(item);
      }),
    [lastQuery, teams, value]
  );

  return (
    <Autocomplete
      maxHeight={300}
      items={items}
      onChange={handleChange}
      onQueryChange={handleQueryChange}
      placeholder="Choose from teams in your organization"
      validationMessage={validationMessage}
      isLoading={isLoading}
      width="large"
      disabled={disabled}
      emptyListMessage="There are no teams to choose from"
      noMatchesMessage="No teams found"
      dropdownProps={{ isFullWidth: true }}>
      {options => options.map(option => <span key={option.sys.id}>{option.name}</span>)}
    </Autocomplete>
  );
}

SpacesAutoComplete.propTypes = {
  value: PropTypes.arrayOf(Space).isRequired,
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  validationMessage: PropTypes.string
};
