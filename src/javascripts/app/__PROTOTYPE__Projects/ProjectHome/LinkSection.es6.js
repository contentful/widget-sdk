import React, { useState } from 'react';
import { without } from 'lodash';
import PropTypes from 'prop-types';
import { IconButton, TextInput } from '@contentful/forma-36-react-components';

const LinkSection = ({ section, onChange, onDelete, editing }) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [href, setHref] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', margin: '.5rem 0 .3rem 0', alignItems: 'center' }}>
        <h4 style={{ margin: '0' }}>{section.header}</h4>
        {!adding && editing && (
          <>
            <IconButton
              buttonType="primary"
              style={{ marginLeft: '.5rem' }}
              label="add"
              iconProps={{ icon: 'PlusCircle' }}
              onClick={() => setAdding(true)}
            />
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
        <div style={{ display: 'flex', marginBottom: '.3rem' }}>
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
          <IconButton
            buttonType="positive"
            style={{ marginLeft: '.5rem' }}
            label="confirm"
            iconProps={{ icon: 'CheckCircle' }}
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
            }
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {section.links &&
          section.links.map((link, i) => (
            <div style={{ display: 'flex' }} key={i}>
              <a
                style={{ marginBottom: '.2rem' }}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer">
                {link.text}
              </a>
              {editing && (
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
  onDelete: PropTypes.func
};

export default LinkSection;
