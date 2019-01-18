import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import FieldDialogWidgetsList from './FieldDialogWidgetsList.es6';
import WidgetParametersForm from 'widgets/WidgetParametersForm.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';

export default class FieldDialogAppearanceTab extends React.Component {
  static propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    widgetsAreLoaded: PropTypes.bool.isRequired,
    availableWidgets: PropTypes.array.isRequired,
    defaultWidgetId: PropTypes.string.isRequired,
    selectedWidgetId: PropTypes.string.isRequired,
    widgetParams: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
    onParametersUpdate: PropTypes.func.isRequired
  };

  getFormProps = widget => {
    let definitions = widget.parameters;
    const params = this.props.widgetParams;

    const values = WidgetParametersUtils.applyDefaultValues(definitions, params);
    definitions = WidgetParametersUtils.filterDefinitions(definitions, values, widget);
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
    const { availableWidgets, defaultWidgetId, isAdmin, widgetsAreLoaded } = this.props;
    if (!widgetsAreLoaded) {
      return null;
    }
    const widgetsCount = availableWidgets.length;
    const widget = availableWidgets.find(widget => widget.id === this.props.selectedWidgetId);
    return (
      <div>
        {widgetsCount === 0 && (
          <Note noteType="primary">No widgets for this field, please contact support.</Note>
        )}
        {widgetsCount > 0 && (
          <React.Fragment>
            <FieldDialogWidgetsList
              widgets={availableWidgets}
              onSelect={this.props.onSelect}
              selectedWidgetId={this.props.selectedWidgetId}
              defaultWidgetId={defaultWidgetId}
              isAdmin={isAdmin}
            />
            <div
              className={classNames('modal-dialog__slice', {
                'field-dialog__widget-options': availableWidgets.length > 1
              })}>
              {widget && <WidgetParametersForm key={widget.id} {...this.getFormProps(widget)} />}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}
