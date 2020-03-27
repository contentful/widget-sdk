import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  CheckboxField,
  ValidationMessage,
  TextField,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import { toString } from 'lodash';

const LinkedEntitiesValidation = ({
  entitiesTypes: types,
  validation,
  update,
  updateValidationMessageValue,
  errorMessages,
}) => {
  const [entitiesTypes, setEntitiesTypes] = useState(types);
  const [message, setMessage] = useState(validation.message);
  const [checkboxTouched, setCheckboxTouched] = useState(false);

  const onCheckboxChange = (updatedCheckboxItem) => {
    setCheckboxTouched(true);
    const updatedEntitiesTypes = entitiesTypes.map((item) => {
      if (
        (item.id && updatedCheckboxItem.id && item.id === updatedCheckboxItem.id) ||
        (item.name && updatedCheckboxItem.name && item.name === updatedCheckboxItem.name)
      ) {
        return { ...item, selected: !item.selected };
      } else {
        return item;
      }
    });
    setEntitiesTypes(updatedEntitiesTypes);
  };

  useEffect(() => {
    if (checkboxTouched) {
      update(entitiesTypes);
    }
    updateValidationMessageValue(message);
  }, [checkboxTouched, entitiesTypes, message, update, updateValidationMessageValue]);

  return (
    <>
      <List>
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
      {errorMessages[0] && <ValidationMessage>{errorMessages[0]}</ValidationMessage>}
      <TextField
        className={styles.marginTopS}
        name="Custom error message"
        id={`custom-error-message-${validation.nodeType}`}
        labelText="Custom error message"
        value={toString(message)}
        textInputProps={{ type: 'text' }}
        onChange={({ target: { value } }) => setMessage(value)}
      />
    </>
  );
};

LinkedEntitiesValidation.propTypes = {
  entitiesTypes: PropTypes.array.isRequired,
  validation: PropTypes.object.isRequired,
  errorMessages: PropTypes.array.isRequired,
  update: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
};

export default LinkedEntitiesValidation;
