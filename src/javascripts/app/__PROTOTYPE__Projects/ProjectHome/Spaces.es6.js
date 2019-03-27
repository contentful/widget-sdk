import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import { sortBy, flow, filter as ldFilter, map } from 'lodash/fp';
import { css } from 'emotion';
import {
  Select,
  Option,
  IconButton,
  TextInput,
  Button,
  Card,
  Heading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import sharedStyles from './sharedStyles.es6';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

const sort = sortBy(['name']);

const styles = {
  card: css({
    display: 'inline-block',
    minWidth: '20rem',
    flex: 1,
    marginRight: tokens.spacingM
  }),
  addSpaceButton: css({
    width: '9rem'
  })
};

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces, setProjectSpaceIds, editing }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <Card className={styles.card}>
      <Heading className={sharedStyles.heading}>Spaces</Heading>
      {editing && (
        <div>
          <TextInput
            placeholder="filter spaces to select..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <div>
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
      <div>
        {sort(spaceIdsToSpaces(projectSpaceIds, allSpaces)).map(({ name, sys: { id } }) => (
          <div key={id}>
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
