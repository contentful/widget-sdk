import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  ModalConfirm,
  Typography,
  Paragraph,
  CheckboxField,
  FieldGroup,
  Form,
  Heading
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { inRange } from 'lodash';
import { getModule } from 'NgRegistry';
import LockedField from './LockedField';
import * as ModalLauncher from 'app/common/ModalLauncher';
import { joinAndTruncate } from 'utils/StringUtils';
import IE11DeprecationBanner from 'components/shared/IE11DeprecationBanner';
import RichTextOptions from 'components/field_dialog/RichTextOptions';

const styles = {
  form: css({
    paddingRight: tokens.spacingM
  }),
  flexContainer: css({
    display: 'flex'
  }),
  formGroupHeader: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightMedium
  })
};

const onUnlock = async setDisabled => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      title="Warning! Changing a published field ID"
      confirmLabel="Unlock field for editing"
      intent="primary"
      isShown={isShown}
      onCancel={() => onClose(false)}
      onConfirm={() => onClose(true)}>
      <Typography>
        <Paragraph>
          Changing the ID of this field is immediate and will cause problems for any applications
          currently using it until those applications are updated.
        </Paragraph>
        <Paragraph>
          Your content will not show correctly until you update the field ID in your applications,
          too.
        </Paragraph>
      </Typography>
    </ModalConfirm>
  ));
  if (result) {
    setDisabled(false);
  }
};

const FieldDialogSettingsComponent = ({
  decoratedField,
  contentTypeData,
  locales,
  updateFieldSettings,
  updateValidation,
  fieldTypeLabel,
  richTextOptions,
  onRichTextOptionsChange
}) => {
  const spaceContext = getModule('spaceContext');
  const [field, setFieldSettings] = useState(decoratedField);
  const validationSchema = {
    name: '',
    id: ''
  };
  const [formValidation, setFormValidation] = useState(validationSchema);
  const update = ({ updatedField, validation }) => {
    setFieldSettings(updatedField);
    updateFieldSettings(updatedField);
    const isFormValid = validation.name === '' && validation.id === '';
    updateValidation(isFormValid);
  };
  const validateName = value => {
    if (inRange(value.length, 1, 50)) {
      return '';
    } else {
      return "Please edit the text so it's between 1 and 50 characters long";
    }
  };
  const isUniqueId = newApiName =>
    !contentTypeData.fields.some(field => field.apiName === newApiName);
  const validateId = value => {
    if (!value.match(/^[a-zA-Z0-9_]+$/) || value.length === 0) {
      return 'Please use only letters and numbers';
    } else if (value.match(/^\d/)) {
      return 'Please use a letter as the first character';
    } else if (!isUniqueId(value)) {
      return 'A field with this ID already exists';
    } else {
      return '';
    }
  };
  return (
    <>
      <div className={styles.flexContainer}>
        <Form className={styles.form}>
          <TextField
            value={field.name}
            onChange={({ target: { value } }) => {
              const updatedValidation = { ...formValidation, name: validateName(value) };
              update({ updatedField: { ...field, name: value }, validation: updatedValidation });
              setFormValidation(updatedValidation);
            }}
            labelText="Name"
            testId="content-type-field-name"
            name="content-type-field-name"
            id="content-type-field-name"
            textInputProps={{
              width: 'large',
              type: 'text'
            }}
            validationMessage={formValidation.name}
            required
          />
          <LockedField
            value={field.apiName}
            labelText="Field ID"
            testId="content-type-field-id"
            name="content-type-field-id"
            id="content-type-field-id"
            setValue={value => {
              const updatedValidation = { ...formValidation, id: validateId(value) };
              update({ updatedField: { ...field, apiName: value }, validation: updatedValidation });
              setFormValidation(updatedValidation);
            }}
            isDisabled={!!spaceContext.publishedCTs.get(contentTypeData.sys.id)}
            onUnlock={onUnlock}
            validationMessage={formValidation.id}
            required
          />
          {(decoratedField.canBeTitle || decoratedField.canBeLocalized) && (
            <FieldGroup row={false}>
              <Heading className={styles.formGroupHeader}>Field options</Heading>
              {decoratedField.canBeTitle && (
                <CheckboxField
                  labelText="This field represents the Entry title"
                  onChange={() => update({ ...field, isTitle: !field.isTitle })}
                  checked={field.isTitle}
                  id="field-dialog--is-title"
                  labelIsLight
                />
              )}
              {decoratedField.canBeLocalized && (
                <CheckboxField
                  labelText="Enable localization of this field"
                  onChange={() => update({ ...field, localized: !field.localized })}
                  checked={field.localized}
                  helpText={`All the content can be translated to ${joinAndTruncate(
                    locales,
                    2,
                    'locales'
                  )}`}
                  id="field-dialog--localized"
                  labelIsLight
                />
              )}
            </FieldGroup>
          )}
        </Form>
        {field.isRichTextField && (
          <RichTextOptions
            onChange={onRichTextOptionsChange}
            enabledMarks={richTextOptions.enabledMarks}
            enabledNodeTypes={richTextOptions.enabledNodeTypes}
          />
        )}
      </div>
      {/* TODO: remove when we drop IE11 support */}
      {field.isRichTextField && <IE11DeprecationBanner featureName={fieldTypeLabel} />}
    </>
  );
};

FieldDialogSettingsComponent.propTypes = {
  decoratedField: PropTypes.any,
  contentTypeData: PropTypes.any,
  locales: PropTypes.any,
  updateFieldSettings: PropTypes.func,
  fieldTypeLabel: PropTypes.string,
  richTextOptions: PropTypes.any,
  onRichTextOptionsChange: PropTypes.func,
  updateValidation: PropTypes.func
};

export default FieldDialogSettingsComponent;
