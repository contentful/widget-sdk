import React, { useReducer, Fragment } from 'react';
import PropTypes from 'prop-types';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import { Modal, Button, TextField, Form, Note } from '@contentful/forma-36-react-components';
import * as stringUtils from 'utils/StringUtils.es6';
import { isValidResourceId } from 'data/utils.es6';

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
  }
});

const DialogPropTypes = {
  isShown: PropTypes.bool.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired,
  originalDescription: PropTypes.string,
  existingContentTypeIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};

export function DuplicateContentForm(props) {
  const [state, dispatch] = useReducer(reducer, {
    name: '',
    contentTypeId: '',
    description: props.originalDescription || '',
    touched: false,
    busy: false
  });

  const onChangeHandler = field => e => {
    dispatch({
      type: 'SET_VALUE',
      payload: {
        field,
        value: e.target.value
      }
    });
  };

  const setBusy = value => {
    dispatch({
      type: 'SET_BUSY',
      payload: {
        value
      }
    });
  };

  const onDuplicateCancel = () => {
    props.onClose(false);
  };

  const onDuplicateConfirm = async () => {
    setBusy(true);
    try {
      const duplicated = await props.onDuplicate({
        name: state.name,
        contentTypeId: state.contentTypeId,
        description: state.description
      });
      props.onClose(duplicated);
    } catch (e) {
      setBusy(false);
    }
  };

  const validationErrors = validate(state, props.existingContentTypeIds);
  const hasAnyValidationErrors = Object.values(validationErrors).reduce((prev, value) => {
    return prev || Boolean(value);
  }, false);

  const isConfirmEnabled = state.name && state.contentTypeId && hasAnyValidationErrors === false;

  return (
    <Fragment>
      <Modal.Header title="Duplicate content type" onClose={onDuplicateCancel} />
      <Modal.Content>
        <Form spacing="condensed" testId="duplicate-content-type-form">
          <TextField
            value={state.name}
            labelText="Name"
            required
            name="contentTypeName"
            id="contentTypeName"
            onChange={onChangeHandler('name')}
            validationMessage={state.touched ? validationErrors.name : ''}
            countCharacters
            onBlur={() => {}}
            textInputProps={{
              maxLength: 64,
              placeholder: `Duplicate of "${props.originalName}"`
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
            onBlur={() => {}}
            textInputProps={{
              maxLength: 64
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
              maxLength: 500
            }}
            validationMessage={state.touched ? validationErrors.description : ''}
            onChange={onChangeHandler('description')}
            onBlur={() => {}}
          />
          <Note testId="duplicate-content-type-note">
            You&nbsp;re about to duplicate the content type <strong>{props.originalName}</strong>{' '}
            with all existing fields. No entries will be duplicated.
          </Note>
        </Form>
      </Modal.Content>
      <Modal.Controls>
        <Button
          testId="duplicate-content-type-confirm"
          buttonType="positive"
          onClick={onDuplicateConfirm}
          loading={state.busy}
          disabled={!isConfirmEnabled}>
          Duplicate
        </Button>
        <Button
          testId="duplicate-content-type-cancel"
          buttonType="muted"
          onClick={onDuplicateCancel}>
          Cancel
        </Button>
      </Modal.Controls>
    </Fragment>
  );
}

DuplicateContentForm.propTypes = DialogPropTypes;

export default function DuplicateContentTypeDialog(props) {
  return (
    <Modal
      size="large"
      isShown={props.isShown}
      onClose={() => props.onClose(false)}
      allowHeightOverflow>
      {() => <DuplicateContentForm {...props} />}
    </Modal>
  );
}

DuplicateContentTypeDialog.propTypes = DialogPropTypes;
