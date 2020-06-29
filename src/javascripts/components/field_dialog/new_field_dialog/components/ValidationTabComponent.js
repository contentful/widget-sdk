import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckboxField, Heading } from '@contentful/forma-36-react-components';
import SizeValidation from './validations/SizeValidation';
import RegExpValidation from './validations/RegExpValidation';
import ProhibitRegExpValidation from './validations/ProhibitRegExpValidation';
import ValidationValues from './validations/ValidationValues';
import DateRangeValidation from './validations/DateRangeValidation';
import LinkedEntitiesValidation from './validations/LinkedEntitiesValidation';
import AssetFileSizeValidation from './validations/AssetFileSizeValidation';
import AssetDimmensionsValidation from './validations/AssetDimmensionsValidation';
import { FormFieldsType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';
import styles from './styles';

const ValidationTabComponent = ({
  onBlur,
  onChange,
  fields,
  ctField,
  spaceContext,
  widgetSettings,
  availableWidgets,
}) => {
  return (
    <Fragment>
      {ctField.type !== 'RichText' && (
        <Fragment>
          <CheckboxField
            className={styles.marginBottomS}
            labelText="Required field"
            helpText="You won't be able to publish an entry if this field is empty"
            id="field-validations--required"
            checked={fields.required.value}
            onChange={() => onChange('required', !fields.required.value)}
          />
          {fields.unique && (
            <CheckboxField
              className={styles.marginBottomS}
              labelText={fields.unique.value.name}
              helpText={fields.unique.value.helpText}
              id={`field-validations--${fields.unique.value.type}`}
              checked={fields.unique.value.enabled}
              onChange={(e) =>
                onChange('unique', {
                  ...fields.unique.value,
                  enabled: e.target.checked,
                })
              }
              inputProps={{
                onBlur: () => {},
              }}
            />
          )}
          {fields.size && (
            <SizeValidation
              fieldName="size"
              validation={fields.size}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.regexp && (
            <RegExpValidation
              fieldName="regexp"
              validation={fields.regexp}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.prohibitRegexp && (
            <ProhibitRegExpValidation
              fieldName="prohibitRegexp"
              validation={fields.prohibitRegexp}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.range && (
            <SizeValidation
              fieldName="range"
              validation={fields.range}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.dateRange && (
            <DateRangeValidation
              validation={fields.dateRange}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.in && (
            <ValidationValues
              validation={fields.in}
              onChange={onChange}
              onBlur={onBlur}
              ctFieldType={ctField.type}
              widgetSettings={widgetSettings}
              availableWidgets={availableWidgets}
            />
          )}
          {fields.linkContentType && (
            <LinkedEntitiesValidation
              fieldName={'linkContentType'}
              validation={fields.linkContentType}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
          {fields.assetFileSize && (
            <AssetFileSizeValidation
              validation={fields.assetFileSize}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
          {fields.linkMimetypeGroup && (
            <LinkedEntitiesValidation
              fieldName="linkMimetypeGroup"
              validation={fields.linkMimetypeGroup}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
          {fields.assetImageDimensions && (
            <AssetDimmensionsValidation
              fieldName="assetImageDimensions"
              validation={fields.assetImageDimensions}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
        </Fragment>
      )}
      {ctField.type === 'RichText' && (
        <Fragment>
          <Heading className={styles.marginBottomM}>General validations</Heading>
          <CheckboxField
            className={styles.marginBottomS}
            labelText="Required field"
            helpText="You won't be able to publish an entry if this field is empty"
            id="field-validations--required"
            checked={fields.required.value}
            onChange={() => onChange('required', !fields.required.value)}
          />
          {fields.size && (
            <SizeValidation
              fieldName="size"
              validation={fields.size}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          <Heading className={styles.marginBottomM}>Link to entry</Heading>
          {fields.entryHyperlinkSize && (
            <SizeValidation
              fieldName="entryHyperlinkSize"
              validation={fields.entryHyperlinkSize}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.entryHyperlinkLinkContentType && (
            <LinkedEntitiesValidation
              fieldName="entryHyperlinkLinkContentType"
              validation={fields.entryHyperlinkLinkContentType}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
          <Heading className={styles.marginBottomM}>Embedded block entry</Heading>
          {fields.embeddedEntryBlockSize && (
            <SizeValidation
              fieldName="embeddedEntryBlockSize"
              validation={fields.embeddedEntryBlockSize}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.embeddedEntryBlockLinkContentType && (
            <LinkedEntitiesValidation
              fieldName="embeddedEntryBlockLinkContentType"
              validation={fields.embeddedEntryBlockLinkContentType}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
          <Heading className={styles.marginBottomM}>Embedded asset</Heading>
          {fields.embeddedAssetBlockSize && (
            <SizeValidation
              fieldName="embeddedAssetBlockSize"
              validation={fields.embeddedAssetBlockSize}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          <Heading className={styles.marginBottomM}>Link to asset</Heading>
          {fields.assetHyperlinkSize && (
            <SizeValidation
              fieldName="assetHyperlinkSize"
              validation={fields.assetHyperlinkSize}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          <Heading className={styles.marginBottomM}>Embedded inline entry</Heading>
          {fields.embeddedEntryInlineSize && (
            <SizeValidation
              fieldName="embeddedEntryInlineSize"
              validation={fields.embeddedEntryInlineSize}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
          {fields.embeddedEntryInlineLinkContentType && (
            <LinkedEntitiesValidation
              fieldName="embeddedEntryInlineLinkContentType"
              validation={fields.embeddedEntryInlineLinkContentType}
              onChange={onChange}
              onBlur={onBlur}
              spaceContext={spaceContext}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

ValidationTabComponent.propTypes = {
  fields: PropTypes.shape(FormFieldsType).isRequired,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  ctField: PropTypes.object.isRequired,
  spaceContext: PropTypes.object.isRequired,
  widgetSettings: PropTypes.shape({
    namespace: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    params: PropTypes.object,
  }).isRequired,
  availableWidgets: PropTypes.array.isRequired,
};

export default ValidationTabComponent;