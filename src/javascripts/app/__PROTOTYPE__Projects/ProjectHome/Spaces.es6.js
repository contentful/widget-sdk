import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import { Select, Option, IconButton, TextInput } from '@contentful/forma-36-react-components';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces, setProjectSpaceIds, editing }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <div className="project-home__spaces">
      <h3>Spaces</h3>
      {editing && (
        <div className="project-home__add-space">
          <TextInput
            placeholder="filter spaces to select..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <div style={{ display: 'flex' }}>
            <Select
              value={selectedSpace}
              onChange={({ target: { value } }) => setSelectedSpace(value)}>
              <Option value="" disabled>
                Please select a space
              </Option>
              {allSpaces
                .filter(
                  ({ name, sys: { id } }) =>
                    !projectSpaceIds.includes(id) &&
                    (filter === '' || name.toLowerCase().includes(filter.toLowerCase()))
                )
                .map(({ name, sys: { id } }) => (
                  <Option key={id} value={id} className="project-home__space">
                    {name}
                  </Option>
                ))}
            </Select>
            <IconButton
              style={{ marginLeft: '.5rem' }}
              label="add"
              iconProps={{ icon: 'PlusCircle' }}
              onClick={() =>
                setSelectedSpace('') || setProjectSpaceIds(projectSpaceIds.concat(selectedSpace))
              }
            />
          </div>
        </div>
      )}
      <div className="project-home__space-list">
        {spaceIdsToSpaces(projectSpaceIds, allSpaces).map(({ name, sys: { id } }) => (
          <div key={id} className="project-home__space">
            <div key={id}>{name}</div>
            {editing && (
              <IconButton
                label="remove"
                iconProps={{ icon: 'Close' }}
                buttonType="negative"
                onClick={() => setProjectSpaceIds(without(projectSpaceIds, id))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
