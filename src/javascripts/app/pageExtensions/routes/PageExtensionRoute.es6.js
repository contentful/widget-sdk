import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import PageExtension from '../PageExtension.es6';
import * as advancedExtensibilityFeature from 'app/settings/extensions/services/AdvancedExtensibilityFeature.es6';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import BinocularsIllustration from 'svg/binoculars-illustration.es6';

const PageExtensionFetcher = createFetcherComponent(({ extensionId, orgId, extensionLoader }) => {
  return Promise.all([
    advancedExtensibilityFeature.isEnabled(orgId),
    extensionLoader.getExtensionById(extensionId)
  ]);
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
    <PageExtensionFetcher
      extensionId={props.extensionId}
      orgId={props.orgId}
      extensionLoader={props.extensionLoader}>
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

        const [isEnabled, extensionResponse] = data;

        if (!isEnabled) {
          return <ErrorMessage />;
        }

        return (
          <PageExtension bridge={props.bridge} extension={extensionResponse} path={props.path} />
        );
      }}
    </PageExtensionFetcher>
  );
}

PageExtensionRoute.propTypes = {
  extensionId: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  extensionLoader: PropTypes.object.isRequired,
  bridge: PropTypes.object.isRequired
};
