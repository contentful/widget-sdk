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
import FolderIcon from 'svg/folder.es6';

import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import sharedStyles from './sharedStyles.es6';

const spaceIdsToSpaces = (projectSpaceIds, allSpaces) =>
  allSpaces.filter(({ sys: { id } }) => projectSpaceIds.includes(id));

const sort = sortBy(['name']);

const styles = {
  card: css({
    flex: 1,
    height: 'fit-content',
    marginRight: tokens.spacingM
  }),
  addSpaceButton: css({
    minWidth: 'fit-content'
  })
};

export default connect(state => ({
  allSpaces: Object.values(getCurrentOrgSpaces(state))
}))(({ projectSpaceIds, allSpaces, setProjectSpaceIds, editing }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <Card className={`${sharedStyles.card} ${styles.card}`}>
      <Heading className={sharedStyles.heading}>{`Spaces (${projectSpaceIds.length}`}</Heading>
      {editing && (
        <div>
          <TextInput
            className={css({ marginBottom: tokens.spacingS })}
            placeholder="filter spaces to select..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <div className={css({ display: 'flex', justifyItems: 'center' })}>
            <Select
              className={css({ marginRight: tokens.spacingM })}
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
      <div className={sharedStyles.list}>
        {sort(spaceIdsToSpaces(projectSpaceIds, allSpaces)).map(({ name, sys: { id } }) => (
          <div key={id} className={sharedStyles.listItem}>
            <div className={css({ display: 'flex' })}>
              <div className={css({ svg: { marginRight: tokens.spacingXs, fill: '#a9b9c0' } })}>
                <FolderIcon />
              </div>
              <a href={`/spaces/${id}/home`} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            </div>
            <div className={css({ flex: 1 })} />
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
