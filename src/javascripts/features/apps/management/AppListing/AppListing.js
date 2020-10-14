import {
  Button,
  CardActions,
  CopyButton,
  DropdownList,
  DropdownListItem,
  Heading,
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
import { ModalLauncher, NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import StateLink from 'app/common/StateLink';
import DocumentTitle from 'components/shared/DocumentTitle';
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

export function AppListing({ definitions, canManageApps, definitionLimit }) {
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
          <StateLink path="^.new_definition">
            {({ onClick }) => (
              <Button disabled={!canManageApps} onClick={onClick}>
                Create an app
              </Button>
            )}
          </StateLink>
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
        icon={<NavigationIcon icon="Apps" size="large" />}
        actions={
          <StateLink path="^.new_definition">
            {({ onClick }) => (
              <CreateAppButton
                onClick={onClick}
                definitionLimit={definitionLimit}
                disabled={definitions.length >= definitionLimit}
              />
            )}
          </StateLink>
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
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        <span className={styles.miniIcon}>
                          <NavigationIcon icon="Apps" size="small" />
                        </span>{' '}
                        <b>{def.name}</b>
                      </StateLink>
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
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        {({ onClick }) => (
                          <CardActions
                            iconButtonProps={{ buttonType: 'primary' }}
                            isAutoalignmentEnabled={true}>
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
                      </StateLink>
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
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired,
  canManageApps: PropTypes.bool.isRequired,
  definitionLimit: PropTypes.number.isRequired,
};

CreateAppButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  definitionLimit: PropTypes.number.isRequired,
};
