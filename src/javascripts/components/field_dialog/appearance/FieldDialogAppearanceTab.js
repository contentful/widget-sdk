import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import FieldDialogWidgetsList from './FieldDialogWidgetsList';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    position: 'relative',
  }),
  note: css({
    marginBottom: tokens.spacingL,
  }),
};

export default class FieldDialogAppearanceTab extends React.Component {
  static propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    availableWidgets: PropTypes.array.isRequired,
    defaultWidget: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
    }).isRequired,
    widgetSettings: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      params: PropTypes.object,
    }).isRequired,
    onSelect: PropTypes.func.isRequired,
    onParametersUpdate: PropTypes.func.isRequired,
    hasCustomEditor: PropTypes.bool,
  };

  getFormProps = (selectedWidget) => {
    let definitions = selectedWidget.parameters;
    const params = this.props.widgetSettings.params;

    const values = WidgetParametersUtils.applyDefaultValues(definitions, params);
    definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
    definitions = WidgetParametersUtils.unifyEnumOptions(definitions);

    return {
      definitions,
      values,
      missing: WidgetParametersUtils.markMissingValues(definitions, values),
      updateValue: (id, value) => {
        this.props.onParametersUpdate({
          ...values,
          [id]: value,
        });
      },
    };
  };

  render() {
    const {
      availableWidgets,
      widgetSettings,
      defaultWidget,
      isAdmin,
      hasCustomEditor,
    } = this.props;
    const widgetsCount = availableWidgets.length;
    const selectedWidget = availableWidgets.find((widget) => {
      return widget.namespace === widgetSettings.namespace && widget.id === widgetSettings.id;
    });

    return (
      <div>
        {hasCustomEditor && (
          <Note noteType="primary" className={styles.note}>
            You are using a custom entry editor for this content type. Therefore, these settings
            might not affect how fields are displayed in the editor.
          </Note>
        )}
        <div className={styles.container}>
          {widgetsCount === 0 && (
            <Note noteType="primary" className={styles.note}>
              No widgets for this field, please contact support.
            </Note>
          )}
          {widgetsCount > 0 && (
            <React.Fragment>
              <FieldDialogWidgetsList
                widgets={availableWidgets}
                onSelect={this.props.onSelect}
                selectedWidget={selectedWidget}
                defaultWidget={defaultWidget}
                isAdmin={isAdmin}
              />
              <div
                className={classNames('modal-dialog__slice', {
                  'field-dialog__widget-options': availableWidgets.length > 1,
                })}>
                {selectedWidget && <WidgetParametersForm {...this.getFormProps(selectedWidget)} />}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}
