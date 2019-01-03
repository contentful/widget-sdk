import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import {
  Button,
  Dropdown,
  DropdownList,
  Notification
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionsSidebar, { DocsLink } from './ExtensionsSidebar.es6';

import EmptyExtensionIcon from './icons/EmptyExtensionIcon.es6';
import ExtensionsActions from './ExtensionsActions.es6';

import { openGitHubInstaller } from './ExtensionsActions.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

function deleteExtension(id, refresh) {
  return spaceContext.cma
    .deleteExtension(id)
    .then(refresh)
    .then(
      () => Notification.success('Your extension was successfully deleted.'),
      err => {
        Notification.error('There was an error while deleting your extension.');
        return Promise.reject(err);
      }
    );
}

class DeleteButton extends React.Component {
  static propTypes = {
    extension: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
  };

  state = {
    isOpen: false
  };

  render() {
    const { extension, onClick } = this.props;
    return (
      <div>
        <Dropdown
          isOpen={this.state.isOpen}
          onClose={() => this.setState({ isOpen: false })}
          position="bottom-right"
          toggleElement={
            <button
              onClick={() =>
                this.setState(state => ({
                  isOpen: !state.isOpen
                }))
              }
              className="text-link--destructive"
              data-test-id={`extensions.delete.${extension.id}`}>
              Delete
            </button>
          }>
          <DropdownList style={{ padding: 20, width: 350, textAlign: 'center' }}>
            <p>
              You are about to remove the extension <strong>{extension.name}</strong>. If the
              extension is in use in any content type you will have to pick a different appearance
              for the field using it.
            </p>
            <Button
              testId={`extensions.deleteConfirm.${extension.id}`}
              buttonType="negative"
              onClick={() => {
                onClick();
                this.setState({ isOpen: false });
              }}>
              Delete
            </Button>
            <Button
              style={{ marginLeft: 20 }}
              buttonType="muted"
              onClick={() => {
                this.setState({ isOpen: false });
              }}>
              Cancel
            </Button>
          </DropdownList>
        </Dropdown>
      </div>
    );
  }
}

const EmptyState = () => (
  <div className="empty-state" data-test-id="extensions.empty">
    <div style={{ transform: 'scale(0.75)' }}>
      <EmptyExtensionIcon />
    </div>
    <div className="empty-state__title">There are no extensions installed in this space</div>
    <div className="empty-state__description">
      Contentful UI Extensions are small applications that run inside the Web App. Click on{' '}
      {'"Add extension"'} to explore your options. You can also read how to{' '}
      <DocsLink
        href="https://www.contentful.com/developers/docs/concepts/uiextensions/"
        title="get started with extensions"
      />{' '}
      or head to the{' '}
      <DocsLink
        href="https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md"
        title="API Reference of the UI Extensions SDK"
      />
      .
    </div>
  </div>
);

export class ExtensionsList extends React.Component {
  static propTypes = {
    extensions: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
    refresh: PropTypes.func.isRequired,
    extensionUrl: PropTypes.string,
    extensionUrlReferrer: PropTypes.string
  };

  componentDidMount() {
    if (this.props.extensionUrl) {
      openGitHubInstaller(this.props.extensionUrl, this.props.extensionUrlReferrer);
    }
  }

  renderList() {
    const { extensions, refresh } = this.props;

    if (extensions.length === 0) {
      return <EmptyState />;
    }

    const body = extensions.map(extension => (
      <tr key={extension.id}>
        <td>
          <StateLink to="^.detail" params={{ extensionId: extension.id }}>
            {extension.name}
          </StateLink>
        </td>
        <td>
          {typeof extension.src === 'string' && 'self-hosted'}
          {typeof extension.srcdoc === 'string' && 'Contentful'}
        </td>
        <td>{extension.fieldTypes.join(', ')}</td>
        <td>{`${get(extension, ['parameters', 'length'], 0)} definition(s)`}</td>
        <td>
          {`${get(
            extension,
            ['installationParameters', 'definitions', 'length'],
            0
          )} definition(s)`}
          <br />
          {`${
            Object.keys(get(extension, ['installationParameters', 'values'], {})).length
          } value(s)`}
        </td>
        <td className="x--small-cell">
          <StateLink to="^.detail" params={{ extensionId: extension.id }}>
            <span style={{ textDecoration: 'underline' }}>Edit</span>
          </StateLink>
          <DeleteButton
            extension={extension}
            onClick={() => deleteExtension(extension.id, refresh)}
          />
        </td>
      </tr>
    ));

    return (
      <div data-test-id="extensions.list">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hosting</th>
              <th>Field type(s)</th>
              <th>Instance parameters</th>
              <th>Installation parameters</th>
              <th className="x--small-cell">Actions</th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Extensions ({this.props.extensions.length})</Workbench.Title>
          <Workbench.Header.Actions>
            <ExtensionsActions />
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>{this.renderList()}</Workbench.Content>
        <Workbench.Sidebar>
          <ExtensionsSidebar />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}

export default ExtensionsList;
