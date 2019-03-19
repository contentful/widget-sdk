import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, TextInput } from '@contentful/forma-36-react-components';

const LinkSection = ({ section, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [href, setHref] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', margin: '.5rem 0 .3rem 0', alignItems: 'center' }}>
        <h4 style={{ margin: '0' }}>{section.header}</h4>
        {!adding && (
          <IconButton
            buttonType="primary"
            style={{ marginLeft: '.5rem' }}
            label="add"
            iconProps={{ icon: 'PlusCircle' }}
            onClick={() => setAdding(true)}
          />
        )}
      </div>
      {adding && (
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
          section.links.map(({ text, href }, i) => (
            <a
              style={{ marginBottom: '.2rem' }}
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer">
              {text}
            </a>
          ))}
      </div>
    </div>
  );
};

LinkSection.propTypes = {
  section: PropTypes.shape(),
  onChange: PropTypes.func
};

export default LinkSection;
