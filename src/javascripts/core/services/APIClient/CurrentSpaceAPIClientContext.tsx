import * as React from 'react';
import { createAPIClient } from './utils';
import { useSpaceEnvContext } from '../SpaceEnvContext/useSpaceEnvContext';
import APIClient from 'data/APIClient';

type CurrentSpaceAPIClientContextProps = APIClient | null;

export const CurrentSpaceAPIClientContext = React.createContext<CurrentSpaceAPIClientContextProps>(
  null
);

export const CurrentSpaceAPIClientProvider: React.FC<{}> = (props) => {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const [client, setClient] = React.useState(createAPIClient(currentSpaceId, currentEnvironmentId));

  React.useEffect(() => {
    setClient(createAPIClient(currentSpaceId, currentEnvironmentId));
  }, [currentSpaceId, currentEnvironmentId]);

  return (
    <CurrentSpaceAPIClientContext.Provider value={client}>
      {props.children}
    </CurrentSpaceAPIClientContext.Provider>
  );
};
