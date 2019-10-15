import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { reducer } from './SidebarConfigurationReducer.es6';
import useAsync from 'app/common/hooks/useAsync.es6';
import {
  convertInternalStateToConfiguration,
  convertConfigirationToInternalState
} from './service/SidebarSync.es6';
import WidgetsConfiguration from './WidgetsConfiguration.es6';
import { getEntryConfiguration } from './defaults.es6';
import WidgetParametersConfiguration from './WidgetParametersConfiguration.es6';

const styles = {
  container: css({
    margin: '0 auto',
    marginBottom: '60px'
  })
};

function SidebarConfiguration(props) {
  const { onUpdateConfiguration, defaultAvailableItems, extensions, configuration } = props;

  const [state, dispatch] = useReducer(
    reducer,
    convertConfigirationToInternalState(configuration, extensions, defaultAvailableItems)
  );

  useEffect(() => {
    onUpdateConfiguration(convertInternalStateToConfiguration(state, defaultAvailableItems));
  }, [state, onUpdateConfiguration, defaultAvailableItems]);

  return (
    <div className={styles.container}>
      {state.configurableWidget === null && (
        <WidgetsConfiguration
          state={state}
          dispatch={dispatch}
          defaultAvailableItems={defaultAvailableItems}
        />
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
  onUpdateConfiguration: PropTypes.func.isRequired,
  defaultAvailableItems: PropTypes.array.isRequired
};

export default props => {
  const { isLoading, error, data } = useAsync(getEntryConfiguration);

  if (isLoading || error) {
    return null;
  }

  return <SidebarConfiguration {...props} defaultAvailableItems={data} />;
};