import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Space } from 'app/OrganizationSettings/PropTypes.es6';
import Autocomplete from './Autocomplete.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository.es6';
import useAsync from 'app/common/hooks/useAsync.es6';

export default function SpacesAutoComplete({
  value,
  orgId,
  disabled = false,
  validationMessage,
  onChange
}) {
  const [spaces, setSpaces] = useState([]);
  const [lastQuery, setLastQuery] = useState('');

  const getSpaces = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    const allSpaces = await getAllSpaces(endpoint);
    setSpaces(allSpaces);
    return allSpaces;
  }, [orgId]);

  const { isLoading } = useAsync(getSpaces);

  const handleChange = item => {
    onChange(item);
  };

  const handleQueryChange = query => {
    setLastQuery(query);
  };

  // Get the updated list of items, filtered by the last query (autocomplete input value)
  const items = useMemo(
    () =>
      spaces.filter(item => {
        const name = item.name.toLowerCase();
        return name.includes((lastQuery || '').toLowerCase()) && !value.includes(item);
      }),
    [lastQuery, spaces, value]
  );

  return (
    <Autocomplete
      items={items}
      onChange={handleChange}
      onQueryChange={handleQueryChange}
      placeholder="Search spaces"
      validationMessage={validationMessage}
      isLoading={isLoading}
      disabled={disabled}>
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
