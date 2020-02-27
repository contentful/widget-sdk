import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import createFetcherComponent from 'app/common/createFetcherComponent';
import PageExtension from '../PageExtension';
import * as advancedExtensibilityFeature from 'app/settings/extensions/services/AdvancedExtensibilityFeature';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder';
import BinocularsIllustration from 'svg/illustrations/binoculars-illustration.svg';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';

const PageExtensionFetcher = createFetcherComponent(async ({ extensionId, orgId }) => {
  const key = [NAMESPACE_EXTENSION, extensionId];
  const [isEnabled, widgets] = await Promise.all([
    advancedExtensibilityFeature.isEnabled(orgId),
    getCustomWidgetLoader().getByKeys([key])
  ]);

  if (!isEnabled) {
    throw new Error('advanced extensibility not enabled');
  }

  const [descriptor] = widgets;
  if (!descriptor) {
    throw new Error('no widget found ');
  }

  return descriptor;
});

const styles = {
  loading: css({ padding: tokens.spacingXl }),
  errorMessage: css({ paddingTop: tokens.spacingL }),
  binocularsImage: css({ margin: 'auto', width: '30vw' })
};

function ErrorMessage() {
  return (
    <div className={styles.errorMessage}>
      <div className={styles.binocularsImage}>
        <BinocularsIllustration />
      </div>
      <Placeholder
        title="This page doesn't exist"
        text="You might have mistyped the address, or the page might have moved."
      />
    </div>
  );
}

export default function PageExtensionRoute(props) {
  return (
    <PageExtensionFetcher extensionId={props.extensionId} orgId={props.orgId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return (
            <div className={styles.loading}>
              <SkeletonContainer>
                <SkeletonDisplayText numberOfLines={1} />
                <SkeletonBodyText numberOfLines={5} offsetTop={35} />
              </SkeletonContainer>
            </div>
          );
        }

        if (isError) {
          return <ErrorMessage />;
        }

        return <PageExtension bridge={props.bridge} descriptor={data} path={props.path} />;
      }}
    </PageExtensionFetcher>
  );
}

PageExtensionRoute.propTypes = {
  extensionId: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  bridge: PropTypes.object.isRequired
};
