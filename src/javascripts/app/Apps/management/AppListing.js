import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon';
import { CardActions, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import AppsPrivateFrameworkIllustration from 'svg/apps-private-framework.svg';
import tokens from '@contentful/forma-36-tokens';
import * as ModalLauncher from 'app/common/ModalLauncher';
import DocumentTitle from 'components/shared/DocumentTitle';
import NavigationIcon from 'ui/Components/NavigationIcon';

import {
  Heading,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Paragraph,
  TextLink,
  Typography,
  CopyButton,
  SectionHeading,
  Workbench,
  Note
} from '@contentful/forma-36-react-components';

import StateLink from 'app/common/StateLink';
import AppInstallModal from './AppInstallModal';

const styles = {
  headerActions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginLeft: tokens.spacingXs
  }),
  headerInput: css({
    maxWidth: '1100px',
    width: '100%',
    marginLeft: tokens.spacing4Xl
  }),
  appActions: css({
    verticalAlign: 'middle'
  }),
  copyButton: css({
    button: css({
      height: '20px',
      border: 'none',
      backgroundColor: 'transparent',
      transform: 'translateX(-10px)',
      opacity: '0',
      transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingCubicBezier}`,
      '&:hover': css({
        backgroundColor: 'transparent',
        border: 'none',
        opacity: '1',
        transform: 'translateX(0)'
      })
    })
  }),
  sidebarHeading: css({
    color: tokens.colorElementDarkest,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    fontWeight: tokens.fontWeightNormal
  }),
  cell: css({
    display: 'flex',
    alignItems: 'center'
  }),
  miniIcon: css({
    marginRight: tokens.spacingS,
    verticalAlign: 'sub'
  }),
  learnMore: css({
    maxWidth: '768px',
    margin: '0 auto',
    marginTop: '100px',
    textAlign: 'center'
  }),
  emptyWorkbench: css({
    '> div': css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: '768px',
      margin: '0 auto'
    })
  }),
  emptyState: css({
    maxWidth: '768px',
    margin: '0 auto',
    textAlign: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingS,
    '& svg': css({
      width: '80%'
    }),
    button: css({
      marginBottom: tokens.spacingL
    })
  }),
  menuCell: css({
    display: 'flex',
    justifyContent: 'flex-end',
    height: '20px',
    div: css({
      display: 'flex',
      justifyContent: 'center'
    })
  })
};

const idStyle = css({
  fontFamily: tokens.fontStackMonospace,
  [`&:hover ~ .${styles.copyButton} button`]: css({
    opacity: '1',
    transform: 'translateX(0)'
  })
});

function openInstallModal(definition) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <AppInstallModal definition={definition} isShown={isShown} onClose={onClose} />
  ));
}

export default function AppListing({ definitions, canManageApps }) {
  const learnMoreParagraph = (
    <Paragraph>
      Learn more about{' '}
      <TextLink href="https://www.contentful.com/developers/docs/extensibility/apps/building-apps/">
        building Contentful apps
      </TextLink>{' '}
      or check out our <TextLink href="https://contentful.com/marketplace">Marketplace</TextLink>.
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
              href="https://www.contentful.com/r/knowledgebase/spaces-and-organizations/#belonging-to-an-organization"
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
        icon={<NavigationIcon name="apps" size="large" color="green" />}
        actions={
          <StateLink path="^.new_definition">
            {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
          </StateLink>
        }
      />
      <Workbench.Content>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {definitions.map(def => {
              return (
                <TableRow key={def.sys.id}>
                  <TableCell>
                    <div className={styles.cell}>
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                        <Icon name="page-apps" scale="0.5" className={styles.miniIcon} />{' '}
                        <b>{def.name}</b>
                      </StateLink>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.cell}>
                      <span className={idStyle}>{def.sys.id} </span>
                      <CopyButton className={styles.copyButton} copyValue={def.sys.id} />
                    </div>
                  </TableCell>
                  <TableCell className={styles.appActions} align="right">
                    <div className={styles.menuCell}>
                      <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
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
  canManageApps: PropTypes.bool.isRequired
};
