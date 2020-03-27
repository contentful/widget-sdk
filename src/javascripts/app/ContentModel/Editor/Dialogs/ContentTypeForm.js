import React, { useReducer, Fragment } from 'react';
import PropTypes from 'prop-types';
import { createImmerReducer } from 'redux/utils/createImmerReducer';
import { Modal, Button, TextField, Form } from '@contentful/forma-36-react-components';
import * as stringUtils from 'utils/StringUtils';
import { isValidResourceId } from 'data/utils';

const validate = (state, existingContentTypeIds = []) => {
  const errors = {};
  if (!state.name) {
    errors.name = 'Name is required';
  }
  if (!state.contentTypeId) {
    errors.contentTypeId = 'Api Identifier is required';
  } else {
    if (!isValidResourceId(state.contentTypeId)) {
      errors.contentTypeId = 'Please use only letters, numbers and underscores';
    } else if (existingContentTypeIds.includes(state.contentTypeId)) {
      errors.contentTypeId = 'A content type with this ID already exists';
    }
  }
  return errors;
};

const reducer = createImmerReducer({
  SET_VALUE: (state, action) => {
    const { field, value } = action.payload;

    state[field] = value;
    state.touched = true;

    // remember if user change contentTypeId field
    if (field === 'contentTypeId') {
      state.contentTypeIdTouched = true;
    }

    // generate contentTypeId automatically if it wasn't touched
    if (field === 'name' && state.contentTypeIdTouched !== true) {
      state.contentTypeId = stringUtils.toIdentifier(value);
    }
  },
  SET_BUSY: (state, action) => {
    state.busy = action.payload.value;
  },
});

export default function ContentTypeForm(props) {
  const [state, dispatch] = useReducer(reducer, {
    name: '',
    contentTypeId: '',
    description: props.originalDescription || '',
    touched: false,
    busy: false,
  });

  const onChangeHandler = (field) => (e) => {
    dispatch({
      type: 'SET_VALUE',
      payload: {
        field,
        value: e.target.value,
      },
    });
  };

  const setBusy = (value) => {
    dispatch({
      type: 'SET_BUSY',
      payload: {
        value,
      },
    });
  };

  const onConfirm = async () => {
    setBusy(true);
    try {
      await props.onConfirm({
        name: state.name,
        contentTypeId: state.contentTypeId,
        description: state.description,
      });
    } catch (e) {
      setBusy(false);
    }
  };

  const validationErrors = validate(state, props.existingContentTypeIds);
  const hasAnyValidationErrors = Object.values(validationErrors).some((item) => Boolean(item));

  const isConfirmEnabled = state.name && state.contentTypeId && hasAnyValidationErrors === false;

  return (
    <Fragment>
      <Modal.Header title={props.title} onClose={() => props.onCancel()} />
      <Modal.Content>
        <Form spacing="condensed">
          <TextField
            value={state.name}
            labelText="Name"
            required
            name="contentTypeName"
            id="contentTypeName"
            onChange={onChangeHandler('name')}
            validationMessage={state.touched ? validationErrors.name : ''}
            countCharacters
            textInputProps={{
              maxLength: 64,
              placeholder: props.namePlaceholder,
            }}
          />
          <TextField
            value={state.contentTypeId}
            labelText="Api Identifier"
            required
            name="contentTypeId"
            id="contentTypeId"
            helpText="generated from name"
            validationMessage={state.touched ? validationErrors.contentTypeId : ''}
            onChange={onChangeHandler('contentTypeId')}
            countCharacters
            textInputProps={{
              maxLength: 64,
            }}
          />
          <TextField
            value={state.description}
            labelText="Description"
            name="contentTypeDescription"
            id="contentTypeDescription"
            textarea
            countCharacters
            textInputProps={{
              maxLength: 500,
            }}
            validationMessage={state.touched ? validationErrors.description : ''}
            onChange={onChangeHandler('description')}
          />
          {props.children}
        </Form>
      </Modal.Content>
      <Modal.Controls>
        <Button
          testId="content-type-form-confirm"
          buttonType="positive"
          onClick={() => onConfirm()}
          loading={state.busy}
          disabled={!isConfirmEnabled}>
          {props.confirmLabel}
        </Button>
        <Button
          testId="content-type-form-cancel"
          buttonType="muted"
          onClick={() => props.onCancel()}>
          {props.cancelLabel}
        </Button>
      </Modal.Controls>
    </Fragment>
  );
}

ContentTypeForm.propTypes = {
  title: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired,
  originalDescription: PropTypes.string,
  existingContentTypeIds: PropTypes.arrayOf(PropTypes.string.isRequired),
  confirmLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string.isRequired,
  namePlaceholder: PropTypes.string.isRequired,
};
