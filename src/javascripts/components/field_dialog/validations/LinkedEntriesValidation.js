import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  CheckboxField,
  ValidationMessage,
  TextField
} from '@contentful/forma-36-react-components';
import styles from './styles';

const LinkedEntriesValidation = props => {
  const [contentTypes, setContentTypes] = useState(props.contentTypes);
  const [message, setMessage] = useState(props.validation.message);
  const onCheckboxChange = updatedCheckboxItem => {
    const updatedContentTypes = contentTypes.map(item => {
      if (item.id === updatedCheckboxItem.id) {
        return { ...item, selected: !item.selected };
      } else {
        return item;
      }
    });
    setContentTypes(updatedContentTypes);
  };

  useEffect(() => {
    props.update(contentTypes);
    props.updateValidationMessageValue(message);
  }, [contentTypes, message, props]);

  return (
    <>
      <List>
        {contentTypes.map((item, index) => (
          <ListItem className={styles.inlineListItems} key={index}>
            <CheckboxField
              name={item.name}
              id={item.id}
              labelText={item.name}
              checked={item.selected}
              onChange={() => onCheckboxChange(item)}
              labelIsLight
            />
          </ListItem>
        ))}
      </List>
      {props.errorMessages[0] && <ValidationMessage>{props.errorMessages[0]}</ValidationMessage>}
      <TextField
        className={styles.errorMessage}
        name="Custom error message"
        id="customErrorMessage"
        labelText="Custom error message"
        value={message}
        textInputProps={{ type: 'text' }}
        onChange={({ target: { value } }) => setMessage(value)}
      />
    </>
  );
};

LinkedEntriesValidation.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  validation: PropTypes.object.isRequired,
  errorMessages: PropTypes.array.isRequired,
  update: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired
};

export default LinkedEntriesValidation;
