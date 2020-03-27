/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';

import buildWidgetApi from 'app/widgets/WidgetApi/buildWidgetApi';
import WidgetAPIContext from './WidgetApiContext';
import { getModule } from 'NgRegistry';

/**
 * Takes a component with a `value`, `isDisabled` and `onChange` props
 * and connects them to a `widgetApi` passed to the returned HOC.
 *
 * TODO: This also takes the given `widgetApi` and adds some more
 *  stuff to it and passes it to the component. We shouldn't create
 *  another version of widgetApi here but move this to
 *  `cfWidgetApiDirective` or somewhere else to have a uniform
 *  interface.
 *
 * @param {boolean?} options.updateValueOnComponentChange If set to false,
 *  then re-rendering won't happen after the inner component
 *  fires its `props.onChange`
 * @param {boolean?} options.updateValueWhileEnabled If set to false,
 *  then re-rendering won't happen while the field is enabled.
 * @returns {React.Component}
 */
export default function connectToWidgetApi(
  Component,
  { updateValueOnComponentChange = true, updateValueWhileEnabled = true } = {}
) {
  return class extends React.Component {
    displayName = `WithWidgetAPI(${getDisplayName(Component)})`;

    static propTypes = {
      widgetApi: PropTypes.object.isRequired,
    };

    state = {
      value: this.props.widgetApi.field.getValue(),
      isDisabled: true,
      currentUrl: window.location,
    };

    UNSAFE_componentWillMount() {
      const $rootScope = getModule('$rootScope');

      const field = this.props.widgetApi.field;
      this.offDisabledState = field.onIsDisabledChanged(this.handleDisabledChanges);
      this.offValueChanged = field.onValueChanged(this.handleIncomingChanges);

      this.offLocationChanged = $rootScope.$on('$locationChangeSuccess', () => {
        this.setState({ currentUrl: { ...window.location } });
      });
    }

    componentWillUnmount() {
      this.offValueChanged();
      this.offDisabledState();
      this.offLocationChanged();
    }

    handleDisabledChanges = (isDisabled) => {
      if (this.state.isDisabled !== isDisabled) {
        this.setState({ isDisabled });
      }
    };

    handleIncomingChanges = (nextValue) => {
      if (this.state.isDisabled || updateValueWhileEnabled) {
        this.setState({
          value: nextValue,
        });
      }
    };

    handleComponentChanges = (nextValue) => {
      if (updateValueOnComponentChange) {
        this.setState({
          value: nextValue,
        });
      }
      this.props.widgetApi.field.setValue(nextValue);
    };

    render() {
      const { entry, field, settings } = this.props.widgetApi;
      const { currentUrl } = this.state;
      // TODO: Merge this part of widgetApi with the other widgetApi.
      const widgetAPI = buildWidgetApi({
        entry,
        field,
        currentUrl,
        settings,
      });
      const { widgetApi: _widgetApi, ...otherProps } = this.props;
      return (
        <WidgetAPIContext.Provider value={{ widgetAPI }}>
          <Component
            {...otherProps}
            widgetAPI={widgetAPI}
            value={this.state.value}
            isDisabled={this.state.isDisabled}
            onChange={this.handleComponentChanges}
          />
        </WidgetAPIContext.Provider>
      );
    }
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
