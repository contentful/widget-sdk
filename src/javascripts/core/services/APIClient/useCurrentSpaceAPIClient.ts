import * as React from 'react';
import {
  CurrentSpaceAPIClientContext,
  CurrentSpaceAPIClientContextProps,
} from './CurrentSpaceAPIClientContext';

export function useCurrentSpaceAPIClient(): CurrentSpaceAPIClientContextProps {
  return React.useContext(CurrentSpaceAPIClientContext);
}
