import React, { useEffect, useState, useCallback } from 'react';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Select, Option } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { fetchAndResolve } from 'data/LinkResolver';
import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository';
import { orderBy } from 'lodash';
import { useAsync } from 'core/hooks';

const getAvailableOrgMemberships = (orgId, currentTeamMembers, setData) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);
  const includePaths = ['sys.user', 'sys.createdBy'];
  const data = await fetchAndResolve(
    getAllMembershipsWithQuery(endpoint, {
      include: includePaths,
    }),
    includePaths
  );
  const availableOrgMemberships = data
    ? Object.values(data).filter(({ sys: { id } }) => !currentTeamMembers.includes(id))
    : [];
  const sortedOrgMemberships = orderBy(
    availableOrgMemberships,
    ['sys.user.firstName', 'sys.user.lastName', 'sys.user.email'],
    ['asc', 'asc', 'asc']
  );
  setData(sortedOrgMemberships);
};

export function AddToTeam({ orgId, currentTeamMembers, onChange }) {
  const [orgMembership, setOrgMembership] = useState(null);
  const [availableOrgMemberships, setAvailableOrgMemberships] = useState(null);

  const boundFetch = getAvailableOrgMemberships(
    orgId,
    currentTeamMembers,
    setAvailableOrgMemberships
  );
  const { isLoading } = useAsync(useCallback(boundFetch, []));

  const handleOrgMembershipSelected = (event) => {
    const orgMembership = availableOrgMemberships.find((item) => {
      return item.sys.id === event.target.value;
    });
    setOrgMembership(orgMembership);
  };

  useEffect(() => {
    onChange(orgMembership);
  }, [onChange, orgMembership]);

  return (
    <div data-test-id="new-team-membership">
      <Select
        testId="user-select"
        isDisabled={isLoading}
        onChange={handleOrgMembershipSelected}
        defaultValue="">
        <Option value="" disabled>
          Please select a user
        </Option>
        {availableOrgMemberships &&
          availableOrgMemberships.map(({ sys: { user, id } }) => (
            <Option testId="user-select-option" key={id} value={id}>
              {user.firstName && `${user.firstName} ${user.lastName} `}
              {`<${user.email}>`}
            </Option>
          ))}
      </Select>
    </div>
  );
}

AddToTeam.propTypes = {
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  currentTeamMembers: PropTypes.arrayOf(PropTypes.string),
};
