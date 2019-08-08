import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Subheading,
  TextLink,
  Paragraph,
  Heading
} from '@contentful/forma-36-react-components';
import AppIcon from '../apps/_common/AppIcon.es6';

const styles = {
  root: css({
    display: 'flex',
    overflow: 'hidden'
  }),
  mainColumn: css({
    flexGrow: 1
  }),
  sidebarColumn: css({
    minWidth: '280px',
    width: '280px',
    minHeight: '700px',
    paddingLeft: tokens.spacingL,
    borderLeft: `1px solid ${tokens.colorElementMid}`
  }),
  sidebarSpacing: css({
    marginBottom: tokens.spacingL
  }),
  sidebarSubheading: css({
    marginBottom: tokens.spacingXs
  }),
  sidebarLink: css({
    marginBottom: tokens.spacingXs
  })
};

const AppPropType = PropTypes.shape({
  appId: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    image: PropTypes.node.isRequired
  }).isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
});

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
};

function AppHeader(props) {
  const { app } = props;
  return (
    <div className={css({ display: 'flex', marginBottom: tokens.spacingL })}>
      <AppIcon appId={app.appId} size="large" className={css({ marginRight: tokens.spacingM })} />
      <div>
        <Heading
          element="h1"
          className={css({
            lineHeight: tokens.lineHeightCondensed,
            fontSize: tokens.fontSize2Xl,
            fontWeight: tokens.fontWeightMedium
          })}>
          {app.appName}
        </Heading>
        <div>
          App • Developed by{' '}
          <TextLink href={app.author.url} {...externalLinkProps}>
            {app.author.name}
          </TextLink>
        </div>
      </div>
    </div>
  );
}

AppHeader.propTypes = {
  app: AppPropType.isRequired
};

export function AppDetails(props) {
  const { app } = props;
  return (
    <div className={styles.root}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} />
        <div dangerouslySetInnerHTML={{ __html: app.description }} />
      </div>
      <div className={styles.sidebarColumn}>
        <Button isFullWidth buttonType="primary">
          Install
        </Button>
        <div className={styles.sidebarSpacing} />
        {app.links.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Links
            </Subheading>
            {app.links.map((link, index) => (
              <div key={link.url} className={styles.sidebarLink}>
                <TextLink href={`${link.url}-${index}`} {...externalLinkProps}>
                  {link.title}
                </TextLink>
              </div>
            ))}
            <div className={styles.sidebarSpacing} />
          </>
        )}
        <Subheading element="h3" className={styles.sidebarSubheading}>
          Author
        </Subheading>
        <a href={app.author.url} {...externalLinkProps}>
          {app.author.image}
        </a>
        <div className={styles.sidebarSpacing} />

        {app.categories.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Categories
            </Subheading>
            <Paragraph>{app.categories.join(', ')}</Paragraph>
            <div className={styles.sidebarSpacing} />
          </>
        )}

        <Subheading element="h3" className={styles.sidebarSubheading}>
          Permissions
        </Subheading>
        <Paragraph>
          This app will have full permissions. It will be able to access all data from the selected
          space and environment.
        </Paragraph>
      </div>
    </div>
  );
}

AppDetails.propTypes = {
  app: AppPropType.isRequired
};

export default function AppDetailsModal(props) {
  return (
    <Modal
      allowHeightOverflow
      size="1000px"
      title="App details"
      isShown={props.isShown}
      onClose={props.onClose}>
      <AppDetails app={props.app} onInstall={props.onInstall} />
    </Modal>
  );
}

AppDetailsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  app: AppPropType.isRequired,
  onInstall: PropTypes.func.isRequired
};
