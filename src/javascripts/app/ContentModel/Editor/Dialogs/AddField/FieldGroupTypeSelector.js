import React from 'react';
import PropTypes from 'prop-types';
import {
  RadioButtonField,
  CheckboxField,
  Note,
  HelpText,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  spacer: css({
    flexBasis: '60%',
  }),
  divider: css({
    flexShrink: 0,
    alignSelf: 'stretch',
    borderLeft: `1px solid ${tokens.colorElementMid}`,
    flexBasis: tokens.spacingL,
    marginLeft: tokens.spacingL,
  }),
  fieldSplit: css({
    height: tokens.spacingM,
  }),
  hint: css({
    marginLeft: tokens.spacingL,
  }),
  hintSecondary: css({
    marginLeft: tokens.spacingL,
    marginTop: tokens.spacingXs,
    fontSize: tokens.fontSizeS,
  }),
  note: css({
    marginTop: tokens.spacingL,
  }),
};

const ReferenceGroupOptions = ({ setList, isList }) => {
  return (
    <React.Fragment>
      <div data-test-id="reference_group_options">
        <RadioButtonField
          labelText="One reference"
          labelIsLight
          onChange={() => setList(false)}
          checked={!isList}
          name="oneReference"
          id="add-field-form-field-is-single"
        />
        <HelpText className={styles.hint}>
          This is similar to one-to-one relationships between objects in a database. <br /> For
          example, a blog post can reference its only author
        </HelpText>
        <div className={styles.fieldSplit}></div>
        <RadioButtonField
          labelText="Many references"
          labelIsLight
          onChange={() => setList(true)}
          checked={isList}
          name="manyReferences"
          id="add-field-form-field-is-list"
        />
        <HelpText className={styles.hint}>
          This is similar to one-to-many relationships between objects in a database.
          <br />
          For example, a blog post can reference its several authors
        </HelpText>
        <HelpText className={styles.hintSecondary}>
          API response will include a separate block for each field
        </HelpText>
      </div>
      <Note className={styles.note}>These settings cannot be changed later.</Note>
    </React.Fragment>
  );
};

ReferenceGroupOptions.propTypes = {
  setList: PropTypes.func.isRequired,
  isList: PropTypes.bool.isRequired,
};

const MediaGroupOptions = ({ setList, isList }) => {
  return (
    <React.Fragment>
      <div data-test-id="media_group_options">
        <RadioButtonField
          labelText="One file"
          labelIsLight
          onChange={() => setList(false)}
          checked={!isList}
          name="oneFile"
          id="add-field-form__field-is-single"
        />
        <HelpText className={styles.hint}>
          Select this if there is only one thing to store. <br />
          For example, a single photo or one PDF file
        </HelpText>
        <div className={styles.fieldSplit}></div>
        <RadioButtonField
          labelText="Many files"
          labelIsLight
          onChange={() => setList(true)}
          checked={isList}
          name="manyFiles"
          id="add-field-form__field-is-list"
        />
        <HelpText className={styles.hint}>
          Select this if there are several things to be stored. <br />
          For example, several photos or PDF files
        </HelpText>
        <HelpText className={styles.hintSecondary}>
          API response will include a separate block for each field
        </HelpText>
      </div>
      <Note className={styles.note}>These settings cannot be changed later.</Note>
    </React.Fragment>
  );
};

MediaGroupOptions.propTypes = {
  setList: PropTypes.func.isRequired,
  isList: PropTypes.bool.isRequired,
};

const NumberGroupOptions = ({ selectNewFieldType, fieldType }) => {
  return (
    <React.Fragment>
      <div data-test-id="number_group_options">
        <RadioButtonField
          labelText="Integer"
          labelIsLight
          name="Integer"
          onChange={() => selectNewFieldType(0)}
          checked={fieldType.name === 'Integer'}
          id="field-type-integer"
          helpText="1, 2, 3, 5, 8, 13, &hellip;"
        />
        <div className={styles.fieldSplit}></div>
        <RadioButtonField
          labelText="Decimal"
          labelIsLight
          onChange={() => selectNewFieldType(1)}
          checked={fieldType.name === 'Number'}
          id="field-type-decimal"
          name="Decimal"
          helpText="3.14159265389"
        />
      </div>
      <Note className={styles.note}>These settings cannot be changed later.</Note>
    </React.Fragment>
  );
};

