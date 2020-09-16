import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder';
import BinocularsIllustration from 'svg/illustrations/binoculars-illustration.svg';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { Widget, WidgetNamespace } from '@contentful/widget-renderer';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { PageWidgetParameters, PageWidgetRenderer } from 'features/apps';

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
  createPageExtensionBridge: (widget: Widget) => any;
  useNewWidgetRendererInPageLocation: boolean;
  createPageExtensionSDK: (widget: Widget, parameters: PageWidgetParameters) => PageExtensionSDK;
  environmentId: string;
}

export default function PageExtensionRoute(props: PageExtensionRouteProps) {
  return (
    <PageExtensionFetcher extensionId={props.extensionId} orgId={props.orgId}>
      {({ isLoading, isError, data: widget }) => {
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

        return (
          <PageWidgetRenderer
            useNewWidgetRendererInPageLocation={props.useNewWidgetRendererInPageLocation}
            createPageExtensionSDK={props.createPageExtensionSDK}
            widget={widget}
            createPageExtensionBridge={props.createPageExtensionBridge}
            path={props.path}
            environmentId={props.environmentId}
          />
        );
      }}
    </PageExtensionFetcher>
  );
}
