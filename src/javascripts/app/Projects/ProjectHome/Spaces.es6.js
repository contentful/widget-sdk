import React from 'react';
import { connect } from 'react-redux';
import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import { Select, Option } from '@contentful/forma-36-react-components';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces }) => (
  <div className="project-home__spaces">
    <h2>Spaces</h2>
    {spaceIdsToSpaces(projectSpaceIds, allSpaces).map(({ name, sys: { id } }) => (
      <div key={id}>{name}</div>
    ))}
    <Select defaultValue="">
      <Option value="" disabled>
        Please select a space
      </Option>
      {allSpaces
        .filter(({ sys: { id } }) => !projectSpaceIds.includes(id))
        .map(({ name, sys: { id } }) => (
          <Option key={id} value={id}>
            {name}
          </Option>
        ))}
    </Select>
  </div>
));
