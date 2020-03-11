import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  Notification,
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
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyStateIllustration from 'svg/illustrations/connected-forms-illustration.svg';
import { websiteUrl } from 'Config';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import { ExtensionListSkeleton } from './skeletons/ExtensionListSkeleton';

import { DocsLink } from './ExtensionsSidebar';
import ExtensionsActions from './ExtensionsActions';
import { openGitHubInstaller } from './ExtensionsActions';

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

async function deleteExtension(id, cma, refresh) {
  try {
    await cma.deleteExtension(id);
    getCustomWidgetLoader().evict([NAMESPACE_EXTENSION, id]);
    await refresh();
    Notification.success('Your extension was successfully deleted.');
  } catch (err) {
    Notification.error('There was an error while deleting your extension.');
  }
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
    cma: PropTypes.shape({
      deleteExtension: PropTypes.func.isRequired
    }).isRequired,
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
    const { extensions, cma, refresh } = this.props;

    if (extensions.length === 0) {
      return <EmptyState />;
    }

    const body = extensions.map(extension => (
      <TableRow key={extension.id}>
        <TableCell>
          <StateLink path="^.detail" params={{ extensionId: extension.id }}>
            {extension.name}
          </StateLink>
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
          <div>
            <div>
              <StateLink path="^.detail" params={{ extensionId: extension.id }}>
                {({ getHref, onClick }) => (
                  <TextLink href={getHref()} onClick={onClick} linkType="primary">
                    Edit
                  </TextLink>
                )}
              </StateLink>
            </div>
            <div>
              <DeleteButton
                extension={extension}
                onClick={() => deleteExtension(extension.id, cma, refresh)}
              />
            </div>
          </div>
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
      <ExtensionListSkeleton
        title={`Extensions (${this.props.extensions.length})`}
        actions={<ExtensionsActions />}>
        {this.renderList()}
      </ExtensionListSkeleton>
    );
  }
}

export default ExtensionsList;
