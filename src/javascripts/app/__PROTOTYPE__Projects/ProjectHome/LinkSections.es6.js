import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, Button, Card, Heading } from '@contentful/forma-36-react-components';
import { without } from 'lodash';
import { flow, pullAt } from 'lodash/fp';
import { css } from 'emotion';

import LinkSection from './LinkSection.es6';
import sharedStyles from './sharedStyles.es6';

const styles = {
  card: css({
    display: 'inline-block',
    minWidth: '20rem'
  }),
  createSectionButton: css({
    display: 'inline-block'
  })
};

const LinkSections = ({ projectLinkSections, setLinkSections, editing }) => {
  const [header, setHeader] = useState('');

  return (
    <Card className={styles.card}>
      <Heading className={sharedStyles.heading}>Useful links</Heading>
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
    </Card>
  );
};

LinkSections.propTypes = {
  editing: PropTypes.bool,
  projectLinkSections: PropTypes.arrayOf(PropTypes.shape()),
  setLinkSections: PropTypes.func
};

export default LinkSections;
