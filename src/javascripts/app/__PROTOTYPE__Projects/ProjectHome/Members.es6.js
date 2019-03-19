import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { Option, Select, IconButton, TextInput } from '@contentful/forma-36-react-components';

const membershipIdsToMembers = (membershipIds, allMemberships) =>
  allMemberships.filter(({ sys: { id } }) => membershipIds.includes(id));

export default connect(state => ({
  allOrgMemberships: Object.values(getOrgMemberships(state)),
  orgId: getOrgId(state)
}))(({ allOrgMemberships, projectMemberIds, setProjectMemberIds, editing, orgId }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <div className="project-home__members">
      <h3>Members</h3>
      {editing && (
        <div className="project-home__add-member">
          <TextInput
            placeholder="filter users to select..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <div style={{ display: 'flex' }}>
            <Select
              value={selectedUser}
              onChange={({ target: { value } }) => setSelectedUser(value)}>
              <Option value="" disabled>
                Please select an user
              </Option>
              {allOrgMemberships
                .filter(
                  ({
                    sys: {
                      id,
                      user: { firstName, lastName, email }
                    }
                  }) =>
                    firstName &&
                    lastName &&
                    email &&
                    !projectMemberIds.includes(id) &&
                    (filter === '' ||
                      firstName.toLowerCase().includes(filter.toLowerCase()) ||
                      lastName.toLowerCase().includes(filter.toLowerCase()) ||
                      email.toLowerCase().includes(filter.toLowerCase()))
                )
                .map(({ sys: { id, user: { firstName, lastName, email } } }) => (
                  <Option key={id} value={id}>
                    {firstName} {lastName} ({email})
                  </Option>
                ))}
            </Select>
            <IconButton
              style={{ marginLeft: '.5rem' }}
              label="add"
              iconProps={{ icon: 'PlusCircle' }}
              onClick={() =>
                setSelectedUser('') ||
                setFilter('') ||
                setProjectMemberIds(projectMemberIds.concat(selectedUser))
              }
            />
          </div>
        </div>
      )}
      <div className="project-home__member-list">
        {membershipIdsToMembers(projectMemberIds, allOrgMemberships).map(
          ({
            sys: {
              id,
              user: { firstName, lastName, email }
            }
          }) => (
            <div key={id} className="project-home__member">
              <a
                href={`/account/organizations/${orgId}/organization_memberships/${id}`}
                target="_blank"
                rel="noopener noreferrer">
                {firstName} {lastName} ({email})
              </a>
              {editing && (
                <IconButton
                  label="remove"
                  iconProps={{ icon: 'Close' }}
                  buttonType="negative"
                  onClick={() => setProjectMemberIds(without(projectMemberIds, id))}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
});
