import React from 'react';
import { BundleCard } from './BundleCard';
import { AppBundleData } from '../AppEditor';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';

const styles = {
  cardSpacing: css({
    marginBottom: tokens.spacingXs,
  }),
};

interface AllBundlesProps {
  definition: AppDefinitionWithBundle;
  savedDefinition: AppDefinitionWithBundle;
  onChange: (appDefinition: AppDefinitionWithBundle) => void;
}
export const AllBundles: React.FC<AllBundlesProps> = ({
  definition,
  savedDefinition,
  onChange,
}) => {
  const { bundles, setIsAppHosting, removeBundle } = React.useContext(HostingStateContext);

  const setNewAppBundle = (bundle: AppBundleData) => {
    setIsAppHosting(true);
    onChange({
      ...definition,
      src: undefined,
      bundle: { sys: { type: 'Link', linkType: 'AppBundle', id: bundle.sys.id } },
    });
  };

  return (
    <>
      {bundles.map((bundle) => {
        const id = bundle.sys.id;

        // Don't to render the active or staged bundle in this list
        return id !== definition.bundle?.sys.id && id !== savedDefinition.bundle?.sys.id ? (
          <BundleCard
            setNewAppBundle={setNewAppBundle}
            removeBundle={removeBundle}
            className={styles.cardSpacing}
            key={bundle.sys.id}
            bundle={bundle}
          />
        ) : null;
      })}
    </>
  );
};
