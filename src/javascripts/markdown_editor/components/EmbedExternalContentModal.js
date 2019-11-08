import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Modal,
  HelpText,
  TextLink,
  TextField,
  RadioButtonField,
  CheckboxField,
  Button,
  Form
} from '@contentful/forma-36-react-components';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import { isValidUrl } from 'utils/StringUtils.es6';

const styles = {
  widthFiledGroup: css({
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'flex-start'
  }),
  radioButtonGroup: css({
    display: 'inline-flex',
    alignItems: 'flex-start',
    paddingTop: tokens.spacingXl
  }),
  radioButton: css({
    marginLeft: tokens.spacingM
  }),
  controlsContainer: css({
    display: 'flex',
    button: {
      marginRight: tokens.spacingM
    }
  })
};

const makeEmbedlyLink = ({ url, width, selectedUnit, attachSocial }) => {
  const s = { percent: '%', px: 'px' };
  return [
    '<a href="' + url + '" class="embedly-card" ',
    'data-card-width="' + width + s[selectedUnit] + '" ',
    'data-card-controls="' + (attachSocial ? '1' : '0') + '"',
    '>Embedded content: ' + url + '</a>'
  ].join('');
};

const isWidthValid = (width, unit) => (unit === 'percent' ? Number(width) <= 100 : true);

const EmbedExternalContentModal = ({ isShown, onClose }) => {
  const [url, setUrl] = useState('https://');
  const [urlIsValid, setUrlValidity] = useState(true);
  const [width, setWidth] = useState('100');
  const [selectedUnit, setUnit] = useState('percent');
  const [attachSocial, setAttachSocial] = useState(false);

  return (
    <Modal
      allowHeightOverflow
      title="Embed external content"
      isShown={isShown}
      onClose={() => onClose(false)}>
      <Form>
        <TextField
          value={url}
          type="url"
          name="external-link-url"
          onChange={({ target: { value } }) => {
            setUrl(value);
            setUrlValidity(isValidUrl(value));
          }}
          labelText="Content URL"
          id="external-link-url-field"
          helpText="Include protocol (e.g. https://)"
          textInputProps={{
            testId: 'external-link-url-field',
            placeholder: 'https://example.com'
          }}
          required
          validationMessage={urlIsValid ? '' : 'URL is invalid'}
        />
        <TextLink href="http://embed.ly/providers" target="_blank" rel="noopener noreferrer">
          Supported sources
        </TextLink>
        <div className={styles.widthFiledGroup}>
          <TextField
            value={width}
            id="embedded-content-width"
            name="embedded-content-width"
            onChange={({ target: { value } }) => setWidth(value)}
            labelText="Width"
            textInputProps={{
              testId: 'embedded-content-width',
              type: 'number',
              width: 'small'
            }}
            required
            validationMessage={
              isWidthValid(width, selectedUnit) ? '' : 'Should be equal or less then 100'
            }
          />
          <div className={styles.radioButtonGroup}>
            <RadioButtonField
              className={styles.radioButton}
              id="unit-option-percent"
              checked={selectedUnit === 'percent'}
              labelText="percent"
              value="percent"
              onChange={() => setUnit('percent')}
              labelIsLight
            />
            <RadioButtonField
              className={styles.radioButton}
              id="unit-option-pixels"
              checked={selectedUnit === 'px'}
              labelText="pixels"
              value="pixels"
              onChange={() => setUnit('px')}
              labelIsLight
            />
          </div>
        </div>
        <CheckboxField
          value="Yes"
          testId="attach-social-checkbox"
          id="attach-social-checkbox"
          name="attach-social-checkbox"
          checked={attachSocial}
          onChange={() => setAttachSocial(!attachSocial)}
          labelText="Attach social sharing links to this element"
          labelIsLight
        />
        <HelpText>
          To enable this embedded content in your application make sure to add the&nbsp;
          <TextLink
            href="http://embed.ly/docs/products/cards"
            target="_blank"
            rel="noopener noreferrer">
            Embedly&apos;s platform.js
          </TextLink>
          &nbsp;on your development environment
        </HelpText>
        <EmbedlyPreview previewUrl={url} />
      </Form>
      <div className={styles.controlsContainer}>
        <Button
          testId="embed-external-confirm"
          onClick={() => onClose(makeEmbedlyLink({ url, width, selectedUnit, attachSocial }))}
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

EmbedExternalContentModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default EmbedExternalContentModal;
