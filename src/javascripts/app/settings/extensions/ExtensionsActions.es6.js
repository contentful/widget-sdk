import React from 'react';
import spaceContext from 'spaceContext';
import $state from '$state';
import notification from 'notification';
import modalDialog from 'modalDialog';
import { Dropdown, Button, DropdownList, DropdownListItem } from '@contentful/ui-component-library';
import { toInternalFieldType } from './FieldTypes.es6';
import getExtensionParameterIds from './getExtensionParameterIds.es6';
import { track } from 'analytics/Analytics.es6';

const SDK_URL = 'https://unpkg.com/contentful-ui-extensions-sdk@3';

function install({ extension, type, url }) {
  return spaceContext.cma
    .createExtension({ extension })
    .then(res => $state.go('.detail', { extensionId: res.sys.id }))
    .then(() => {
      notification.info('Your new extension was successfully created.');

      if (type && url) {
        track('extension:install', {
          type,
          url,
          name: extension.name,
          src: extension.src,
          fieldTypes: toInternalFieldType(extension.fieldTypes),
          ...getExtensionParameterIds(extension)
        });
      }
    });
}

function handleInstallError(err) {
  const wasCancelled = err && Object.keys(err).length === 1 && err.cancelled === true;

  if (err && !wasCancelled) {
    notification.error('There was an error while creating your extension.');
    return Promise.reject(err);
  }
}

export function openExamplePicker() {
  return modalDialog
    .open({
      template:
        '<react-component class="modal-background" name="app/settings/extensions/ExamplePicker.es6" props="props" />',
      controller: $scope => {
        $scope.props = {
          onConfirm: value => $scope.dialog.confirm(value),
          onCancel: err => $scope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
        };
      }
    })
    .promise.then(data => install(data))
    .catch(err => {
      handleInstallError(err);
    });
}

export function openGitHubInstaller(extensionUrl = null) {
  return modalDialog
    .open({
      template:
        '<react-component class="modal-background" name="app/settings/extensions/GitHubInstaller.es6" props="props" />',
      controller: $scope => {
        $scope.props = {
          extensionUrl: extensionUrl || '',
          onConfirm: value => $scope.dialog.confirm(value),
          onCancel: err => $scope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
        };
      }
    })
    .promise.then(data => install(data))
    .catch(err => {
      handleInstallError(err);
    });
}

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
  }).catch(err => {
    handleInstallError(err);
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
              openGitHubInstaller(null);
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
