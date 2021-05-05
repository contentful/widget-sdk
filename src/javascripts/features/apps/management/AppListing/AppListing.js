import {
  Button,
  CardActions,
  CopyButton,
  DropdownList,
  DropdownListItem,
  Heading,
  ModalLauncher,
  Note,
  Paragraph,
  SectionHeading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextLink,
  Tooltip,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle';
import { RouteLink } from 'core/react-routing';
import PropTypes from 'prop-types';
import React from 'react';
import AppsPrivateFrameworkIllustration from 'svg/illustrations/apps-private-framework.svg';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { AppInstallModal } from '../AppInstallModal';
import { styles } from './styles';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'app-listing',
  campaign: 'in-app-help',
});

function openInstallModal(definition) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <AppInstallModal definition={definition} isShown={isShown} onClose={onClose} />
  ));
}

function CreateAppButton({ definitionLimit, disabled, onClick }) {
  if (disabled) {
    return (
      <Tooltip
        content={`Your organization has reached the limit of ${definitionLimit} app definitions.`}>
        <Button onClick={onClick} disabled={disabled}>
          Create app
        </Button>
      </Tooltip>
    );
  } else {
    return <Button onClick={onClick}>Create app</Button>;
  }
}

function buildRenderedAppURL(url) {
  if (!url) {
    return '';
  }

  const urlObj = new URL(url);
  const path = urlObj.pathname !== '/' ? urlObj.pathname : '';
  const port = urlObj.port ? `:${urlObj.port}` : '';
  return `${urlObj.hostname}${port}${path}`;
}

export function AppListing({ definitions, canManageApps, definitionLimit, orgId }) {
  const learnMoreParagraph = (
    <Paragraph>
      Learn more about{' '}
      <TextLink
        href={withInAppHelpUtmParams(
          'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/'
        )}>
        building Contentful apps
      </TextLink>{' '}
      or check out our{' '}
      <TextLink href={withInAppHelpUtmParams('https://contentful.com/marketplace')}>
        Marketplace
      </TextLink>
      .
    </Paragraph>
  );

  if (!canManageApps || definitions.length < 1) {
    return (
      <Workbench className={styles.emptyWorkbench}>
        <DocumentTitle title="Apps" />
        <div className={styles.emptyState}>
          <AppsPrivateFrameworkIllustration />
          <Typography>
            <Heading>Build apps for Contentful</Heading>
            <Paragraph>
              Contentful apps extend and expand the capabilities of the Contentful web app and the
              editors who use it. Apps empower you to integrate third-party services, build
              extraordinary workflows and customize the functionality of the Contentful web app.
            </Paragraph>
            {learnMoreParagraph}
          </Typography>
          <RouteLink route={{ path: 'organizations.apps.new_definition', orgId }}>
            {({ onClick }) => (
              <Button disabled={!canManageApps} onClick={onClick}>
                Create an app
              </Button>
            )}
          </RouteLink>
        </div>
        {!canManageApps && (
          <Note noteType="primary">
            To start building apps for this organization, ask your admin to upgrade your account to
            the{' '}
            <TextLink
              href={withInAppHelpUtmParams(
                'https://www.contentful.com/help/spaces-and-organizations/#belonging-to-an-organization'
              )}
              target="_blank"
              rel="noopener noreferrer">
              developer role
            </TextLink>
            .
          </Note>
        )}
      </Workbench>
    );
  }

  return (
    <Workbench>
      <DocumentTitle title="Apps" />
      <Workbench.Header
        title={<Heading>Apps</Heading>}
        icon={<ProductIcon icon="Apps" size="large" />}
        actions={
          <RouteLink route={{ path: 'organizations.apps.new_definition', orgId }}>
            {({ onClick }) => (
              <CreateAppButton
                onClick={onClick}
                definitionLimit={definitionLimit}
                disabled={definitions.length >= definitionLimit}
              />
            )}
          </RouteLink>
        }
      />
      <Workbench.Content>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>App URL</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {definitions.map((def) => {
              const formattedAppURL = buildRenderedAppURL(def.src);

              return (
                <TableRow key={def.sys.id}>
                  <TableCell>
                    <div className={styles.cell}>
                      <RouteLink
                        route={{
                          path: 'organizations.apps.definition',
                          orgId,
                          definitionId: def.sys.id,
                        }}>
                        <span className={styles.miniIcon}>
                          <ProductIcon icon="Apps" size="small" />
                        </span>{' '}
                        <b>{def.name}</b>
                      </RouteLink>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.cell}>
                      <span className={styles.id}>{def.sys.id} </span>
                      <CopyButton className={styles.copyButton} copyValue={def.sys.id} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.cell}>
                      <span>{formattedAppURL}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles.appActions} align="right">
                    <div className={styles.menuCell}>
                      <RouteLink
                        route={{
                          path: 'organizations.apps.definition',
                          definitionId: def.sys.id,
                          orgId,
                        }}>
                        {({ onClick }) => (
                          <CardActions iconButtonProps={{ buttonType: 'primary' }}>
                            <DropdownList>
                              <DropdownListItem onClick={onClick}>Edit</DropdownListItem>
                              <DropdownListItem
                                onClick={() => openInstallModal(def)}
                                testId="user-remove-from-space">
                                Install to space
                              </DropdownListItem>
                            </DropdownList>
                          </CardActions>
                        )}
                      </RouteLink>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <Typography>
          <SectionHeading className={styles.sidebarHeading}>About Apps</SectionHeading>
          <Paragraph>
            Build apps for your Contentful organization to extend the core functionality of the web
            app and optimize the workflow of editors.
          </Paragraph>
          {learnMoreParagraph}
        </Typography>
      </Workbench.Sidebar>
    </Workbench>
  );
}

AppListing.propTypes = {
  orgId: PropTypes.string.isRequired,
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired,
  canManageApps: PropTypes.bool.isRequired,
  definitionLimit: PropTypes.number.isRequired,
};

CreateAppButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  definitionLimit: PropTypes.number.isRequired,
};
