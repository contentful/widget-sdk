import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  CheckboxField,
  ValidationMessage,
  TextField,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import { toString, includes, map } from 'lodash';
import { ValidationFieldType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';
import mimetype from '@contentful/mimetype';

const LinkedEntitiesValidation = ({ fieldName, validation, onChange, onBlur, spaceContext }) => {
  const { name, helpText, message, settings, enabled } = validation.value;

  const entitiesTypes = useMemo(() => {
    const isSelected = (id) => {
      return includes(settings, id);
    };
    const decorateAssetsTypes = (label, name) => {
      return {
        id: name,
        label: label,
        selected: isSelected(name),
      };
    };

    const decorateContentType = (ct) => {
      const id = ct.sys.id;
      return {
        id: id,
        selected: isSelected(id),
        name: ct.name || 'Untitled',
      };
    };
    return fieldName === 'linkMimetypeGroup'
      ? map(mimetype.getGroupNames(), decorateAssetsTypes)
      : spaceContext.publishedCTs.getAllBare().map(decorateContentType);
  }, [spaceContext, fieldName, settings]);

  const onCheckboxChange = (updatedCheckboxItem) => {
    const updatedEntitiesTypes = entitiesTypes.map((item) => {
      if (
        (item.id && updatedCheckboxItem.id && item.id === updatedCheckboxItem.id) ||
        (item.name && updatedCheckboxItem.name && item.name === updatedCheckboxItem.name)
      ) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    const selectedIds = updatedEntitiesTypes.filter((i) => i.selected).map((i) => i.id);
    onChange(fieldName, { ...validation.value, settings: selectedIds });
  };
  const onChangeMessage = (message) => onChange(fieldName, { ...validation.value, message });

  return (
    <div>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations--${fieldName}`}
        checked={enabled}
        onChange={(e) =>
          onChange(fieldName, {
            ...validation.value,
            enabled: e.target.checked,
          })
        }
      />
      {enabled && (
        <>
          <List className={styles.inlineList}>
            {entitiesTypes.map((item, index) => (
              <ListItem className={styles.inlineListItems} key={index}>
                <CheckboxField
                  name={item.label || item.name}
                  id={item.id ? `${item.id}-${validation.nodeType}` : `${item.name}`}
                  labelText={item.label || item.name}
                  checked={item.selected}
                  onChange={() => onCheckboxChange(item)}
                  labelIsLight
                />
              </ListItem>
            ))}
          </List>
          {validation.error && (
            <ValidationMessage className={styles.validationMessage}>
              {validation.error}
            </ValidationMessage>
          )}
          <TextField
            className={styles.helpTextInput}
            name="Custom error message"
            id={`custom-error-message-${validation.nodeType}`}
            labelText="Custom error message"
            value={toString(message)}
            textInputProps={{ type: 'text' }}
            onChange={({ target: { value } }) => onChangeMessage(value)}
            onBlur={() => onBlur(fieldName)}
          />
        </>
      )}
    </div>
  );
};

LinkedEntitiesValidation.propTypes = {
  fieldName: PropTypes.string,
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  spaceContext: PropTypes.object.isRequired,
};

export default LinkedEntitiesValidation;
