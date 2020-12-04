import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  CheckboxField,
  Modal,
  Button,
  TextField,
  Form,
} from '@contentful/forma-36-react-components';
import { useAssemblyTypesProductCatalogFlag } from 'features/assembly-types';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';

const DialogPropTypes = {
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired,
  originalDescription: PropTypes.string,
  originalAssembly: PropTypes.bool,
};

export function EditContentForm(props) {
  const [name, setName] = useState(props.originalName);
  const [description, setDescription] = useState(props.originalDescription);
  const [assembly, setAssembly] = useState(props.originalAssembly || false);

  const isAssemblyProductCatalogFlagEnabled = useAssemblyTypesProductCatalogFlag();

  const onEditCancel = () => {
    props.onClose(false);
  };

  const onEditConfirm = async () => {
    props.onConfirm({
      name,
      description,
      ...(isAssemblyProductCatalogFlagEnabled && { assembly }),
    });
  };

  const isConfirmEnabled = name !== '';

  return (
    <Fragment>
      <Modal.Header title="Edit content type" onClose={onEditCancel} />
      <Modal.Content>
        <Form spacing="condensed">
          <TextField
            value={name}
            labelText="Name"
            required
            name="contentTypeName"
            id="contentTypeName"
            onChange={(e) => {
              setName(e.target.value);
            }}
            validationMessage={!name && 'Name is required'}
            countCharacters
            textInputProps={{
              maxLength: 50,
              placeholder: 'For example Product, Blog Post, Author',
            }}
          />
          <TextField
            value={description}
            labelText="Description"
            name="contentTypeDescription"
            id="contentTypeDescription"
            textarea
            countCharacters
            textInputProps={{
              maxLength: 500,
            }}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
          {isAssemblyProductCatalogFlagEnabled && (
            <CheckboxField
              checked={assembly}
              onChange={() => setAssembly((oldAssembly) => !oldAssembly)}
              name="contentTypeIsAssembly"
              id="contentTypeIsAssembly"
              labelText="Top level content type"
              helpText="This content type represents a top level domain object and is composed from other entries"
            />
          )}
        </Form>
      </Modal.Content>
      <Modal.Controls>
        <Button
          testId="content-type-form-confirm"
          buttonType="positive"
          onClick={onEditConfirm}
          disabled={!isConfirmEnabled}>
          Save
        </Button>
        <Button testId="content-type-form-cancel" buttonType="muted" onClick={onEditCancel}>
          Cancel
        </Button>
      </Modal.Controls>
    </Fragment>
  );
}

EditContentForm.propTypes = DialogPropTypes;

export default function EditContentTypeDialog(props) {
  return (
    <Modal
      testId="edit-content-type-modal"
      size="large"
      isShown={props.isShown}
      onClose={() => props.onClose(false)}
      allowHeightOverflow>
      {() => (
        <SpaceEnvContextProvider>
          <CurrentSpaceAPIClientProvider>
            <EditContentForm {...props} />
          </CurrentSpaceAPIClientProvider>
        </SpaceEnvContextProvider>
      )}
    </Modal>
  );
}

EditContentTypeDialog.propTypes = { ...DialogPropTypes, isShown: PropTypes.bool.isRequired };
