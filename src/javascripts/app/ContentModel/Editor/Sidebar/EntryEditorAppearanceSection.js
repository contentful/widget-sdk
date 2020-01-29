import { get } from 'lodash';
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
  TextLink,
  Subheading
} from '@contentful/forma-36-react-components';
import { NAMESPACE_APP, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import { LOCATION_ENTRY_EDITOR } from 'widgets/WidgetLocations';
import EditorInstanceParametersConfigurationModal from './EditorInstanceParametersConfigurationModal';
import { reducer, actions } from './EntryEditorAppearanceReducer';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const Options = {
  default: 'default',
  custom: 'custom'
};

const styles = {
  validationMessage: css({
    marginTop: tokens.spacingS
  }),
  changeInstance: css({
    marginTop: tokens.spacingS
  })
};

function canBeUsedAsEntryEditor(widget) {
  if (!Array.isArray(widget.locations)) {
    return true;
  }

  return widget.locations.includes(LOCATION_ENTRY_EDITOR);
}

function getInitialValues(configuration, widgets) {
  const validWidgets = widgets.filter(canBeUsedAsEntryEditor);

  configuration = configuration || {};
  configuration.settings = configuration.settings || {};

  const isCustom = [NAMESPACE_EXTENSION, NAMESPACE_APP].includes(configuration.widgetNamespace);
  const isValid = !!validWidgets.find(w => {
    return w.namespace === configuration.widgetNamespace && w.id === configuration.widgetId;
  });
  const isConfigurationValid = isCustom && isValid;

  return {
    validWidgets,
    touched: false,
    activeOption: isConfigurationValid ? Options.custom : Options.default,
    configuration: isConfigurationValid ? configuration : null
  };
}

export default function EntryEditorAppearanceSection(props) {
  const { updateEditorConfiguration, editorConfiguration, widgets } = props;

  const initialValues = getInitialValues(editorConfiguration, widgets);
  const [state, dispatch] = useReducer(reducer, initialValues);
  const [isConfigurationOpen, setConfigurationOpen] = useState(false);

  useEffect(() => {
    if (state.activeOption === Options.default) {
      updateEditorConfiguration(undefined);
    } else if (state.activeOption === Options.custom && state.configuration) {
      updateEditorConfiguration(state.configuration);
    }
  }, [state.activeOption, state.configuration, updateEditorConfiguration]);

  const currentWidget = useMemo(() => {
    const config = state.configuration;
    return (
      config &&
      state.validWidgets.find(w => {
        return w.namespace === config.widgetNamespace && w.id === config.widgetId;
      })
    );
  }, [state.validWidgets, state.configuration]);

  const hasError = state.touched && !state.configuration;
  const hasParams = get(currentWidget, ['parameters'], []).length > 0;

  return (
    <>
      <Subheading className="entity-sidebar__heading">Entry Editor Appearance</Subheading>
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
          <>
            <Select
              hasError={hasError}
              value={`${state.validWidgets.indexOf(currentWidget)}`}
              onChange={e => {
                const widget = state.validWidgets[e.target.value];
                dispatch(actions.setWidget(widget));
              }}>
              <Option value="-1">Select custom entry editor</Option>
              {state.validWidgets.map((w, i) => (
                <Option value={`${i}`} key={[w.namespace, w.id].join(',')}>
                  {w.name}
                  {w.namespace === NAMESPACE_APP ? ' (app)' : ''}
                </Option>
              ))}
            </Select>
            {hasError && (
              <ValidationMessage className={styles.validationMessage}>
                Custom entry editor is required
              </ValidationMessage>
            )}
            {hasParams && (
              <TextLink
                className={styles.changeInstance}
                onClick={() => {
                  setConfigurationOpen(true);
                }}>
                Change instance parameters
              </TextLink>
            )}
          </>
        )}
      </Form>
      {isConfigurationOpen && currentWidget && (
        <EditorInstanceParametersConfigurationModal
          initialSettings={get(state, ['configuration', 'settings'], {})}
          widget={currentWidget}
          onSave={settings => {
            dispatch(actions.setSettings(settings));
            setConfigurationOpen(false);
          }}
          onClose={() => {
            setConfigurationOpen(false);
          }}
        />
      )}
    </>
  );
}

EntryEditorAppearanceSection.propTypes = {
  widgets: PropTypes.array.isRequired,
  editorConfiguration: PropTypes.object,
  updateEditorConfiguration: PropTypes.func.isRequired
};
