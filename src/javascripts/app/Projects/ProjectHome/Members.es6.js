import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import { getUsers } from 'redux/selectors/users.es6';
import { Option, Select, IconButton, TextInput } from '@contentful/forma-36-react-components';

const userIdsToUsers = (userIds, allUsers) =>
  allUsers.filter(({ sys: { id } }) => userIds.includes(id));

export default connect(state => ({
  allUsers: Object.values(getUsers(state))
}))(({ allUsers, projectMemberIds, setProjectMemberIds }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <div className="project-home__members">
      <h2>Members</h2>
      <div className="project-home__member-list">
        {userIdsToUsers(projectMemberIds, allUsers).map(
          ({ firstName, lastName, email, sys: { id } }) => (
            <div key={id} className="project-home__member">
              <span>
                {firstName} {lastName} ({email})
              </span>
              <IconButton
                label="remove"
                iconProps={{ icon: 'Close' }}
                buttonType="negative"
                onClick={() => setProjectMemberIds(without(projectMemberIds, id))}
              />
            </div>
          )
        )}
      </div>
      <div className="project-home__add-member">
        <TextInput
          placeholder="filter users to select..."
          onChange={({ target: { value } }) => setFilter(value)}
        />
        <Select value={selectedUser} onChange={({ target: { value } }) => setSelectedUser(value)}>
          <Option value="" disabled>
            Please select an user
          </Option>
          {allUsers
            .filter(
              ({ firstName, lastName, email, sys: { id } }) =>
                firstName &&
                lastName &&
                email &&
                !projectMemberIds.includes(id) &&
                (filter === '' ||
                  firstName.includes(filter) ||
                  lastName.includes(filter) ||
                  email.includes(filter))
            )
            .map(({ firstName, lastName, email, sys: { id } }) => (
              <Option key={id} value={id}>
                {firstName} {lastName} ({email})
              </Option>
            ))}
        </Select>
        <IconButton
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
  );
});
