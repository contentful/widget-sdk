import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import { getUsers } from 'redux/selectors/users.es6';
import { Option, Select, IconButton } from '@contentful/forma-36-react-components';

const userIdsToUsers = (userIds, allUsers) =>
  allUsers.filter(({ sys: { id } }) => userIds.includes(id));

export default connect(state => ({
  allUsers: Object.values(getUsers(state))
}))(({ allUsers, projectMemberIds, setProjectMemberIds }) => {
  const [selectedUser, setSelectedUser] = useState('');

  return (
    <div className="project-home__members">
      <h2>Members</h2>
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
      <div className="project-home__add-member">
        <Select value={selectedUser} onChange={({ target: { value } }) => setSelectedUser(value)}>
          <Option value="" disabled>
            Please select an user
          </Option>
          {allUsers
            .filter(({ firstName, sys: { id } }) => firstName && !projectMemberIds.includes(id))
            .map(({ firstName, lastName, sys: { id } }) => (
              <Option key={id} value={id}>
                {firstName} {lastName}
              </Option>
            ))}
        </Select>
        <IconButton
          label="add"
          iconProps={{ icon: 'PlusCircle' }}
          onClick={() =>
            setSelectedUser('') || setProjectMemberIds(projectMemberIds.concat(selectedUser))
          }
        />
      </div>
    </div>
  );
});
