import React from 'react';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import {
  Dropdown,
  Button,
  DropdownList,
  DropdownListItem,
  Notification,
} from '@contentful/forma-36-react-components';
import { GitHubInstallerModal } from './dialogs/GitHubInstallerModal';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { getExtensionParameterIds } from './getExtensionParameterIds';
import * as Analytics from 'analytics/Analytics';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { useSpaceEnvCMAClient, BatchedPlainCmaClient } from 'core/services/usePlainCMAClient';
import type { CreateUIExtensionProps } from 'contentful-management/types';
import { useRouteNavigate, useNavigationState } from 'core/react-routing';

const SDK_URL = 'https://unpkg.com/@contentful/app-sdk@3';

async function install(
  cma: BatchedPlainCmaClient,
  { extension, type, url }: { extension: CreateUIExtensionProps; type?: string; url?: string }
): Promise<{ navigate: true; extensionId: string } | { navigate: false }> {
  try {
    // @ts-expect-error types in cma client are incorrect
    const res = await cma.extension.create({}, { extension });
    const loader = await getCustomWidgetLoader();
    const extensionId = res.sys.id;

    loader.evict({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: extensionId });

    Notification.success('Your new extension was successfully created.');

    if (type && url) {
      Analytics.track('extension:install', {
        type,
        url,
        name: extension.name,
        src: extension.src,
        fieldTypes: toInternalFieldType(extension.fieldTypes),
        ...getExtensionParameterIds(extension),
      });
    }

    return { navigate: true, extensionId };
  } catch (err) {
    return handleInstallError(err);
  }
}

function handleInstallError(err) {
  const wasCancelled = err && Object.keys(err).length === 1 && err.cancelled === true;

  if (err && !wasCancelled) {
    Notification.error('There was an error while creating your extension.');
  }
  return { navigate: false } as const;
}

export const openGitHubInstaller = async (
  cma: BatchedPlainCmaClient,
  extensionUrl: string | null = null,
  extensionUrlReferrer: string | null = null
) => {
  const { data, err } = await ModalLauncher.open<{
    data?: { extension: CreateUIExtensionProps; url?: string };
    err?: any;
  }>(({ onClose, isShown }) => (
    <GitHubInstallerModal
      isShown={isShown}
      extensionUrl={extensionUrl || ''}
      onConfirm={(data) => {
        onClose({ data });
      }}
      onCancel={(err) => {
        onClose({ err: err instanceof Error ? err : { cancelled: true } });
      }}
    />
  ));

  if (data) {
    return install(cma, { ...data, type: extensionUrlReferrer || 'github' });
  } else {
    return handleInstallError(err);
  }
};

export function createExtension(cma: BatchedPlainCmaClient) {
  return install(cma, {
    extension: {
      name: 'New extension',
      fieldTypes: [{ type: 'Symbol' }],
      sidebar: false,
      srcdoc:
        [
          '<!DOCTYPE html>',
          `<script src="${SDK_URL}"></script>`,
          '<script>',
          'window.contentfulExtension.init(function(api) {',
          '  console.log(api.field.getValue());',
          '});',
          '</script>',
        ].join('\n') + '\n',
    },
  });
}

export function ExtensionsActions() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { spaceEnvCMAClient } = useSpaceEnvCMAClient();
  const navigate = useRouteNavigate();

  const navigationState = useNavigationState<{ extensionUrl?: string; referrer?: string }>();
  const extensionUrl = navigationState?.extensionUrl || '';
  const extensionUrlReferrer = navigationState?.referrer || null;

  React.useEffect(() => {
    if (extensionUrl) {
      openGitHubInstaller(spaceEnvCMAClient, extensionUrl, extensionUrlReferrer).then((result) => {
        if (result.navigate) {
          navigate({ path: 'extensions.detail', extensionsId: result.extensionId });
        }
      });
    }
  }, [extensionUrl, extensionUrlReferrer, spaceEnvCMAClient, navigate]);

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = React.useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={close}
      position="bottom-right"
      toggleElement={
        <Button onClick={toggle} buttonType="primary" indicateDropdown testId="extensions.add">
          Add extension
        </Button>
      }>
      <DropdownList>
        <DropdownListItem
          onClick={() => {
            createExtension(spaceEnvCMAClient).then((result) => {
              if (result.navigate) {
                navigate({ path: 'extensions.detail', extensionsId: result.extensionId });
              }
            });
            close();
          }}
          testId="extensions.add.new">
          Add a new extension
        </DropdownListItem>
        <DropdownListItem
          onClick={() => {
            openGitHubInstaller(spaceEnvCMAClient).then((result) => {
              if (result.navigate) {
                navigate({ path: 'extensions.detail', extensionsId: result.extensionId });
              }
            });
            close();
          }}>
          Install from Github
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}
