import { HostingDropzone } from '../AppEditor/HostingDropzone';
import { AppBundleData, AppBundleDataWithCreator } from '../AppEditor';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { css } from 'emotion';
import React from 'react';
import { BundleCard } from './BundleCard';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import tokens from '@contentful/forma-36-tokens';
import {
  Tag,
  Paragraph,
  TextLink,
  Card,
  Icon,
  Subheading,
  SectionHeading,
} from '@contentful/forma-36-react-components';

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
  marginBottom: css({
    marginBottom: tokens.spacingXs,
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
  notHostedInfo: css({
    marginBottom: tokens.spacingM,
  }),
  sectionHeading: css({
    color: tokens.colorTextLight,
    marginBottom: tokens.spacingM,
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

  const hasExistingBundles = bundles.length > 0;

  const activeBundle = bundles.find(({ sys: { id } }) => id === savedDefinition.bundle?.sys.id);

  const hasCurrentHosting = !!(activeBundle || savedDefinition.src);

  const stagedBundle = getStagedBundle(savedDefinition, definition, bundles);

  if (!hasExistingBundles) {
    return (
      <>
        <NotHosted />
        <HostingDropzone onAppBundleCreated={setNewAppBundle} definition={definition} />
      </>
    );
  } else {
    return (
      <>
        <SectionHeading className={styles.sectionHeading}>Active Bundle</SectionHeading>
        {activeBundle ? (
          <BundleCard className={styles.attachedCard} bundle={activeBundle}>
            <Tag className={styles.cardTag} tagType={'positive'}>
              Active
            </Tag>
          </BundleCard>
        ) : savedDefinition.src ? (
          <SelfHostedCard src={savedDefinition.src} />
        ) : null}
        {stagedBundle ? (
          <>
            <StagedBundle
              hasCurrentHosting={hasCurrentHosting}
              bundle={stagedBundle}
              unstageBundle={resetDefinitionBundle}
            />
          </>
        ) : (
          <HostingDropzone
            containerStyles={activeBundle || savedDefinition.src ? styles.container : ''}
            onAppBundleCreated={setNewAppBundle}
            definition={definition}
          />
        )}
      </>
    );
  }
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
  hasCurrentHosting: boolean;
}
const StagedBundle: React.FC<StagedBundleProps> = ({
  bundle,
  unstageBundle,
  hasCurrentHosting,
}) => (
  <>
    {hasCurrentHosting && <ArrowIcon />}
    <BundleCard className={hasCurrentHosting ? styles.stagedBundle : ''} bundle={bundle}>
      <Paragraph className={styles.cancelText}>
        This bundle becomes active on save.{' '}
        <TextLink onClick={unstageBundle} linkType="negative">
          Cancel
        </TextLink>
      </Paragraph>
    </BundleCard>
  </>
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

const NotHosted: React.FC = () => {
  return (
    <div className={styles.notHostedInfo}>
      <Subheading className={styles.marginBottom}>Host apps on Contentful</Subheading>
      <Paragraph className={styles.marginBottom}>
        Ready to go live? Host your app frontend with Contentful by drag and dropping your output
        folder below. Only getting started? Use npx create-contentful-app init in your terminal to
        bootstrap an app.
      </Paragraph>
      <TextLink>Learn more about hosting your app</TextLink>
    </div>
  );
};

const ArrowIcon: React.FC = () => (
  <div className={styles.arrowIconContainer}>
    <div className={styles.arrowIcon}>
      <Icon color="muted" size="medium" icon="ChevronUp" />
    </div>
  </div>
);
