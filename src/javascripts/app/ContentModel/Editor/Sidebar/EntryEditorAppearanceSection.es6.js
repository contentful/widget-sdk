import React, { useState, useEffect, useReducer, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Paragraph,
  Form,
  Typography,
  RadioButtonField,
  FieldGroup,
  Select,
  ValidationMessage,
  Option,
  TextLink
} from '@contentful/forma-36-react-components';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';
import EditorInstanceParametersConfigurationModal from './EditorInstanceParametersConfigurationModal.es6';
import { reducer, actions } from './EntryEditorAppearanceReducer.es6';

const Options = {
  default: 'default',
  custom: 'custom'
};

const NOT_SELECTED = '__NOT_SELECTED__';

function getInitialValues(editorConfiguration, extensions) {
  const extensionIds = extensions.map(extension => extension.id);
  const isCorrectEditorConfiguration =
    editorConfiguration &&
    editorConfiguration.widgetNamespace === NAMESPACE_EXTENSION &&
    extensionIds.includes(editorConfiguration.widgetId);

  return {
    extensions,
    touched: false,
    activeOption: isCorrectEditorConfiguration ? Options.custom : Options.default,
    extensionId: isCorrectEditorConfiguration ? editorConfiguration.widgetId : NOT_SELECTED,
    extensionSettings:
      isCorrectEditorConfiguration && editorConfiguration.settings
        ? editorConfiguration.settings
        : {}
  };
}

export default function EntryEditorAppearanceSection(props) {
  const { updateEditorConfiguration, editorConfiguration, extensions } = props;

  const initialValues = getInitialValues(editorConfiguration, extensions);
  const [state, dispatch] = useReducer(reducer, initialValues);
  const [isConfigurationOpen, setConfigurationOpen] = useState(false);

  useEffect(() => {
    if (state.activeOption === Options.default) {
      updateEditorConfiguration(undefined);
    } else if (state.activeOption === Options.custom && state.extensionId !== NOT_SELECTED) {
      updateEditorConfiguration({
        widgetId: state.extensionId,
        widgetNamespace: NAMESPACE_EXTENSION,
        settings: state.extensionSettings
      });
    }
  }, [state.activeOption, state.extensionId, state.extensionSettings, updateEditorConfiguration]);

  const currentExtension = useMemo(() => {
    return extensions.find(item => item.id === state.extensionId);
  }, [extensions, state.extensionId]);

  const hasError = state.touched && state.extensionId === NOT_SELECTED;
  const hasParams =
    currentExtension && currentExtension.parameters && currentExtension.parameters.length > 0;

  return (
    <React.Fragment>
      <h2 className="entity-sidebar__heading">Entry Editor Appearance</h2>
      <Typography>
        <Paragraph>Change the entry editor’s appearance for this content type. </Paragraph>
      </Typography>
      <Form spacing="condensed">
        <FieldGroup>
          <RadioButtonField
            labelIsLight
            labelText="Use default editor"
            name="editorType"
            checked={state.activeOption === Options.default}
            value={Options.default}
            onChange={e => {
              dispatch(actions.selectActiveOption(e.target.value));
            }}
            id="defaultEditorType"
          />
          <RadioButtonField
            labelIsLight
            labelText="Use custom editor"
            name="editorType"
            value={Options.custom}
            checked={state.activeOption === Options.custom}
            onChange={e => {
              dispatch(actions.selectActiveOption(e.target.value));
            }}
            id="customEditorType"
          />
        </FieldGroup>
        {state.activeOption === Options.custom && (
          <React.Fragment>
            <Select
              hasError={hasError}
              value={state.extensionId}
              onChange={e => {
                dispatch(actions.setExtensionId(e.target.value));
              }}>
              <Option value={NOT_SELECTED}>Select custom entry editor</Option>
              {extensions.map(extension => (
                <Option value={extension.id} key={extension.id}>
                  {extension.name}
                </Option>
              ))}
            </Select>
            {hasError && (
              <ValidationMessage className="f36-margin-top--s">
                Custom entry editor is required
              </ValidationMessage>
            )}
            {hasParams && (
              <TextLink
                className="f36-margin-top--s"
                onClick={() => {
                  setConfigurationOpen(true);
                }}>
                Change instance parameters
              </TextLink>
            )}
          </React.Fragment>
        )}
      </Form>
      {isConfigurationOpen && currentExtension && (
        <EditorInstanceParametersConfigurationModal
          initialSettings={state.extensionSettings}
          extension={currentExtension}
          onSave={settings => {
            dispatch(actions.setExtensionSettings(settings));
            setConfigurationOpen(false);
          }}
          onClose={() => {
            setConfigurationOpen(false);
          }}
        />
      )}
    </React.Fragment>
  );
}

EntryEditorAppearanceSection.propTypes = {
  extensions: PropTypes.array.isRequired,
  editorConfiguration: PropTypes.object,
  updateEditorConfiguration: PropTypes.func.isRequired
};
