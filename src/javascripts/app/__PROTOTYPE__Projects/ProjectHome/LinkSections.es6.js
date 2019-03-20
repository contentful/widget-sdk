import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, TextInput } from '@contentful/forma-36-react-components';
import { without } from 'lodash';

import LinkSection from './LinkSection.es6';

const LinkSections = ({ projectLinkSections, setLinkSections, editing }) => {
  const [header, setHeader] = useState('');

  return (
    <div>
      <h3>Link Sections</h3>
      {editing && (
        <div style={{ display: 'flex' }}>
          <TextInput
            value={header}
            placeholder="create new section"
            onChange={({ target: { value } }) => setHeader(value)}
          />
          <IconButton
            style={{ marginLeft: '.5rem' }}
            label="add"
            iconProps={{ icon: 'PlusCircle' }}
            disabled={header === ''}
            onClick={() =>
              setHeader('') || setLinkSections(projectLinkSections.concat([{ header }]))
            }
          />
        </div>
      )}
      {projectLinkSections.map((section, i) => (
        <LinkSection
          editing={editing}
          key={i}
          section={section}
          onDelete={() => setLinkSections(without(projectLinkSections, section))}
          onChange={updatedSection => {
            const newSections = projectLinkSections.slice();
            newSections.splice(i, 1, updatedSection);
            setLinkSections(newSections);
          }}
        />
      ))}
    </div>
  );
};

LinkSections.propTypes = {
  editing: PropTypes.bool,
  projectLinkSections: PropTypes.arrayOf(PropTypes.shape()),
  setLinkSections: PropTypes.func
};

export default LinkSections;
