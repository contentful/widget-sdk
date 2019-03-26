import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import { sortBy, flow, filter as ldFilter, map } from 'lodash/fp';
import { css } from 'emotion';

import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import {
  Select,
  Option,
  IconButton,
  TextInput,
  Button,
  Card,
  Heading
} from '@contentful/forma-36-react-components';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

const sort = sortBy(['name']);

const styles = {
  addSpaceButton: css({
    width: '9rem',
    marginLeft: '.5rem'
  })
};

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces, setProjectSpaceIds, editing }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <Card className="project-home__spaces">
      <Heading>Spaces</Heading>
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
              {flow(
                ldFilter(
                  ({ name, sys: { id } }) =>
                    !projectSpaceIds.includes(id) &&
                    (filter === '' || name.toLowerCase().includes(filter.toLowerCase()))
                ),
                sort,
                map(({ name, sys: { id } }) => (
                  <Option key={id} value={id} className="project-home__space">
                    {name}
                  </Option>
                ))
              )(allSpaces)}
            </Select>
            <Button
              className={styles.addSpaceButton}
              disabled={selectedSpace === ''}
              buttonType="primary"
              size="small"
              onClick={() =>
                setSelectedSpace('') || setProjectSpaceIds(projectSpaceIds.concat(selectedSpace))
              }>
              Add Space
            </Button>
          </div>
        </div>
      )}
      <div className="project-home__space-list">
        {sort(spaceIdsToSpaces(projectSpaceIds, allSpaces)).map(({ name, sys: { id } }) => (
          <div key={id} className="project-home__space">
            <div key={id}>
              <a href={`/spaces/${id}/home`} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            </div>
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
    </Card>
  );
});
