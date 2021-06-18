import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FieldGroup,
  Heading,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import { LockedField } from './LockedField';
import { joinAndTruncate } from 'utils/StringUtils';
import TheLocaleStore from 'services/localeStore';
import { RichTextOptions } from './RichTextOptions';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  flexContainer: css({
    display: 'flex',
    flexWrap: 'nowrap',
  }),
  form: css({
    paddingRight: tokens.spacingM,
    '& > *:not(:first-child)': { marginTop: tokens.spacingM },
  }),
  formGroupHeader: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightMedium,
  }),
};

function isTitleType(fieldType) {
  return fieldType === 'Symbol' || fieldType === 'Text';
}

const SettingsTabComponent = ({
  onBlur,
  onChange,
  fields,
  ctField,
  isNewContentType,
  setRichTextOptions,
  richTextOptions,
}) => {
  const canBeTitle = isTitleType(ctField.type);
  const locales = TheLocaleStore.getPrivateLocales().map((locale) => locale.name);

  return (
    <div className={styles.flexContainer}>
      <div className={styles.form}>
        <TextField
          value={fields.name.value}
          onBlur={() => onBlur('name')}
          onChange={({ target: { value } }) => onChange('name', value)}
          labelText="Name"
          testId="content-type-field-name"
          name="fieldName"
          id="content-type-field-name"
          textInputProps={{
            type: 'text',
            maxLength: 50,
          }}
          required={fields.name.required}
          validationMessage={fields.name.error ? fields.name.error : ''}
          countCharacters
        />
        <LockedField
          value={fields.apiName.value}
          labelText="Field ID"
          testId="content-type-field-id"
          name="apiName"
          id="content-type-field-id"
          onChange={(value) => onChange('apiName', value)}
          onBlur={() => onBlur('apiName')}
          isDisabled={!isNewContentType}
          validationMessage={fields.apiName.error ? fields.apiName.error : ''}
          required
        />
        {
          <FieldGroup row={false}>
            <Heading className={styles.formGroupHeader}>Field options</Heading>
            {canBeTitle && (
              <CheckboxField
                labelText="This field represents the Entry title"
                onChange={() => onChange('isTitle', !fields.isTitle.value)}
                checked={fields.isTitle.value}
                id="field-dialog--is-title"
                labelIsLight
              />
            )}

            <CheckboxField
              labelText="Enable localization of this field"
              onChange={() => onChange('localized', !fields.localized.value)}
              checked={fields.localized.value}
              helpText={`All the content can be translated to ${joinAndTruncate(
                locales,
                2,
                'locales'
              )}`}
              id="field-dialog--localized"
              labelIsLight
            />
          </FieldGroup>
        }
      </div>

      {ctField.type === 'RichText' && (
        <RichTextOptions
          onChange={setRichTextOptions}
          enabledMarks={richTextOptions.enabledMarks}
          enabledNodeTypes={richTextOptions.enabledNodeTypes}
        />
      )}
    </div>
  );
};

SettingsTabComponent.propTypes = {
  fields: PropTypes.object.isRequired,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  ctField: PropTypes.object.isRequired,
  isNewContentType: PropTypes.bool.isRequired,
  setRichTextOptions: PropTypes.func,
  richTextOptions: PropTypes.object,
};

export { SettingsTabComponent };
