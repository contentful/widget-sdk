import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TextLink, Heading, Tag } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import DefaultIcon from 'ui/Components/Icon.es6';

const styles = {
  item: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${tokens.spacingM} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '&:last-child': {
      borderBottom: 'none'
    }
  }),
  title: css({
    flexGrow: 1,
    display: 'block'
  }),
  tagLine: css({
    fontSize: tokens.fontSizeS,
    color: tokens.colorElementDarkest
  }),
  titleText: css({
    fontSize: tokens.fontSizeL,
    fontWeight: '500'
  }),
  actions: css({
    display: 'block',
    button: {
      marginLeft: tokens.spacingM
    }
  }),
  icon: css({
    borderRadius: '5px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 3px 0 rgba(0,0,0,0.08)',
    padding: '2px',
    marginRight: tokens.spacingS,
    width: '35px',
    height: '35px'
  }),
  appLink: css({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  }),
  tag: css({
    marginTop: '3px',
    marginLeft: tokens.spacingXs
  })
};

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      tagLine: PropTypes.string,
      icon: PropTypes.string,
      installed: PropTypes.bool.isRequired,
      isDevApp: PropTypes.bool,
      enabled: PropTypes.bool.isRequired
    }),
    openDetailModal: PropTypes.func.isRequired
  };

  determineOnClick = (onClick, openDetailsFunc) => {
    const { app } = this.props;

    const continueDirectlyToAppPage = app.installed || app.isDevApp;

    return continueDirectlyToAppPage ? onClick : openDetailsFunc;
  };

  render() {
    const { app, openDetailModal } = this.props;

    const openDetailsFunc = () => openDetailModal(app);

    return (
      <div className={styles.item}>
        <div className={styles.title} data-test-id="app-title">
          <Heading element="h3" className={styles.titleText}>
            <StateLink to="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <div
                  onClick={this.determineOnClick(onClick, openDetailsFunc)}
                  className={styles.appLink}>
                  {app.icon ? (
                    <img src={app.icon} className={styles.icon} />
                  ) : (
                    <DefaultIcon name="page-apps" className={styles.icon} />
                  )}
                  <div>
                    {app.title}
                    {app.tagLine && <div className={styles.tagLine}>{app.tagLine}</div>}
                  </div>
                  {app.isDevApp && <Tag className={styles.tag}>Private</Tag>}
                </div>
              )}
            </StateLink>
          </Heading>
        </div>
        <div className={styles.actions}>
          {app.installed && (
            <StateLink to="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <TextLink onClick={onClick} linkType="primary">
                  Configure
                </TextLink>
              )}
            </StateLink>
          )}
          {!app.isDevApp && (
            <TextLink onClick={openDetailsFunc} linkType="primary">
              {app.enabled ? 'About' : 'Enterprise feature'}
            </TextLink>
          )}
        </div>
      </div>
    );
  }
}
