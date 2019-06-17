import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Heading, Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { closeWidgetConfiguration, updateWidgetSettings } from './SidebarConfigurationReducer.es6';
import WidgetParametersForm from 'widgets/WidgetParametersForm.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';
import useFormState from 'app/common/hooks/useFormState.es6';

const styles = {
  container: css({
    display: 'block',
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingXl
  })
};

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
      <Heading className="f36-margin-bottom--s">Configure {widget.name}</Heading>
      <div className={styles.container}>
        <WidgetParametersForm
          definitions={widget.parameters}
          updateValue={updateValue}
          missing={missing}
          values={values}
        />
        <div>
          <Button
            disabled={anyIsMissing}
            className="f36-margin-right--m"
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
