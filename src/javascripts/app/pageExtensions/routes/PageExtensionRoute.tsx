import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import createFetcherComponent from 'app/common/createFetcherComponent';
import PageExtension from '../PageExtension';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder';
import BinocularsIllustration from 'svg/illustrations/binoculars-illustration.svg';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { WidgetLocation, WidgetNamespace, WidgetRenderer } from '@contentful/widget-renderer';
import { createPageExtensionSDK } from 'app/widgets/ExtensionSDKs/createPageExtensionSDK';

const PageExtensionFetcher = createFetcherComponent(async ({ extensionId, orgId }) => {
  const loader = await getCustomWidgetLoader();

  const [isEnabled, widget] = await Promise.all([
    AdvancedExtensibilityFeature.isEnabled(orgId),
    loader.getOne({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: extensionId }),
  ]);

  if (!isEnabled) {
    throw new Error('advanced extensibility not enabled');
  }

  if (!widget) {
    throw new Error('no widget found ');
  }

  return widget;
});

const styles = {
  loading: css({ padding: tokens.spacingXl }),
  errorMessage: css({ paddingTop: tokens.spacingL }),
  binocularsImage: css({ margin: 'auto', width: '30vw' }),
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

interface PageExtensionRouteProps {
  extensionId: string;
  orgId: string;
  path: string;
  bridge: any;
  spaceContext: any;
  useNewWidgetLoaderInPageLocation: boolean;
}

export default function PageExtensionRoute(props: PageExtensionRouteProps) {
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

        if (props.useNewWidgetLoaderInPageLocation) {
          const parameters = {
            instance: {},
            invocation: { path: props.path },
            installation: data.parameters.values.installation,
          };

          const sdk = createPageExtensionSDK({
            spaceContext: props.spaceContext,
            widgetNamespace: data.namespace,
            widgetId: data.id,
            parameters,
          });

          return <WidgetRenderer location={WidgetLocation.PAGE} sdk={sdk} widget={data} />;
        } else {
          return <PageExtension bridge={props.bridge} widget={data} path={props.path} />;
        }
      }}
    </PageExtensionFetcher>
  );
}
