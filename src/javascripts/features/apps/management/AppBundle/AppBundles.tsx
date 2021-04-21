import React from 'react';

import { ActiveBundle } from './ActiveBundle';
import { AllBundles } from './AllBundles';

export interface AppBundlesProps {
  resetDefinitionBundle: () => void;
}
export const AppBundles: React.FC<AppBundlesProps> = ({ resetDefinitionBundle }) => (
  <>
    <ActiveBundle resetDefinitionBundle={resetDefinitionBundle} />
    <AllBundles />
  </>
);
