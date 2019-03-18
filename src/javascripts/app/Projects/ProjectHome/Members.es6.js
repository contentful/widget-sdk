import React from 'react';
import { connect } from 'react-redux';
import { getUsers } from 'redux/selectors/users.es6';
import { Option, Select } from '@contentful/forma-36-react-components';

const userIdsToUsers = (userIds, allUsers) =>
  allUsers.filter(({ sys: { id } }) => userIds.includes(id));

export default connect(state => ({
  allUsers: Object.values(getUsers(state))
}))(({ allUsers, projectMemberIds }) => (
  <div className="project-home__members">
    <h2>Members</h2>
    {userIdsToUsers(projectMemberIds, allUsers).map(
      ({ firstName, lastName, email, sys: { id } }) => (
        <div key={id} className="project-home__member">
          {firstName} {lastName} ({email})
        </div>
      )
    )}
    <Select defaultValue="">
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
  </div>
));
