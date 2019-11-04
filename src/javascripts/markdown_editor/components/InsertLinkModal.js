import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import startsWith from 'lodash/startsWith';
import { Modal, TextField, Form, Button } from '@contentful/forma-36-react-components';

const styles = {
  controlsContainer: css({
    display: 'flex',
    button: {
      marginRight: tokens.spacingM
    }
  })
};

const InsertLinkModal = ({ selectedText, isShown, onClose }) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('https://');
  const [title, setTitle] = useState('');
  const onInsert = ({ url, text, title }) => onClose({ url, text, title });
  const isValidURL = url => startsWith(url, 'http://') || startsWith(url, 'https://');
  return (
    <Modal title="Insert link" isShown={isShown} onClose={() => onClose(false)}>
      <Form onSubmit={() => onInsert({ url, text, title })}>
        {!selectedText && (
          <TextField
            value={text}
            name="link-text"
            id="link-text-field"
            labelText="Link text"
            onChange={({ target: { value } }) => setText(value)}
            textInputProps={{
              testId: 'link-text-field'
            }}
          />
        )}
        <TextField
          value={url}
          name="target-url"
          id="target-url-field"
          labelText="Target URL"
          helpText="Include protocol (e.g. https://)"
          onChange={({ target: { value } }) => setUrl(value)}
          validationMessage={!isValidURL(url) ? 'Protocol is missing' : ''}
          textInputProps={{
            type: 'url',
            placeholder: 'https://example.com',
            maxLength: '2100',
            testId: 'target-url-field'
          }}
        />
        <TextField
          value={title}
          name="link-title"
          id="link-title-field"
          labelText="Link title"
          helpText="Recommended for accessibility"
          onChange={({ target: { value } }) => setTitle(value)}
          textInputProps={{
            testId: 'link-title-field'
          }}
        />
      </Form>
      <div className={styles.controlsContainer}>
        <Button
          testId="insert-link-confirm"
          onClick={() => onInsert({ url, text, title })}
          buttonType="positive">
          Insert
        </Button>
        <Button onClick={() => onClose(false)} buttonType="muted">
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

InsertLinkModal.propTypes = {
  selectedText: PropTypes.string,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default InsertLinkModal;
