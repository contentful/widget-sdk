import React from 'react';
import PropTypes from 'prop-types';

import entitySelector from 'entitySelector';
import WidgetAPIContext from './WidgetAPIContext';

export default function connectToWidgetAPI (Component) {
  return class extends React.Component {
    displayName = `WithWidgetAPI(${getDisplayName(Component)})`;
    static propTypes = {
      field: PropTypes.object.isRequired
    };

    state = {
      value: this.props.field.getValue(),
      isDisabled: true
    };
    constructor (props) {
      super(props);

      this.offDisabledState = this.props.field.onIsDisabledChanged(
        this.handleDisabledChanges
      );
      this.offValueChanged = this.props.field.onValueChanged(
        this.handleIncomingChanges
      );
    }

    componentWillUnmount () {
      this.offValueChanged();
      this.offDisabledState();
    }

    handleDisabledChanges = isDisabled => {
      if (this.state && this.state.isDisabled !== isDisabled) {
        this.setState({ isDisabled });
      }
    };

    handleIncomingChanges = nextValue => {
      if (this.state.isDisabled) {
        this.setState({
          value: nextValue
        });
      }
    };

    handleFieldValueChanges = nextValue => {
      this.props.field.setValue(nextValue);
    };

    render () {
      return (
        <WidgetAPIContext.Provider
          value={{
            widgetAPI: {
              dialogs: {
                selectSingleEntry: () =>
                  entitySelector.openFromField(this.props.field, 0)
              }
            }
          }}
        >
          <Component
            value={this.state.value}
            isDisabled={this.state.isDisabled}
            onChange={this.handleFieldValueChanges}
          />
        </WidgetAPIContext.Provider>
      );
    }
  };
}

function getDisplayName (WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
