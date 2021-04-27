import React from 'react';
import { BundleCard } from './BundleCard';
import { AppBundleData } from '../AppEditor';
import { SectionHeading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import { AppDetailsStateContext } from '../AppDetails/AppDetailsStateContext';

const styles = {
  cardSpacing: css({
    marginBottom: tokens.spacingXs,
  }),
  sectionHeading: css({
    color: tokens.colorTextLight,
    marginBottom: tokens.spacingM,
  }),
};

enum States {
  NoBundles = 'NoBundles',
  NoPreviousBundles = 'NoPreviousBundles',
  PreviousBundles = 'PreviousBundles',
}

export const AllBundles = () => {
  const { bundles, setIsAppHosting, removeBundle } = React.useContext(HostingStateContext);
  const { draftDefinition, setDraftDefinition, savedDefinition } = React.useContext(
    AppDetailsStateContext
  );

  const setNewAppBundle = (bundle: AppBundleData) => {
    setIsAppHosting(true);
    setDraftDefinition({
      ...draftDefinition,
      src: undefined,
      bundle: { sys: { type: 'Link', linkType: 'AppBundle', id: bundle.sys.id } },
    });
  };

  const bundlesToDisplay = React.useMemo(
    () =>
      bundles.filter(
        // Don't to render the active or staged bundle in this list
        ({ sys: { id } }) =>
          id !== draftDefinition.bundle?.sys.id && id !== savedDefinition.bundle?.sys.id
      ),
    [bundles, draftDefinition, savedDefinition]
  );

  const state =
    bundles.length === 0
      ? States.NoBundles
      : bundlesToDisplay.length === 0
      ? States.NoPreviousBundles
      : States.PreviousBundles;

  if (state === States.NoBundles) {
    return null;
  }

  if (state === States.NoPreviousBundles) {
    return (
      <>
        <SectionHeading className={styles.sectionHeading}>Previous Bundles</SectionHeading>
        <Paragraph>
          Previous bundles will appear here, along with the ability to promote them.
        </Paragraph>
      </>
    );
  }

  return (
    <>
      <SectionHeading className={styles.sectionHeading}>Previous Bundles</SectionHeading>
      {bundlesToDisplay.map((bundle) => {
        return (
          <BundleCard
            setNewAppBundle={setNewAppBundle}
            removeBundle={removeBundle}
            className={styles.cardSpacing}
            key={bundle.sys.id}
            bundle={bundle}
          />
        );
      })}
    </>
  );
};
