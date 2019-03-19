import React, { useState } from 'react';
import PropTypes from 'prop-types';

import LinkSection from './LinkSection.es6';
import { IconButton, TextInput } from '@contentful/forma-36-react-components';

const LinkSections = ({ projectLinkSections, setLinkSections }) => {
  const [header, setHeader] = useState('');

  return (
    <div>
      <h3>Link Sections</h3>
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
          onClick={() => setHeader('') || setLinkSections(projectLinkSections.concat([{ header }]))}
        />
      </div>
      {projectLinkSections.map((section, i) => (
        <LinkSection
          key={i}
          section={section}
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
  projectLinkSections: PropTypes.arrayOf(PropTypes.shape()),
  setLinkSections: PropTypes.func
};

export default LinkSections;
