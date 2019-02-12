import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Heading, Button } from '@contentful/forma-36-react-components';
import { closeWidgetConfiguration, updateWidgetSettings } from './SidebarConfigurationReducer.es6';
import WidgetParametersForm from 'widgets/WidgetParametersForm.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';

function useFormState(initialState) {
  const [formState, setFormState] = useState(initialState);

  const updateField = (field, value) => {
    setFormState({
      ...formState,
      [field]: value
    });
  };

  return [formState, updateField];
}

function WidgetParametersConfiguration({ widget, dispatch }) {
  const [formState, updateValue] = useFormState(widget.settings || {});

  let definitions = widget.parameters;

  const values = WidgetParametersUtils.applyDefaultValues(definitions, formState);
  definitions = WidgetParametersUtils.filterDefinitions(definitions, values, widget.id);
  definitions = WidgetParametersUtils.unifyEnumOptions(definitions);
  const missing = WidgetParametersUtils.markMissingValues(definitions, values);
  const anyIsMissing = Object.values(missing).reduce((prev, acc) => prev || acc, false);

  return (
    <React.Fragment>
      <Heading extraClassNames="f36-margin-bottom--s">Configure {widget.name}</Heading>
      <div className="sidebar-configuration-fields__container">
        <WidgetParametersForm
          definitions={widget.parameters}
          updateValue={updateValue}
          missing={missing}
          values={values}
        />
        <div>
          <Button
            disabled={anyIsMissing}
            extraClassNames="f36-margin-right--m"
            onClick={() => {
              dispatch(updateWidgetSettings(widget, values));
              dispatch(closeWidgetConfiguration());
            }}>
            Save
          </Button>
          <Button
            onClick={() => {
              dispatch(closeWidgetConfiguration());
            }}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </div>
    </React.Fragment>
  );
}

WidgetParametersConfiguration.propTypes = {
  widget: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default WidgetParametersConfiguration;
