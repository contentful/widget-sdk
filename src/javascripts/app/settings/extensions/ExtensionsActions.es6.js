import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import {
  Dropdown,
  Button,
  DropdownList,
  DropdownListItem,
  Notification
} from '@contentful/forma-36-react-components';
import ExamplePickerModal from './dialogs/ExamplePickerModal.es6';
import GitHubInstallerModal from './dialogs/GitHubInstallerModal.es6';
import { toInternalFieldType } from 'widgets/FieldTypes.es6';
import getExtensionParameterIds from './getExtensionParameterIds.es6';
import * as Analytics from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const $state = getModule('$state');

const SDK_URL = 'https://unpkg.com/contentful-ui-extensions-sdk@3';

function install({ extension, type, url }) {
  return spaceContext.cma
    .createExtension({ extension })
    .then(res => $state.go('^.detail', { extensionId: res.sys.id }))
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

class ExtensionsActions extends React.Component {
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

export default ExtensionsActions;
