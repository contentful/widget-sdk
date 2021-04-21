import React, { useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { reducer } from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetsConfigurationReducer';
import { useAsync } from 'core/hooks';
import {
  convertInternalStateToConfiguration,
  convertConfigurationToInternalState,
} from './service/SidebarSync';
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import { getEntryConfiguration } from './defaults';
import WidgetParametersConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetParametersConfiguration';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, defaultAvailableItems]);

  return (
    <div className={styles.container}>
      {state.configurableWidget === null && (
        <WidgetsConfiguration
          state={state}
          dispatch={dispatch}
          defaultAvailableItems={defaultAvailableItems}
          configuration={{
            location: 'Sidebar',
            description: 'Configure the sidebar for this content type.',
            inAppHelpMedium: 'use-customer-sidebar-available-items',
          }}
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
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentOrganizationId: organizationId,
  } = useSpaceEnvContext();

  const { isLoading, error, data } = useAsync(
    useCallback(async () => {
      return await getEntryConfiguration({ spaceId, environmentId, organizationId });
    }, [spaceId, environmentId, organizationId])
  );

  if (isLoading || error) {
    return null;
  }

  return <SidebarConfiguration {...props} defaultAvailableItems={data} />;
};
