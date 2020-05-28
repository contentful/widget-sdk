import React, { useEffect, useState, useCallback } from 'react';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Select, Option } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { fetchAndResolve } from 'data/LinkResolver';
import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository';
import { orderBy } from 'lodash';
import { useAsync } from 'core/hooks';

function useFetchAvailableOrgMemberships(orgId, unavailableUserIds) {
  const fetchAvailableOrgMemberships = useCallback(async () => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    // fetch all org memberships
    const includePaths = ['sys.user'];
    const promise = getAllMembershipsWithQuery(orgEndpoint, {
      include: includePaths,
    });

    const allOrgMemberships = await fetchAndResolve(promise, includePaths);
    // get all memberships where the user is not already a member of the team
    const availableOrgMemberships = allOrgMemberships.filter(
      (membership) => !unavailableUserIds.includes(membership.sys.id)
    );
    return orderBy(
      availableOrgMemberships,
      ['sys.user.firstName', 'sys.user.lastName', 'sys.user.email'],
      ['asc', 'asc', 'asc']
    );
  }, [orgId, unavailableUserIds]);

  return useAsync(fetchAvailableOrgMemberships);
}

export function AddToTeam({ orgId, currentTeamMembers, onChange }) {
  const [orgMembership, setOrgMembership] = useState(null);

  const { isLoading, data: availableOrgMemberships } = useFetchAvailableOrgMemberships(
    orgId,
    currentTeamMembers
  );

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
