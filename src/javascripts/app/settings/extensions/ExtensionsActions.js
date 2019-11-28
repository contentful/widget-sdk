import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher';
import {
  Dropdown,
  Button,
  DropdownList,
  DropdownListItem,
  Notification
} from '@contentful/forma-36-react-components';
import ExamplePickerModal from './dialogs/ExamplePickerModal';
import GitHubInstallerModal from './dialogs/GitHubInstallerModal';
import { toInternalFieldType } from 'widgets/FieldTypes';
import getExtensionParameterIds from './getExtensionParameterIds';
import * as Analytics from 'analytics/Analytics';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { getModule } from 'NgRegistry';

const SDK_URL = 'https://unpkg.com/contentful-ui-extensions-sdk@3';

function install({ extension, type, url }) {
  const spaceContext = getModule('spaceContext');
  const $state = getModule('$state');

  return spaceContext.cma
    .createExtension({ extension })
    .then(res => {
      const extensionId = res.sys.id;
      getCustomWidgetLoader().evict(extensionId);

      return $state.go('^.detail', { extensionId });
    })
    .then(() => {
      Notification.success('Your new extension was successfully created.');

      if (type && url) {
        Analytics.track('extension:install', {
          type,
          url,
          name: extension.name,
          src: extension.src,
          fieldTypes: toInternalFieldType(extension.fieldTypes),
          ...getExtensionParameterIds(extension)
        });
      }
    })
    .catch(err => handleInstallError(err));
}

function handleInstallError(err) {
  const wasCancelled = err && Object.keys(err).length === 1 && err.cancelled === true;

  if (err && !wasCancelled) {
    Notification.error('There was an error while creating your extension.');
    return false;
  } else {
    return true;
  }
}

export const openExamplePicker = async () => {
  const { data, err } = await ModalLauncher.open(({ isShown, onClose }) => (
    <ExamplePickerModal
      isShown={isShown}
      onConfirm={data => {
        onClose({ data });
      }}
      onCancel={err => {
        onClose({ err: err instanceof Error ? err : { cancelled: true } });
      }}
    />
  ));

  if (data) {
    return install({ ...data, type: 'github-example' });
  } else {
    return handleInstallError(err);
  }
};

export const openGitHubInstaller = async (extensionUrl = null, extensionUrlReferrer = null) => {
  const { data, err } = await ModalLauncher.open(({ onClose, isShown }) => (
    <GitHubInstallerModal
      isShown={isShown}
      extensionUrl={extensionUrl || ''}
      onConfirm={data => {
        onClose({ data });
      }}
      onCancel={err => {
        onClose({ err: err instanceof Error ? err : { cancelled: true } });
      }}
    />
  ));

  if (data) {
    return install({ ...data, type: extensionUrlReferrer || 'github' });
  } else {
    return handleInstallError(err);
  }
};

export function createExtension() {
  return install({
    extension: {
      name: 'New extension',
      fieldTypes: [{ type: 'Symbol' }],
      srcdoc:
        [
          '<!DOCTYPE html>',
          `<script src="${SDK_URL}"></script>`,
          '<script>',
          'window.contentfulExtension.init(function(api) {',
          '  console.log(api.field.getValue());',
          '});',
          '</script>'
        ].join('\n') + '\n'
    }
  });
}

export default class ExtensionsActions extends React.Component {
  state = {
    isOpen: false
  };

  close = () => {
    this.setState({ isOpen: false });
  };

  toggle = () => {
    this.setState(state => ({
      isOpen: !state.isOpen
    }));
  };

  render() {
    return (
      <Dropdown
        isOpen={this.state.isOpen}
        onClose={this.close}
        position="bottom-right"
        toggleElement={
          <Button
            onClick={this.toggle}
            buttonType="primary"
            indicateDropdown
            testId="extensions.add">
            Add extension
          </Button>
        }>
        <DropdownList>
          <DropdownListItem
            onClick={() => {
              createExtension();
              this.close();
            }}
            testId="extensions.add.new">
            Add a new extension
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              openExamplePicker();
              this.close();
            }}>
            Install an example
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              openGitHubInstaller();
              this.close();
            }}>
            Install from Github
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    );
  }
}
