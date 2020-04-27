import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextLink, Heading, Tag } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import styles from './styles';
import { AppIcon } from './AppIcon';

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      tagLine: PropTypes.string,
      icon: PropTypes.string,
      appInstallation: PropTypes.object,
      isPrivateApp: PropTypes.bool,
    }).isRequired,
    openDetailModal: PropTypes.func.isRequired,
    canManageApps: PropTypes.bool,
  };

  determineOnClick = (onClick, openDetailsFunc, canManageApps) => {
    const { app } = this.props;

    const isInstalledOrPrivate = !!app.appInstallation || app.isPrivateApp;
    const continueDirectlyToAppPage = canManageApps && isInstalledOrPrivate;

    return continueDirectlyToAppPage ? onClick : openDetailsFunc;
  };

  render() {
    const { app, openDetailModal, canManageApps } = this.props;

    const openDetailsFunc = () => openDetailModal(app);

    return (
      <div className={styles.item}>
        <div className={styles.title} data-test-id="app-title">
          <Heading element="h3" className={styles.titleText}>
            <StateLink path="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <div
                  onClick={this.determineOnClick(onClick, openDetailsFunc, canManageApps)}
                  className={styles.appLink}
                  data-test-id="app-details">
                  <AppIcon icon={app.icon} />
                  <div>
                    {app.title}
                    {app.tagLine && <div className={styles.tagLine}>{app.tagLine}</div>}
                  </div>
                  {app.isPrivateApp && <Tag className={styles.tag}>Private</Tag>}
                </div>
              )}
            </StateLink>
          </Heading>
        </div>
        <div className={styles.actions}>
          {!!app.appInstallation && canManageApps && (
            <StateLink path="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <TextLink onClick={onClick} linkType="primary">
                  Configure
                </TextLink>
              )}
            </StateLink>
          )}
          {!app.isPrivateApp && (
            <TextLink onClick={openDetailsFunc} linkType="primary">
              About
            </TextLink>
          )}
        </div>
      </div>
    );
  }
}
