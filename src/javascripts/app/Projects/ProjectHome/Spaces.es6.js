import React from 'react';
import { connect } from 'react-redux';
import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';

export default connect((state, { spaceIds }) => ({
  spaces: Object.values(getCurrentOrgSpaces(state)).filter(({ sys: { id } }) =>
    spaceIds.includes(id)
  )
}))(({ spaces }) => (
  <div className="space-home__spaces">
    <h2>Spaces</h2>
    {spaces.map(({ name, sys: { id } }) => (
      <div key={id}>{name}</div>
    ))}
  </div>
));
