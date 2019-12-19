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
    position: 'relative'
  }),
  note: css({
    marginBottom: tokens.spacingL
  }),
  overlay: css({
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colorWhite,
    opacity: 0.6
  })
};

export default class FieldDialogAppearanceTab extends React.Component {
  static propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    availableWidgets: PropTypes.array.isRequired,
    defaultWidget: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    }).isRequired,
    widgetSettings: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      params: PropTypes.object
    }).isRequired,
    onSelect: PropTypes.func.isRequired,
    onParametersUpdate: PropTypes.func.isRequired,
    hasCustomEditor: PropTypes.bool
  };

  getFormProps = selectedWidget => {
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
          [id]: value
        });
      }
    };
  };

  render() {
    const {
      availableWidgets,
      widgetSettings,
      defaultWidget,
      isAdmin,
      hasCustomEditor
    } = this.props;
    const widgetsCount = availableWidgets.length;
    const selectedWidget = availableWidgets.find(widget => {
      return widget.namespace === widgetSettings.namespace && widget.id === widgetSettings.id;
    });

    return (
      <div>
        {hasCustomEditor && (
          <Note noteType="primary" className={styles.note}>
            These settings are overwritten by custom content type extension. To change this, use the
            default editor.
          </Note>
        )}
        <div className={styles.container}>
          {hasCustomEditor && <div className={styles.overlay} />}
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
                  'field-dialog__widget-options': availableWidgets.length > 1
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
