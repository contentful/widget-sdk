import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import { Modal, Button } from '@contentful/forma-36-react-components';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import useFormState from 'app/common/hooks/useFormState';

const styles = {
  saveButton: css({
    marginRight: tokens.spacingM
  })
};

export default function EditorInstanceParametersConfigurationModal(props) {
  const { extension } = props;

  const [formState, updateValue] = useFormState(props.initialSettings || {});

  let definitions = extension.parameters;

  const values = WidgetParametersUtils.applyDefaultValues(definitions, formState);
  definitions = WidgetParametersUtils.filterDefinitions(definitions, values, extension.id);
  definitions = WidgetParametersUtils.unifyEnumOptions(definitions);
  const missing = WidgetParametersUtils.markMissingValues(definitions, values);
  const anyIsMissing = Object.values(missing).reduce((prev, acc) => prev || acc, false);

  return (
    <Modal size="large" isShown onClose={props.onClose} title={`Configure ${extension.name}`}>
      <WidgetParametersForm
        definitions={extension.parameters}
        updateValue={updateValue}
        missing={missing}
        values={values}
      />
      <div>
        <Button
          disabled={anyIsMissing}
          className={styles.marginRight}
          onClick={() => {
            props.onSave(formState);
          }}>
          Save
        </Button>
        <Button
          onClick={() => {
            props.onClose();
          }}
          buttonType="muted">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

EditorInstanceParametersConfigurationModal.propTypes = {
  initialSettings: PropTypes.object.isRequired,
  extension: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
