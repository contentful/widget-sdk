import React from 'react';

import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { ActiveBundle } from './ActiveBundle';
import { AllBundles } from './AllBundles';

export interface AppBundlesProps {
  onChange: (appDefinition: AppDefinitionWithBundle) => void;
  definition: AppDefinitionWithBundle;
  savedDefinition: AppDefinitionWithBundle;
  resetDefinitionBundle: () => void;
}
export const AppBundles: React.FC<AppBundlesProps> = ({
  onChange,
  definition,
  savedDefinition,
  resetDefinitionBundle,
}) => (
  <>
    <ActiveBundle
      resetDefinitionBundle={resetDefinitionBundle}
      definition={definition}
      savedDefinition={savedDefinition}
      onChange={onChange}
    />
    <AllBundles savedDefinition={savedDefinition} definition={definition} onChange={onChange} />
  </>
);
