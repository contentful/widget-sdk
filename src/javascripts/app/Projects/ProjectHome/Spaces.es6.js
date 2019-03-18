import React, { useState } from 'react';
import { connect } from 'react-redux';
import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import { Select, Option, IconButton } from '@contentful/forma-36-react-components';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces, setProjectSpaceIds }) => {
  const [selectedSpace, setSelectedSpace] = useState('');

  return (
    <div className="project-home__spaces">
      <h2>Spaces</h2>
      {spaceIdsToSpaces(projectSpaceIds, allSpaces).map(({ name, sys: { id } }) => (
        <div key={id}>{name}</div>
      ))}
      <div className="project-home__add-space">
        <Select value={selectedSpace} onChange={({ target: { value } }) => setSelectedSpace(value)}>
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
        <IconButton
          label="add member"
          iconProps={{ icon: 'PlusCircle' }}
          onClick={() =>
            setSelectedSpace('') || setProjectSpaceIds(projectSpaceIds.concat(selectedSpace))
          }
        />
      </div>
    </div>
  );
});
