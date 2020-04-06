import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { reducer } from './SidebarConfigurationReducer';
import { useAsync } from 'app/common/hooks';
import {
  convertInternalStateToConfiguration,
  convertConfigurationToInternalState,
} from './service/SidebarSync';
import WidgetsConfiguration from './WidgetsConfiguration';
import { getEntryConfiguration } from './defaults';
import WidgetParametersConfiguration from './WidgetParametersConfiguration';

const styles = {
  container: css({
    margin: '0 auto',
    marginBottom: '60px',
  }),
};

function SidebarConfiguration(props) {
  const { onUpdateConfiguration, defaultAvailableItems, extensions, configuration } = props;

  const [state, dispatch] = useReducer(
    reducer,
    convertConfigurationToInternalState(configuration, extensions, defaultAvailableItems)
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
  defaultAvailableItems: PropTypes.array.isRequired,
};

export default (props) => {
  const { isLoading, error, data } = useAsync(getEntryConfiguration);

  if (isLoading || error) {
    return null;
  }

  return <SidebarConfiguration {...props} defaultAvailableItems={data} />;
};
