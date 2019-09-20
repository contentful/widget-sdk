import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Icon, TextLink } from '@contentful/forma-36-react-components';
import AppIcon from 'app/settings/apps/_common/AppIcon.es6';
import { css } from 'emotion';
import WebhookTemplates from 'app/settings/webhooks/templates/index.es6';

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

export function isInstallLink(link) {
  return isWebhookLink(link) || isAppLink(link) || isExtensionLink(link);
}

export function InstallHeader(props) {
  return (
    <div className={styles.installHeader}>
      <AppIcon className={styles.installHeaderIcon} appId="contentful" size="xsmall" />
      {props.children}
    </div>
  );
}

export function InstallLogos(props) {
  return (
    <div className={styles.logos}>
      <AppIcon appId="contentful" className={styles.appIcon} />
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

export function AppLinkHeader({ appId }) {
  return (
    <>
      <InstallHeader>Install app to Contentful</InstallHeader>
      <InstallLogos>
        <AppIcon appId={appId} className={styles.appIcon} />
      </InstallLogos>
    </>
  );
}

AppLinkHeader.propTypes = {
  appId: PropTypes.string.isRequired
};

export function ExtensionLinkHeader({ url }) {
  return (
    <>
      <InstallHeader>Install extension to Contentful</InstallHeader>
      <InstallLogos>
        <AppIcon appId="generic" className={styles.appIcon} />
      </InstallLogos>
      <div className={styles.extensionLink}>
        <TextLink href={url} target="_blank">
          {url}
        </TextLink>
      </div>
    </>
  );
}

ExtensionLinkHeader.propTypes = {
  url: PropTypes.string.isRequired
};
