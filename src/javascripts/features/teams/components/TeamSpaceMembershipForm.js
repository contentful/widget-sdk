/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getAllRoles } from 'access_control/OrganizationMembershipRepository';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor';
import { useAsync } from 'core/hooks';
import { TableCell, TableRow, Button, Notification } from '@contentful/forma-36-react-components';
import { getMembershipRoles } from 'access_control/utils';
import { TeamSpaceMembership as TeamSpaceMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { updateTeamSpaceMembership } from '../services/TeamRepository';

TeamSpaceMembershipForm.propTypes = {
  orgId: PropTypes.string,
  initialMembership: TeamSpaceMembershipPropType,
  onClose: PropTypes.func.isRequired,
};

export function TeamSpaceMembershipForm({ orgId, initialMembership, onClose }) {
  const spaceId = initialMembership.sys.space.sys.id;
  const [selectedRoles, setSelectedRoles] = useState(
    getMembershipRoles(initialMembership).map((r) => r.sys.id)
  );
  const [availableRoles, setAvailableRoles] = useState([]);

  const getRoles = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    return getAllRoles(endpoint);
  }, [orgId]);

  const { isLoading, data } = useAsync(getRoles);

  useEffect(() => {
    data && setAvailableRoles(groupBy(data, 'sys.space.sys.id'));
  }, [data]);

  const setRoles = (roles) => {
    setSelectedRoles(roles);
  };

  const onEdit = async () => {
    const newRoles = availableRoles[spaceId].filter(({ sys: { id } }) =>
      selectedRoles.includes(id)
    );
    const {
      sys: {
        team: { name: teamName },
      },
    } = initialMembership;
    try {
      await updateTeamSpaceMembership(
        createSpaceEndpoint(spaceId),
        initialMembership,
        selectedRoles[0] === ADMIN_ROLE_ID,
        newRoles.map(({ sys: { id } }) => ({
          sys: { id, type: 'Link', linkType: 'Role' },
        }))
      );
      onClose();
      Notification.success('Team role successfully changed');
    } catch (e) {
      Notification.error(`Could not change roles for team ${teamName}`);
    }
  };

  return (
    <TableRow className="space-membership-editor">
      <TableCell>{initialMembership.sys.space.name}</TableCell>
      <TableCell colSpan="2">
        <SpaceRoleEditor
          isDisabled={isLoading}
          options={availableRoles[spaceId]}
          value={selectedRoles}
          onChange={setRoles}
        />
      </TableCell>
      <TableCell colSpan="2" align="right" valign="middle">
        <Button
          testId="add-member-button"
          size="small"
          buttonType="primary"
          onClick={() => onEdit(initialMembership, selectedRoles)}
          disabled={!spaceId || selectedRoles.length === 0}>
          Change role
        </Button>
        <Button testId="cancel-button" size="small" buttonType="naked" onClick={onClose}>
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}
