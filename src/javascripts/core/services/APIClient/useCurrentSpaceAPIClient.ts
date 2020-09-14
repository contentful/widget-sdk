import * as React from 'react';
import { CurrentSpaceAPIClientContext } from './CurrentSpaceAPIClientContext';

export function useCurrentSpaceAPIClient() {
  return React.useContext(CurrentSpaceAPIClientContext);
}
