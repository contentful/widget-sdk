import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Heading, Button } from '@contentful/forma-36-react-components';
import { closeWidgetConfiguration } from './SidebarConfigurationReducer.es6';
import WidgetParametersForm from 'widgets/WidgetParametersForm.es6';

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
  const initialState = widget.parameters.reduce((current, acc) => {
    return {
      ...acc,
      [current.id]: current.value || ''
    };
  }, {});

  const [values, updateValue] = useFormState(initialState);

  return (
    <React.Fragment>
      <Heading extraClassNames="f36-margin-bottom--s">Configure {widget.title}</Heading>
      <div className="sidebar-configuration-fields__container">
        <WidgetParametersForm
          definitions={widget.parameters}
          updateValue={updateValue}
          missing={{}}
          values={values}
        />
        <div>
          <Button
            extraClassNames="f36-margin-right--m"
            onClick={() => {
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
