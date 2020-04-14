import React from 'react';
import PropTypes from 'prop-types';
import { Modal, TextField, Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as fieldFactory from 'services/fieldFactory';
import * as random from 'utils/Random';
import { inRange, includes } from 'lodash';
import { css } from 'emotion';
import { useForm } from 'app/common/hooks/useForm';
import { toIdentifier } from 'utils/StringUtils';
import { createImmerReducer } from 'redux/utils/createImmerReducer';

import { AddFieldContext } from './AddFieldContext';
import { FieldGroupTypeSelector } from './FieldGroupTypeSelector';
import { FieldGroupSelector } from './FieldGroupSelector';

const pages = {
  CHOOSING_FIELD_TYPE: 'CHOOSING_FIELD_TYPE',
  CONFIGURING_FIELD: 'CONFIGURING_FIELD',
};

const initialState = {
  page: pages.CHOOSING_FIELD_TYPE,
  fieldType: null,
  fieldGroup: null,
  isList: false,
};

const actions = {
  SELECT_FIELD_TYPE_GROUP: 'SELECT_FIELD_TYPE_GROUP',
  SELECT_FIELD_TYPE: 'SELECT_FIELD_TYPE',
  SET_IS_LIST: 'SET_IS_LIST',
  RESET_FIELD_GROUP: 'RESET_FIELD_GROUP',
};

const reducer = createImmerReducer({
  [actions.SELECT_FIELD_TYPE_GROUP]: (state, action) => {
    state.page = pages.CONFIGURING_FIELD;
    state.fieldGroup = action.payload;
    state.fieldType = action.payload.types[0];
  },
  [actions.SELECT_FIELD_TYPE]: (state, action) => {
    state.fieldType = action.payload.types[action.payload.index];
  },
  [actions.SET_IS_LIST]: (state, action) => {
    state.isList = action.payload;
  },
  [actions.RESET_FIELD_GROUP]: () => {
    return { ...initialState };
  },
});

function isUniqueApiName(existingApiNames, newId) {
  return !includes(existingApiNames, newId);
}

const fieldGroupConfigurationStyle = {
  inputs: css({
    display: 'flex',
    marginBottom: tokens.spacingM,
  }),
  spacer: css({
    flexBasis: tokens.spacing2Xl,
  }),
};

const FieldGroupConfiguration = ({ onCreate, onCreateAndConfigure, existingApiNames }) => {
  const { state, dispatch } = React.useContext(AddFieldContext);

  const { onChange, onSubmit, fields } = useForm({
    fields: {
      name: {
        value: '',
        validator: (value) => {
          if (inRange(value.length, 1, 50)) {
            return '';
          } else {
            return "Please edit the text so it's between 1 and 50 characters long";
          }
        },
        required: true,
      },
      apiName: {
        value: '',
        validator: (value) => {
          if (!value.match(/^[a-zA-Z0-9_]+$/) || value.length === 0) {
            return 'Please use only letters and numbers';
          } else if (value.match(/^\d/)) {
            return 'Please use a letter as the first character';
          } else if (!isUniqueApiName(existingApiNames, value)) {
            return 'A field with this ID already exists';
          }
        },
        required: true,
      },
    },
    submitFn: async ({ name, apiName }, createCallback) => {
      createCallback({ name, apiName });
    },
  });

  return (
    <React.Fragment>
      <Modal.Content testId="field_group_configuration">
        <div className={fieldGroupConfigurationStyle.inputs}>
          <TextField
            id="nameInputLabel"
            name="fieldName"
            labelText="Name"
            textInputProps={{
              autoFocus: true,
            }}
            validationMessage={fields.name.error}
            value={fields.name.value}
            helpText="It will appear in the entry editor"
            onChange={(e) => {
              onChange('name', e.target.value);
              if (toIdentifier(fields.name.value) === fields.apiName.value) {
                onChange('apiName', toIdentifier(e.target.value));
              }
            }}
          />
          <div className={fieldGroupConfigurationStyle.spacer} />

          <TextField
            id="apiNameInputLabel"
            name="apiName"
            labelText="Field ID"
            textInputProps={{
              maxLength: 50,
            }}
            validationMessage={fields.apiName.error}
            value={fields.apiName.value}
            helpText="It is generated automatically based on the name and will appear in the API responses"
            onChange={(e) => {
              onChange('apiName', e.target.value);
            }}
          />
        </div>
        <FieldGroupTypeSelector
          selectNewFieldType={(index) =>
            dispatch({
              type: actions.SELECT_FIELD_TYPE,
              payload: { types: state.fieldGroup.types, index },
            })
          }
          setList={(isList) => dispatch({ type: actions.SET_IS_LIST, payload: isList })}
          fieldType={state.fieldType}
          fieldGroupName={state.fieldGroup.name}
          isList={state.isList}
        />
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={() => onSubmit(onCreate)} testId="field-create" buttonType="positive">
          Create
        </Button>
        <Button
          onClick={() => onSubmit(onCreateAndConfigure)}
          testId="field-create-configure"
          buttonType="positive">
          Create and configure
        </Button>
        <Button
          onClick={() => dispatch({ type: actions.RESET_FIELD_GROUP })}
          testId="change-field-type"
          buttonType="muted">
          Change field type
        </Button>
      </Modal.Controls>
    </React.Fragment>
  );
};

FieldGroupConfiguration.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCreateAndConfigure: PropTypes.func.isRequired,
  existingApiNames: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const AddFieldModalContent = ({ onClose, onConfirm, onConfirmAndConfigure, existingApiNames }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const contextValue = React.useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

  const onCreate = React.useCallback(
    ({ name, apiName }) => {
      const typeInfo = fieldFactory.createTypeInfo(state.fieldType, state.isList);
      onConfirm({ name, apiName, id: random.id(), ...typeInfo });
      onClose();
    },
    [state, onClose, onConfirm]
  );

  const onCreateAndConfigure = React.useCallback(
    ({ name, apiName }) => {
      const typeInfo = fieldFactory.createTypeInfo(state.fieldType, state.isList);
      onConfirmAndConfigure({ name, apiName, id: random.id(), ...typeInfo });
      onClose();
    },
    [state, onClose, onConfirmAndConfigure]
  );

  return (
    <AddFieldContext.Provider value={contextValue}>
      {state.page === pages.CHOOSING_FIELD_TYPE ? (
        <React.Fragment>
          <Modal.Header onClose={onClose} title="Add new field" />
          <Modal.Content>
            <FieldGroupSelector
              onSelect={(type) => {
                dispatch({ type: actions.SELECT_FIELD_TYPE_GROUP, payload: type });
              }}
            />
          </Modal.Content>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Modal.Header onClose={onClose} title={`New ${state.fieldType.label} Field`} />
          <FieldGroupConfiguration
            onCreate={onCreate}
            onCreateAndConfigure={onCreateAndConfigure}
            existingApiNames={existingApiNames}
          />
        </React.Fragment>
      )}
    </AddFieldContext.Provider>
  );
};

AddFieldModalContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onConfirmAndConfigure: PropTypes.func.isRequired,
  existingApiNames: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export const AddFieldDialogModal = ({
  isShown,
  onClose,
  onConfirm,
  onConfirmAndConfigure,
  existingApiNames,
}) => {
  return (
    <Modal
      size="large"
      testId="add_field_dialog_modal"
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}>
      {() => (
        <AddFieldModalContent
          isShown={isShown}
          onClose={onClose}
          onConfirm={onConfirm}
          onConfirmAndConfigure={onConfirmAndConfigure}
          existingApiNames={existingApiNames}
        />
      )}
    </Modal>
  );
};

AddFieldDialogModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onConfirmAndConfigure: PropTypes.func.isRequired,
  existingApiNames: PropTypes.arrayOf(PropTypes.string).isRequired,
};
