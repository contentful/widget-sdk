import { HostingDropzone } from '../AppEditor/HostingDropzone';
import { AppBundleData } from '../AppEditor';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { css } from 'emotion';
import React from 'react';
import { BundleCard } from './BundleCard';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import tokens from '@contentful/forma-36-tokens';
import { Tag, Paragraph, TextLink, Card, Icon } from '@contentful/forma-36-react-components';

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
  cardTag: css({
    marginRight: tokens.spacingXs,
  }),
  stagedBundle: css({
    borderTop: 'none',
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    background: tokens.colorElementLightest,
    marginBottom: tokens.spacingXl,
  }),
  cancelText: css({
    marginRight: tokens.spacingS,
  }),
  bold: css({
    fontWeight: 'bold',
  }),
  arrowIconContainer: css({
    position: 'relative',
  }),
  arrowIcon: css({
    background: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementMid}`,
    content: ' ',
    width: '40px',
    height: '40px',
    position: 'absolute',
    left: '50%',
    borderRadius: '50%',
    bottom: '-20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

interface ActiveBundleProps {
  onChange: (appDefinition: AppDefinitionWithBundle) => void;
  definition: AppDefinitionWithBundle;
  savedDefinition: AppDefinitionWithBundle;
  resetDefinitionBundle: () => void;
}

export const ActiveBundle: React.FC<ActiveBundleProps> = ({
  onChange,
  definition,
  savedDefinition,
  resetDefinitionBundle,
}) => {
  const { bundles, setIsAppHosting } = React.useContext(HostingStateContext);
  const setNewAppBundle = (bundle: AppBundleData) => {
    setIsAppHosting(true);
    onChange({
      ...definition,
      src: undefined,
      bundle: { sys: { type: 'Link', linkType: 'AppBundle', id: bundle.sys.id } },
    });
  };

  const activeBundle = bundles.find(({ sys: { id } }) => id === savedDefinition.bundle?.sys.id);

  const stagedBundle = getStagedBundle(savedDefinition, definition, bundles);

  return (
    <>
      {activeBundle ? (
        <BundleCard className={styles.attachedCard} bundle={activeBundle}>
          <Tag className={styles.cardTag} tagType={'positive'}>
            Active
          </Tag>
        </BundleCard>
      ) : savedDefinition.src ? (
        <SelfHostedCard src={savedDefinition.src} />
      ) : (
        <NotHostedCard />
      )}
      {stagedBundle ? (
        <>
          <ArrowIcon />
          <StagedBundle bundle={stagedBundle} unstageBundle={resetDefinitionBundle} />
        </>
      ) : (
        <HostingDropzone
          containerStyles={styles.container}
          onAppBundleCreated={setNewAppBundle}
          definition={definition}
        />
      )}
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
  bundle: AppBundleData;
  unstageBundle: () => void;
}
const StagedBundle: React.FC<StagedBundleProps> = ({ bundle, unstageBundle }) => (
  <BundleCard className={styles.stagedBundle} bundle={bundle}>
    <Paragraph className={styles.cancelText}>
      This bundle becomes active on save.{' '}
      <TextLink onClick={unstageBundle} linkType="negative">
        Cancel
      </TextLink>
    </Paragraph>
  </BundleCard>
);

interface SelfHostedCardProps {
  src: string;
}
const SelfHostedCard: React.FC<SelfHostedCardProps> = ({ src }) => {
  return (
    <Card className={styles.attachedCard}>
      <Paragraph className={styles.bold}>Self-hosted</Paragraph>
      <Paragraph>{src}</Paragraph>
    </Card>
  );
};

const NotHostedCard: React.FC = () => {
  return (
    <Card className={styles.attachedCard}>
      <Paragraph className={styles.bold}>Not currently hosted</Paragraph>
    </Card>
  );
};

const ArrowIcon: React.FC = () => (
  <div className={styles.arrowIconContainer}>
    <div className={styles.arrowIcon}>
      <Icon color="muted" size="medium" icon="ChevronUp" />
    </div>
  </div>
);
