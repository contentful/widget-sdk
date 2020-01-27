import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Space } from 'app/OrganizationSettings/PropTypes';
import { Autocomplete } from '@contentful/forma-36-react-components/dist/alpha';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import useAsync from 'app/common/hooks/useAsync';

export default function SpacesAutoComplete({
  value,
  orgId,
  disabled = false,
  inputWidth = 'large',
  validationMessage,
  onChange
}) {
  const [lastQuery, setLastQuery] = useState('');

  const getSpaces = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    return getAllSpaces(endpoint);
  }, [orgId]);

  const { isLoading, data: spaces } = useAsync(getSpaces);

  const handleChange = item => {
    onChange(item);
  };

  const handleQueryChange = query => {
    setLastQuery(query);
  };

  // Get the updated list of items, filtered by the last query (autocomplete input value)
  const items = useMemo(() => {
    const valueIds = value.map(space => space.sys.id);

    if (!spaces) return [];

    return spaces.filter(item => {
      const name = item.name.toLowerCase();
      const isAvailable = !valueIds.includes(item.sys.id);
      const nameMatchesQuery = name.includes((lastQuery || '').toLowerCase());
      return nameMatchesQuery && isAvailable;
    });
  }, [lastQuery, spaces, value]);

  return (
    <Autocomplete
      maxHeight={300}
      items={items}
      onChange={handleChange}
      onQueryChange={handleQueryChange}
      placeholder="Choose from spaces in your organization"
      validationMessage={validationMessage}
      isLoading={isLoading}
      width={inputWidth}
      disabled={disabled}
      emptyListMessage="There are no spaces to choose from"
      noMatchesMessage="No spaces found"
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
  inputWidth: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  validationMessage: PropTypes.string
};
