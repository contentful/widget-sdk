import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Space } from 'app/OrganizationSettings/PropTypes.es6';
import Autocomplete from './Autocomplete.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
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
    return getAllSpaces(endpoint);
  }, [orgId]);

  const { isLoading, data } = useAsync(getSpaces);

  useEffect(() => {
    data && setSpaces(data);
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
      spaces.filter(item => {
        const name = item.name.toLowerCase();
        return name.includes((lastQuery || '').toLowerCase()) && !value.includes(item);
      }),
    [lastQuery, spaces, value]
  );

  return (
    <Autocomplete
      maxHeight={300}
      items={items}
      onChange={handleChange}
      onQueryChange={handleQueryChange}
      placeholder="Choose from spaces in your organization"
      validationMessage={validationMessage}
      isLoading={isLoading}
      width="large"
      disabled={disabled}
      emptyListMessage="There are no spaces to choose from"
      noMatchesMessage="No spaces found">
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
