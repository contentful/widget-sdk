import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { reducer } from './SidebarConfigurationReducer.es6';
import {
  convertInternalStateToConfiguration,
  convertConfigirationToInternalState
} from './service/SidebarSync.es6';
import WidgetsConfiguration from './WidgetsConfiguration.es6';
import WidgetParametersConfiguration from './WidgetParametersConfiguration.es6';

function SidebarConfiguration(props) {
  const [state, dispatch] = useReducer(
    reducer,
    convertConfigirationToInternalState(props.configuration, props.extensions)
  );

  useEffect(() => {
    props.onUpdateConfiguration(convertInternalStateToConfiguration(state));
  }, [state]);

  return (
    <div className="sidebar-configuration">
      {state.configurableWidget === null && (
        <WidgetsConfiguration state={state} dispatch={dispatch} />
      )}
      {state.configurableWidget !== null && (
        <WidgetParametersConfiguration widget={state.configurableWidget} dispatch={dispatch} />
      )}
    </div>
  );
}

SidebarConfiguration.propTypes = {
  configuration: PropTypes.array,
  extensions: PropTypes.array,
  onUpdateConfiguration: PropTypes.func.isRequired
};

export default SidebarConfiguration;
