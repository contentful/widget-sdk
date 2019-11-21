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
  Paragraph,
  Heading,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import ExtensionsSidebar, { DocsLink } from './ExtensionsSidebar';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyStateIllustration from 'svg/connected-forms-illustration';
import { websiteUrl } from 'Config';
import { getExtensionLoader } from 'widgets/ExtensionLoaderInstance';

import ExtensionsActions from './ExtensionsActions';

import { openGitHubInstaller } from './ExtensionsActions';
import { getModule } from 'NgRegistry';

const styles = {
  deleteDropdown: css({
    padding: tokens.spacingXl,
    width: 350,
    textAlign: 'center'
  }),
  deleteDropdownButton: css({
    margin: tokens.spacingM,
    marginBottom: 0
  }),
  svgContainer: css({ width: '280px' })
};

function deleteExtension(id, refresh) {
  const spaceContext = getModule('spaceContext');

  return spaceContext.cma
    .deleteExtension(id)
    .then(refresh)
    .then(
      () => {
        Notification.success('Your extension was successfully deleted.');
        getExtensionLoader().evictExtension(id);
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
  <EmptyStateContainer data-test-id="extensions.empty">
    <div className={defaultSVGStyle}>
      <EmptyStateIllustration />
    </div>
    <Heading>Customize your experience by connecting to your favorite services</Heading>
    <Paragraph>
      Add UI extensions to customize and extend the functionality of the Contentful web app. To
      explore your options, click on Add Extension or read the{' '}
      <DocsLink
        href={websiteUrl('/developers/docs/extensibility/ui-extensions/sdk-reference/')}
        title="UI extension documentation"
      />
      .
    </Paragraph>
  </EmptyStateContainer>
);

export const ExtensionListShell = props => (
  <Workbench>
    <Workbench.Header
      title={props.title || 'Extensions'}
      icon={<Icon name="page-settings" scale="0.8" />}
      actions={props.actions}
    />
    <Workbench.Content type="full">
      {props.children || (
        <React.Fragment>
          <SkeletonContainer
            svgWidth={600}
            svgHeight={300}
            ariaLabel="Loading extensions list..."
            clipId="extesions-loading-list">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        </React.Fragment>
      )}
    </Workbench.Content>
    <Workbench.Sidebar position="right">
      <ExtensionsSidebar />
    </Workbench.Sidebar>
  </Workbench>
);

ExtensionListShell.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node
};

const ExtensionsTable = props => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Hosting</TableCell>
        <TableCell>Field type(s)</TableCell>
        <TableCell>Instance parameters</TableCell>
        <TableCell>Installation parameters</TableCell>
        <TableCell className="x--small-cell">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>{props.children}</TableBody>
  </Table>
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
      <TableRow key={extension.id}>
        <TableCell>
          {extension.isBasedOnDefinition ? (
            extension.name
          ) : (
            <StateLink to="^.detail" params={{ extensionId: extension.id }}>
              {extension.name}
            </StateLink>
          )}
        </TableCell>
        <TableCell>{extension.hosting}</TableCell>
        <TableCell>{extension.fieldTypes}</TableCell>
        <TableCell>{`${extension.parameterCounts.instanceDefinitions ||
          0} definition(s)`}</TableCell>
        <TableCell>
          {`${extension.parameterCounts.installationDefinitions || 0} definition(s)`}
          <br />
          {`${extension.parameterCounts.installationValues || 0} value(s)`}
        </TableCell>
        <TableCell className="x--small-cell">
          {extension.isBasedOnDefinition ? (
            <div>Use the API to manage definition based extensions</div>
          ) : (
            <div>
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
            </div>
          )}
        </TableCell>
      </TableRow>
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
