/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';

import buildWidgetApi from 'app/widgets/WidgetApi/buildWidgetApi.es6';
import WidgetAPIContext from './WidgetApiContext.es6';
import { getModule } from 'NgRegistry.es6';

const $rootScope = getModule('$rootScope');

export default function connectToWidgetAPI(Component) {
  return class extends React.Component {
    displayName = `WithWidgetAPI(${getDisplayName(Component)})`;

    static propTypes = {
      field: PropTypes.object.isRequired,
      loadEvents: PropTypes.shape({
        emit: PropTypes.func.isRequired,
        stream: PropTypes.shape({
          onValue: PropTypes.func.isRequired
        }).isRequired
      }),
      entry: PropTypes.object.isRequired,
      features: PropTypes.array
    };

    state = {
      value: this.props.field.getValue(),
      isDisabled: true,
      currentUrl: window.location
    };

    UNSAFE_componentWillMount() {
      this.offDisabledState = this.props.field.onIsDisabledChanged(this.handleDisabledChanges);
      this.offValueChanged = this.props.field.onValueChanged(this.handleIncomingChanges);

      this.offLocationChanged = $rootScope.$on('$locationChangeSuccess', () => {
        this.setState({ currentUrl: { ...window.location } });
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
      const { entry, loadEvents, field, features } = this.props;
      const { currentUrl } = this.state;
      const widgetAPI = buildWidgetApi({
        entry,
        field,
        features,
        currentUrl,
        loadEvents
      });
      return (
        <WidgetAPIContext.Provider value={{ widgetAPI }}>
          <Component
            {...this.props}
            widgetAPI={widgetAPI}
            value={this.state.value}
            isDisabled={this.state.isDisabled}
            onChange={this.handleFieldValueChanges}
          />
        </WidgetAPIContext.Provider>
      );
    }
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
