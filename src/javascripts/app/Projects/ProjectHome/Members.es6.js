import React from 'react';
import { connect } from 'react-redux';
import { getUsers } from 'redux/selectors/users.es6';

export default connect((state, { memberIds }) => ({
  members: Object.values(getUsers(state)).filter(({ sys: { id } }) => memberIds.includes(id))
}))(({ members }) => (
  <div className="project-home__members">
    <h2>Members</h2>
    {members.map(({ firstName, lastName, email, sys: { id } }) => (
      <div key={id} className="project-home__member">
        {firstName} {lastName} ({email})
      </div>
    ))}
  </div>
));
