import { HostingDropzone } from '../AppEditor/HostingDropzone';
import { AppBundleData, AppBundleDataWithCreator } from '../AppEditor';
import { css } from 'emotion';
import React from 'react';
import { BundleCard } from './BundleCard';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import tokens from '@contentful/forma-36-tokens';
import { Tag, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { AppDetailsStateContext } from '../AppDetails/AppDetailsStateContext';

const styles = {
  attachedCard: css({
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
  }),
  container: css({
    borderTop: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
  }),
  firstBundle: css({
    marginBottom: tokens.spacingXl,
  }),
  bold: css({
    fontWeight: 'bold',
  }),
};

interface ActiveBundleProps {
  link?: { title: string; onLinkClick: () => void };
}

export const ActiveBundle: React.FC<ActiveBundleProps> = ({ link }) => {
  const { bundles, setIsAppHosting } = React.useContext(HostingStateContext);
  const { draftDefinition, setDraftDefinition, savedDefinition, resetDefinitionBundle } =
    React.useContext(AppDetailsStateContext);
  const setNewAppBundle = (bundle: AppBundleData) => {
    setIsAppHosting(true);
    setDraftDefinition({
      ...draftDefinition,
      src: undefined,
      bundle: { sys: { type: 'Link', linkType: 'AppBundle', id: bundle.sys.id } },
    });
  };

  const activeBundle = bundles.find(({ sys: { id } }) => id === savedDefinition.bundle?.sys.id);

  const stagedBundle = getStagedBundle(savedDefinition, draftDefinition, bundles);

  if (stagedBundle) {
    return <StagedBundle bundle={stagedBundle} unstageBundle={resetDefinitionBundle} />;
  }

  return (
    <>
      {activeBundle && (
        <BundleCard className={styles.attachedCard} bundle={activeBundle}>
          <Tag tagType={'positive'}>Active</Tag>
        </BundleCard>
      )}
      <HostingDropzone
        link={link}
        containerStyles={activeBundle ? styles.container : ''}
        onAppBundleCreated={setNewAppBundle}
        definition={draftDefinition}
      />
    </>
  );
};

const getStagedBundle = (savedDefinition, definition, bundles) => {
  const hasStagedBundle =
    definition.bundle && definition.bundle.sys.id !== savedDefinition.bundle?.sys.id;

  if (hasStagedBundle) {
    return bundles.find(({ sys: { id } }) => id === definition.bundle?.sys.id);
  }
};

interface StagedBundleProps {
  bundle: AppBundleDataWithCreator;
  unstageBundle: () => void;
}
const StagedBundle: React.FC<StagedBundleProps> = ({ bundle, unstageBundle }) => (
  <BundleCard className={styles.firstBundle} bundle={bundle}>
    <Paragraph>
      This bundle becomes active on save.{' '}
      <TextLink onClick={unstageBundle} linkType="negative">
        Cancel
      </TextLink>
    </Paragraph>
  </BundleCard>
);
