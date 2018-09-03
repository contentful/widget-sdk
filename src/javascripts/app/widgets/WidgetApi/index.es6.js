/* eslint-disable camelcase */

import React from 'react';
import PropTypes from 'prop-types';

import $rootScope from '$rootScope';
import $location from '$location';
import entitySelector from 'entitySelector';
import WidgetAPIContext from './WidgetApiContext';
import createHyperlinkDialog from './createHyperlinkDialog';

export default function connectToWidgetAPI(Component) {
  return class extends React.Component {
    displayName = `WithWidgetAPI(${getDisplayName(Component)})`;
    static propTypes = {
      field: PropTypes.object.isRequired
    };

    state = {
      value: this.props.field.getValue(),
      isDisabled: true,
      currentUrl: $location.absUrl()
    };
    UNSAFE_componentWillMount() {
      this.offDisabledState = this.props.field.onIsDisabledChanged(this.handleDisabledChanges);
      this.offValueChanged = this.props.field.onValueChanged(this.handleIncomingChanges);

      this.offLocationChanged = $rootScope.$on('$locationChangeSuccess', (_, currentUrl) => {
        this.setState({ currentUrl });
      });
    }
    componentWillUnmount() {
      this.offValueChanged();
      this.offDisabledState();
      this.offLocationChanged();
    }

    handleDisabledChanges = isDisabled => {
      if (this.state.isDisabled !== isDisabled) {
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

    render() {
      const widgetAPI = this.buildWidgetAPI();
      return (
        <WidgetAPIContext.Provider value={{ widgetAPI }}>
          <Component
            widgetAPI={widgetAPI}
            value={this.state.value}
            isDisabled={this.state.isDisabled}
            onChange={this.handleFieldValueChanges}
          />
        </WidgetAPIContext.Provider>
      );
    }

    buildWidgetAPI() {
      return {
        dialogs: {
          selectSingleEntry: () => entitySelector.openFromField(this.props.field, 0),
          createHyperlink: createHyperlinkDialog
        },
        currentUrl: this.state.currentUrl
      };
    }
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