NumberGroupOptions.propTypes = {
  selectNewFieldType: PropTypes.func.isRequired,
  fieldType: PropTypes.object.isRequired, // add details
};

const TextGroupOptions = ({ selectNewFieldType, fieldType, setList, isList }) => {
  return (
    <React.Fragment>
      <div
        data-test-id="text_group_options"
        className={css({
          display: 'flex',
        })}>
        <div
          className={css({
            flexBasis: '50%',
            flexGrow: 0,
          })}>
          <RadioButtonField
            id="field-type-short"
            name="Symbol"
            checked={fieldType.name === 'Symbol'}
            onChange={() => selectNewFieldType(0)}
            labelText="Short text, exact search"
            labelIsLight
          />
          <HelpText className={styles.hint}>
            Enables sorting
            <br />
            Maximum 255 characters
          </HelpText>
          <HelpText className={styles.hintSecondary}>
            Use for titles, names, tags, URLs, e-mail addresses
          </HelpText>
          <div className={styles.fieldSplit}></div>
          <RadioButtonField
            id="field-type-long"
            name="Text"
            onChange={() => selectNewFieldType(1)}
            checked={fieldType.name === 'Text'}
            labelIsLight
            labelText="Long text, full-text search"
          />
          <HelpText className={styles.hint}>
            No sorting
            <br />
            Maximum 50k characters
          </HelpText>
          <HelpText className={styles.hintSecondary}>
            Use for descriptions, text paragraphs, articles
          </HelpText>
        </div>
        {fieldType.hasListVariant ? (
          <React.Fragment>
            <div className={styles.divider}></div>
            <div className={css({ flexGrow: 0, flexBasis: '50%' })}>
              <CheckboxField
                labelText="List"
                labelIsLight
                id="add-field-form__field-is-list"
                name="isList"
                checked={isList}
                onChange={() => {
                  setList(!isList);
                }}
              />
              <HelpText className={styles.hint}>
                Select this if there is more than one value to store, like several names or a list
                of ingredients
              </HelpText>
              <HelpText className={styles.hintSecondary}>
                API response will include a separate block for each field
              </HelpText>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className={styles.spacer} />
          </React.Fragment>
        )}
      </div>
      <Note className={styles.note}>These settings cannot be changed later.</Note>
    </React.Fragment>
  );
};

TextGroupOptions.propTypes = {
  selectNewFieldType: PropTypes.func.isRequired,
  fieldType: PropTypes.object.isRequired, // add details
  setList: PropTypes.func.isRequired,
  isList: PropTypes.bool.isRequired,
};

export const FieldGroupTypeSelector = ({
  fieldGroupName,
  selectNewFieldType,
  fieldType,
  setList,
  isList,
}) => {
  switch (fieldGroupName) {
    case 'text':
      return (
        <TextGroupOptions
          {...{
            selectNewFieldType,
            fieldType,
            setList,
            isList,
          }}
        />
      );

    case 'number':
      return (
        <NumberGroupOptions
          {...{
            selectNewFieldType,
            fieldType,
          }}
        />
      );

    case 'media':
      return (
        <MediaGroupOptions
          {...{
            setList,
            isList,
          }}
        />
      );

    case 'reference':
      return (
        <ReferenceGroupOptions
          {...{
            setList,
            isList,
          }}
        />
      );

    default:
      return null;
  }
};

FieldGroupTypeSelector.propTypes = {
  fieldGroupName: PropTypes.string.isRequired,
  selectNewFieldType: PropTypes.func.isRequired,
  fieldType: PropTypes.object.isRequired, // add details
  setList: PropTypes.func.isRequired,
  isList: PropTypes.bool.isRequired,
};
