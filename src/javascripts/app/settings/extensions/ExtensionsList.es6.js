import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  TextLink,
  Typography,
  Paragraph
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionsSidebar, { DocsLink } from './ExtensionsSidebar.es6';

import EmptyExtensionIcon from './icons/EmptyExtensionIcon.es6';
import ExtensionsActions from './ExtensionsActions.es6';
import * as ExtensionLoader from 'widgets/ExtensionLoader.es6';

import { openGitHubInstaller } from './ExtensionsActions.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

const styles = {
  deleteDropdown: css({
    padding: tokens.spacingXl,
    width: 350,
    textAlign: 'center'
  }),
  deleteDropdownButton: css({
    margin: tokens.spacingM,
    marginBottom: 0
  })
};

function deleteExtension(id, refresh) {
  return spaceContext.cma
    .deleteExtension(id)
    .then(refresh)
    .then(
      () => {
        Notification.success('Your extension was successfully deleted.');
        ExtensionLoader.evictExtension(spaceContext.getId(), spaceContext.getEnvironmentId(), id);
      },
      err => {
        Notification.error('There was an error while deleting your extension.');
        return Promise.reject(err);
      }
    );
}

function DeleteButton(props) {
  const [isOpen, setOpen] = useState(false);
  const { extension, onClick } = props;
  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      position="bottom-right"
      toggleElement={
        <TextLink
          onClick={() => setOpen(!isOpen)}
          linkType="negative"
          testId={`extensions.delete.${extension.id}`}>
          Delete
        </TextLink>
      }>
      <DropdownList className={styles.deleteDropdown}>
        <Typography>
          <Paragraph>
            You are about to remove the extension <strong>{extension.name}</strong>. If the
            extension is in use in any content type you will have to pick a different appearance for
            the field using it.
          </Paragraph>
        </Typography>
        <Button
          testId={`extensions.deleteConfirm.${extension.id}`}
          buttonType="negative"
          className={styles.deleteDropdownButton}
          onClick={() => {
            onClick();
            setOpen(false);
          }}>
          Delete
        </Button>
        <Button
          className={styles.deleteDropdownButton}
          buttonType="muted"
          onClick={() => {
            setOpen(false);
          }}>
          Cancel
        </Button>
      </DropdownList>
    </Dropdown>
  );
}

DeleteButton.propTypes = {
  extension: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};

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

export const ExtensionListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>{props.title || 'Extensions'}</Workbench.Title>
      <Workbench.Header.Actions>{props.actions}</Workbench.Header.Actions>
    </Workbench.Header>
    <Workbench.Content>
      {props.children || (
        <React.Fragment>
          <ExtensionsTable />
          <SkeletonContainer svgWidth={600} ariaLabel="Loading extensions list..." clipId="content">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        </React.Fragment>
      )}
    </Workbench.Content>
    <Workbench.Sidebar>
      <ExtensionsSidebar />
    </Workbench.Sidebar>
  </Workbench>
);

ExtensionListShell.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node
};

const ExtensionsTable = props => (
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
    <tbody>{props.children}</tbody>
  </table>
);

export class ExtensionsList extends React.Component {
  static propTypes = {
    extensions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        fieldTypes: PropTypes.string.isRequired,
        hosting: PropTypes.string.isRequired,
        parameterCounts: PropTypes.object.isRequired
      })
    ).isRequired,
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
        <td>{extension.hosting}</td>
        <td>{extension.fieldTypes}</td>
        <td>{`${extension.parameterCounts.instanceDefinitions || 0} definition(s)`}</td>
        <td>
          {`${extension.parameterCounts.installationDefinitions || 0} definition(s)`}
          <br />
          {`${extension.parameterCounts.installationValues || 0} value(s)`}
        </td>
        <td className="x--small-cell">
          <div>
            <StateLink to="^.detail" params={{ extensionId: extension.id }}>
              {({ getHref }) => (
                <TextLink href={getHref()} linkType="primary">
                  Edit
                </TextLink>
              )}
            </StateLink>
          </div>
          <div>
            <DeleteButton
              extension={extension}
              onClick={() => deleteExtension(extension.id, refresh)}
            />
          </div>
        </td>
      </tr>
    ));

    return (
      <div data-test-id="extensions.list">
        <ExtensionsTable>{body}</ExtensionsTable>
      </div>
    );
  }

  render() {
    return (
      <ExtensionListShell
        title={`Extensions (${this.props.extensions.length})`}
        actions={<ExtensionsActions />}>
        {this.renderList()}
      </ExtensionListShell>
    );
  }
}

export default ExtensionsList;
