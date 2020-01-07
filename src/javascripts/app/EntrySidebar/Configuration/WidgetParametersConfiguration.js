import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Typography, Heading, Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { closeWidgetConfiguration, updateWidgetSettings } from './SidebarConfigurationReducer';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import useFormState from 'app/common/hooks/useFormState';

const styles = {
  container: css({
    display: 'block',
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingXl
  }),
  saveButton: css({
    marginRight: tokens.spacingM
  })
};

function WidgetParametersConfiguration({ widget, dispatch }) {
  const [formState, updateValue] = useFormState(widget.settings || {});

  let definitions = widget.parameters;

  const values = WidgetParametersUtils.applyDefaultValues(definitions, formState);
  definitions = WidgetParametersUtils.filterDefinitions(definitions, values, widget);
  definitions = WidgetParametersUtils.unifyEnumOptions(definitions);
  const missing = WidgetParametersUtils.markMissingValues(definitions, values);
  const anyIsMissing = Object.values(missing).reduce((prev, acc) => prev || acc, false);

  return (
    <>
      <Typography>
        <Heading>Configure {widget.name}</Heading>
      </Typography>
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
            className={styles.saveButton}
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
    </>
  );
}

WidgetParametersConfiguration.propTypes = {
  widget: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default WidgetParametersConfiguration;
