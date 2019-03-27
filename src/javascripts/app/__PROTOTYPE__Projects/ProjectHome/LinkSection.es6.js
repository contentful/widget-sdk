import React, { useState } from 'react';
import { without } from 'lodash';
import { flow, pullAt } from 'lodash/fp';
import PropTypes from 'prop-types';
import {
  IconButton,
  TextInput,
  Button,
  SectionHeading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import sharedStyles from './sharedStyles.es6';

const styles = {
  section: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  header: css({
    display: 'flex',
    minWidth: '19rem',
    width: 'fit-content',
    marginBottom: tokens.spacingS
  }),
  addLinkButton: css({
    display: 'inline-block',
    marginLeft: tokens.spacingS,
    marginRight: tokens.spacingS
  }),
  createLinkButton: css({
    display: 'inline-block'
  }),
  link: css({
    display: 'flex',
    minWidth: '10rem',
    width: 'fit-content'
  })
};

const LinkSection = ({ section, onChange, onDelete, onUp, onDown, editing }) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [href, setHref] = useState('');

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <SectionHeading>{section.header}</SectionHeading>
        {!adding && editing && (
          <>
            <div className={css({ flex: 1 })} />
            <IconButton
              label="up"
              iconProps={{ icon: 'ArrowUp' }}
              buttonType="primary"
              onClick={onUp}
            />
            <IconButton
              label="down"
              iconProps={{ icon: 'ArrowDown' }}
              buttonType="primary"
              onClick={onDown}
            />
            <Button
              className={styles.addLinkButton}
              buttonType="primary"
              size="small"
              onClick={() => setAdding(true)}>
              Add link
            </Button>
            <IconButton
              label="remove"
              iconProps={{ icon: 'Close' }}
              buttonType="negative"
              onClick={onDelete}
            />
          </>
        )}
      </div>
      {editing && adding && (
        <div>
          <TextInput
            placeholder="link text"
            value={text}
            onChange={({ target: { value } }) => setText(value)}
          />
          <TextInput
            placeholder="link href"
            value={href}
            onChange={({ target: { value } }) => setHref(value)}
          />
          <Button
            className={styles.createLinkButton}
            buttonType="primary"
            size="small"
            disabled={!(text && href)}
            onClick={() =>
              setText('') ||
              setHref('') ||
              setAdding(false) ||
              onChange({
                ...section,
                links: (section.links || []).concat({
                  text,
                  href: href.includes('http') ? href : `http://${href}`
                })
              })
            }>
            Create link
          </Button>
          <IconButton
            iconProps={{ icon: 'Close' }}
            buttonType="negative"
            onClick={() => setText('') || setHref('') || setAdding(false)}
          />
        </div>
      )}
      <div className={sharedStyles.denseList}>
        {section.links &&
          section.links.map((link, i) => (
            <div className={styles.link} key={i}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
              <div className={css({ flex: 1 })} />
              {editing && !adding && (
                <>
                  <IconButton
                    label="up"
                    iconProps={{ icon: 'ArrowUp' }}
                    buttonType="primary"
                    disabled={i === 0}
                    onClick={() =>
                      onChange({
                        ...section,
                        links: flow(
                          pullAt(i),
                          withoutLink => [
                            ...withoutLink.slice(0, i - 1),
                            link,
                            ...withoutLink.slice(i - 1)
                          ]
                        )(section.links)
                      })
                    }
                  />
                  <IconButton
                    label="down"
                    iconProps={{ icon: 'ArrowDown' }}
                    buttonType="primary"
                    disabled={i === section.links.length - 1}
                    onClick={() =>
                      onChange({
                        ...section,
                        links: flow(
                          pullAt(i),
                          withoutLink => [
                            ...withoutLink.slice(0, i + 1),
                            link,
                            ...withoutLink.slice(i + 1)
                          ]
                        )(section.links)
                      })
                    }
                  />
                  <IconButton
                    label="remove"
                    iconProps={{ icon: 'Close' }}
                    buttonType="negative"
                    onClick={() =>
                      onChange({
                        ...section,
                        links: without(section.links, link)
                      })
                    }
                  />
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

LinkSection.propTypes = {
  editing: PropTypes.bool,
  section: PropTypes.shape(),
  onChange: PropTypes.func,
  onUp: PropTypes.func,
  onDown: PropTypes.func,
  onDelete: PropTypes.func
};

export default LinkSection;
