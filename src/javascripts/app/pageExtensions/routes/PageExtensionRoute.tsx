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
import {
  Widget,
  WidgetLocation,
  WidgetNamespace,
  WidgetRenderer,
} from '@contentful/widget-renderer';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';

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
  useNewWidgetLoaderInPageLocation: boolean;
  createPageExtensionSDK: ({
    widget,
    parameters,
  }: {
    widget: Widget;
    parameters: any;
  }) => PageExtensionSDK;
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

        if (props.useNewWidgetLoaderInPageLocation) {
          const parameters = {
            instance: {},
            invocation: { path: props.path },
            installation: widget.parameters.values.installation,
          };

          const sdk = props.createPageExtensionSDK({ widget, parameters });

          return <WidgetRenderer location={WidgetLocation.PAGE} sdk={sdk} widget={widget} />;
        } else {
          return <PageExtension bridge={props.bridge} widget={widget} path={props.path} />;
        }
      }}
    </PageExtensionFetcher>
  );
}
