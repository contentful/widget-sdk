import React from 'react';

import { ActiveBundle } from './ActiveBundle';
import { AllBundles } from './AllBundles';
import {
  Paragraph,
  SectionHeading,
  Subheading,
  TextLink,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';

const styles = {
  sectionHeading: css({
    color: tokens.colorTextLight,
    marginBottom: tokens.spacingM,
  }),
  notHostedInfo: css({
    marginBottom: tokens.spacingM,
  }),
  marginBottom: css({
    marginBottom: tokens.spacingXs,
  }),
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
      <TextLink
        href="https://www.contentful.com/developers/docs/extensibility/app-framework/hosting-an-app"
        target="_blank"
        rel="noopener noreferrer">
        Learn more about hosting your app
      </TextLink>
    </div>
  );
};

export const AppBundles: React.FC = () => {
  const { bundles } = React.useContext(HostingStateContext);
  const hasExistingBundles = bundles.length > 0;
  return (
    <>
      {hasExistingBundles ? (
        <SectionHeading className={styles.sectionHeading}>Active Bundle</SectionHeading>
      ) : (
        <NotHosted />
      )}
      <ActiveBundle />
      <AllBundles />
    </>
  );
};
