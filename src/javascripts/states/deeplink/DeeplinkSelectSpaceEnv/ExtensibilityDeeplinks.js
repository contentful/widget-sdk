import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Icon, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import WebhookTemplates from 'app/settings/webhooks/templates';
import SVGIcon from 'ui/Components/Icon';

const styles = {
  installHeader: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
    color: tokens.colorTextLight
  }),
  installHeaderIcon: css({
    marginRight: tokens.spacingS
  }),
  logos: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  appIcon: css({
    width: '45px',
    height: '45px',
    verticalAlign: 'middle',
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs
  }),
  arrowIcon: css({
    width: tokens.spacingXl,
    height: tokens.spacingXl
  }),
  extensionLink: css({
    paddingLeft: tokens.spacingM,
    paddingRight: tokens.spacingM,
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  }),
  webhook: css({
    display: 'flex',
    marginTop: tokens.spacingL,
    justifyContent: 'center',
    alignItems: 'center'
  }),
  webhookLogo: css({
    width: '38px',
    height: '38px',
    marginRight: tokens.spacingM
  }),
  webhookTitle: css({
    strong: {
      display: 'block',
      color: tokens.colorTextDark,
      fontWeight: tokens.fontWeightDemiBold
    },
    small: {
      display: 'block',
      color: tokens.colorTextLight,
      fontWeight: tokens.fontWeightNormal
    }
  })
};

export function isWebhookLink(link) {
  return link === 'webhook-template';
}

export function isAppLink(link) {
  return link === 'apps';
}

export function isExtensionLink(link) {
  return link === 'install-extension';
}

export function isInstallLink(link, id) {
  const isInstallableType = isWebhookLink(link) || isAppLink(link) || isExtensionLink(link);

  return isInstallableType && id;
}

export function InstallHeader(props) {
  return (
    <div className={styles.installHeader}>
      <SVGIcon name="contentful-logo-light" height={20} className={styles.installHeaderIcon} />
      {props.children}
    </div>
  );
}

export function InstallLogos(props) {
  return (
    <div className={styles.logos}>
      <SVGIcon name="contentful-logo-light" className={styles.appIcon} />
      <Icon icon="ChevronLeft" color="muted" className={styles.arrowIcon} />
      <Icon icon="ChevronRight" color="muted" className={styles.arrowIcon} />
      {props.children}
    </div>
  );
}

export function WebhookLinkHeader({ templateId }) {
  const template = WebhookTemplates.find(template => template.id === templateId);
  return (
    <>
      <InstallHeader>Install webhook to Contentful</InstallHeader>
      {template && (
        <div className={styles.webhook}>
          <div className={styles.webhookLogo}>{template.logo}</div>
          <div className={styles.webhookTitle}>
            <strong>{template.title}</strong>
            <small>{template.subtitle}</small>
            {template.aws && <small>Enterprise plan only</small>}
          </div>
        </div>
      )}
    </>
  );
}

WebhookLinkHeader.propTypes = {
  templateId: PropTypes.string.isRequired
};

export function AppLinkHeader({ appId, apps }) {
  const app = apps[appId];
  return (
    <>
      <InstallHeader>Install {app ? app.title : 'app'} to Contentful</InstallHeader>
      <InstallLogos>
        {app ? (
          <img src={app.icon} className={styles.appIcon} />
        ) : (
          <SVGIcon name="page-apps" className={styles.appIcon} />
        )}
      </InstallLogos>
    </>
  );
}

AppLinkHeader.propTypes = {
  appId: PropTypes.string.isRequired,
  apps: PropTypes.object.isRequired
};

export function ExtensionLinkHeader({ url }) {
  return (
    <>
      <InstallHeader>Install extension to Contentful</InstallHeader>
      <InstallLogos>
        <SVGIcon name="page-apps" className={styles.appIcon} />
      </InstallLogos>
      <div className={styles.extensionLink}>
        <Paragraph>Make sure this extension comes from a trusted source.</Paragraph>
        <pre>{url}</pre>
      </div>
    </>
  );
}

ExtensionLinkHeader.propTypes = {
  url: PropTypes.string.isRequired
};
