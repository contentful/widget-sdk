import React from 'react';
import PropTypes from 'prop-types';

import Workbench from 'app/WorkbenchReact.es6';
import ExtensionsSidebar, { DocsLink } from './ExtensionsSidebar.es6';

import EmptyExtensionIcon from './icons/EmptyExtensionIcon.es6';
import ExtensionsList from './ExtensionsList.es6';
import ExtensionsActions from './ExtensionsActions.es6';
import ExtensionsForbiddenPage from './ExtensionsForbiddenPage.es6';

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

export default class Extensions extends React.Component {
  static propTypes = {
    extensions: PropTypes.arrayOf(PropTypes.shape()),
    extensionUrl: PropTypes.string,
    refresh: PropTypes.func.isRequired,
    isAdmin: PropTypes.bool.isRequired
  };
  render() {
    const { extensions, refresh } = this.props;
    if (!this.props.isAdmin) {
      return <ExtensionsForbiddenPage extensionUrl={this.props.extensionUrl} />;
    }
    if (!extensions) {
      return null;
    }
    const content =
      extensions.length > 0 ? (
        <ExtensionsList extensions={extensions} refresh={refresh} />
      ) : (
        <EmptyState />
      );
    return (
      <Workbench
        title={`Extensions (${extensions.length})`}
        icon="page-settings"
        content={content}
        actions={<ExtensionsActions />}
        sidebar={<ExtensionsSidebar />}
      />
    );
  }
}
