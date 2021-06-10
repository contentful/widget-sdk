import { Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Validator } from '@contentful/editorial-primitives';
import {
  WidgetLoader,
  WidgetLocation,
  WidgetNamespace,
  WidgetRenderer,
} from '@contentful/widget-renderer';
import { createEntryEditorWidgetSDK } from '@contentful/experience-sdk';
import { createEditorWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { usePubSubClient } from 'core/hooks';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { css } from 'emotion';
import React from 'react';
import { LegacyWidget, toRendererWidget } from 'widgets/WidgetCompat';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import {
  createDialogCallbacks,
  createNavigatorCallbacks,
  createSpaceCallbacks,
} from '../widgets/ExtensionSDKs/callbacks';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import LocaleStore from 'services/localeStore';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { FLAGS } from 'LaunchDarkly';
import * as PublicContentType from 'widgets/PublicContentType';
import { createCmaDocumentWithApiNames } from '../widgets/ExtensionSDKs/createCmaDocumentWithApiNames';
import { useVariation } from 'core/hooks/useVariation';
import { createEditorCallbacks } from '../widgets/ExtensionSDKs/callbacks/editor';
import { getUserWithMinifiedSys } from 'app/widgets/ExtensionSDKs/utils';

const styles = {
  installationNote: css({
    margin: tokens.spacingM,
  }),
};

interface Props {
  scope: {
    editorData: any;
    entityInfo: any;
    otDoc: any;
    localeData: any;
    preferences: any;
    fields: any;
    widgets: any;
    fieldLocaleListeners: any;
  };
  extension: {
    widgetId: string;
    diasbled: boolean;
    widgetNamespace: WidgetNamespace;
    problem: string;
    descriptor: LegacyWidget;
    parameters: {
      instance: Record<string, any>;
      installation: Record<string, any>;
    };
  };
  validator: Validator.ValidatorAPI;
}

const CustomEditorExtensionRenderer = (props: Props) => {
  const { extension, scope } = props;
  const { descriptor, parameters } = extension;

  const {
    currentEnvironment,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceId,
    currentSpaceData,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { customWidgetPlainClient } = useCurrentSpaceAPIClient();
  const pubSubClient = usePubSubClient();

  const [widgetLoader, setWidgetLoader] = React.useState<WidgetLoader>();
  React.useEffect(() => {
    getCustomWidgetLoader().then(setWidgetLoader);
  }, []);

  const [useExperienceSDK] = useVariation<boolean>(
    FLAGS.EXPERIENCE_SDK_ENTRY_EDITOR_LOCATION,
    false
  );

  if (
    !currentEnvironmentId ||
    !currentSpaceId ||
    !currentEnvironment ||
    !currentSpace ||
    !widgetLoader ||
    !customWidgetPlainClient ||
    !currentSpaceData ||
    !pubSubClient
  ) {
    return null;
  }

  if (extension.problem) {
    return (
      <Note noteType="warning" className={styles.installationNote}>
        <code>{extension.widgetId}</code> is saved in configuration, but not installed in this
        environment.
      </Note>
    );
  }

  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const widget = toRendererWidget(descriptor);
  const sdk: EditorExtensionSDK = useExperienceSDK
    ? createEntryEditorWidgetSDK({
        cma: customWidgetPlainClient,
        cmaDocument: createCmaDocumentWithApiNames(scope.otDoc, scope.entityInfo.contentType),
        contentType: PublicContentType.fromInternal(scope.entityInfo.contentType),
        validator: props.validator,
        user: getUserWithMinifiedSys(),
        widgetLoader,
        editorData: scope.editorData,
        widgetNamespace: widget.namespace,
        widgetParameters: widget.parameters,
        widgetId: extension.widgetId,
        spaceMembership: {
          sys: {
            id: currentSpaceData.spaceMember.sys.id,
          },
          admin: currentSpaceData.spaceMember.admin,
        },
        contentTypes: currentSpaceContentTypes.map(PublicContentType.fromInternal),
        environment: currentEnvironment,
        space: currentSpaceData,
        roles: currentSpaceData.spaceMember.roles.map(({ name, description }) => ({
          name,
          description: description ?? '',
        })),
        locales: {
          activeLocaleCode: LocaleStore.getFocusedLocale().code,
          defaultLocaleCode: LocaleStore.getDefaultLocale().code,
          list: LocaleStore.getLocales(),
        },
        callbacks: {
          navigator: createNavigatorCallbacks({
            spaceContext: {
              environmentId: currentEnvironmentId,
              spaceId: currentSpaceId,
              isMaster: isMasterEnvironment,
            },
            widgetRef: {
              widgetId: extension.widgetId,
              widgetNamespace: extension.widgetNamespace,
            },
          }),
          editor: createEditorCallbacks({
            getLocaleData: () => scope.localeData,
            getPreferences: () => scope.preferences,
          }),
          dialog: createDialogCallbacks(),
          space: createSpaceCallbacks({
            pubSubClient,
            cma: customWidgetPlainClient,
            environment: currentEnvironment,
          }),
        },
      })
    : createEditorWidgetSDK({
        editorData: scope.editorData,
        localeData: scope.localeData,
        preferences: scope.preferences,
        internalContentType: scope.entityInfo.contentType,
        widgetNamespace: extension.widgetNamespace,
        widgetId: extension.widgetId,
        parameters,
        doc: scope.otDoc,
        fieldLocaleListeners: scope.fieldLocaleListeners,
        contentTypes: currentSpaceContentTypes,
        environment: currentEnvironment,
        environmentId: currentEnvironmentId,
        environmentAliasId: currentEnvironmentAliasId,
        space: currentSpace,
        spaceId: currentSpaceId,
        pubSubClient,
      });

  return (
    <WidgetRenderer sdk={sdk} location={WidgetLocation.ENTRY_EDITOR} widget={widget} isFullSize />
  );
};

export default CustomEditorExtensionRenderer;
