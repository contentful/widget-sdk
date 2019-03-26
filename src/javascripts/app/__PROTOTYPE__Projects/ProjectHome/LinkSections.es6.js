import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, Button } from '@contentful/forma-36-react-components';
import { without } from 'lodash';
import { flow, pullAt } from 'lodash/fp';
import { css } from 'emotion';

import LinkSection from './LinkSection.es6';

const styles = {
  createSectionButton: css({
    width: '15rem',
    marginLeft: '.5rem'
  })
};

const LinkSections = ({ projectLinkSections, setLinkSections, editing }) => {
  const [header, setHeader] = useState('');

  return (
    <div>
      <h3>Useful links</h3>
      {editing && (
        <div style={{ display: 'flex' }}>
          <TextInput
            value={header}
            placeholder="create new section"
            onChange={({ target: { value } }) => setHeader(value)}
          />
          <Button
            className={styles.createSectionButton}
            disabled={header === ''}
            buttonType="primary"
            size="small"
            onClick={() =>
              setHeader('') || setLinkSections(projectLinkSections.concat([{ header }]))
            }>
            Create section
          </Button>
        </div>
      )}
      {projectLinkSections.map((section, i) => (
        <LinkSection
          editing={editing}
          key={i}
          section={section}
          onUp={() =>
            i > 0 &&
            setLinkSections(
              flow(
                pullAt(i),
                withoutSection => [
                  ...withoutSection.slice(0, i - 1),
                  section,
                  ...withoutSection.slice(i - 1)
                ]
              )(projectLinkSections)
            )
          }
          onDown={() =>
            i < projectLinkSections.length - 1 &&
            setLinkSections(
              flow(
                pullAt(i),
                withoutSection => [
                  ...withoutSection.slice(0, i + 1),
                  section,
                  ...withoutSection.slice(i + 1)
                ]
              )(projectLinkSections)
            )
          }
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
