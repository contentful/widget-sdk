import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TextLink, Heading, Tag } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import AppIcon from '../apps/_common/AppIcon.es6';

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
  titleText: css({
    fontSize: tokens.fontSizeL
  }),
  actions: css({
    display: 'block',
    button: {
      marginLeft: tokens.spacingM
    }
  }),
  icon: css({
    verticalAlign: 'middle',
    borderRadius: '5px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 3px 0 rgba(0,0,0,0.08)',
    padding: '2px',
    marginRight: tokens.spacingXs
  }),
  appLink: css({
    cursor: 'pointer'
  })
};

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      isDevApp: PropTypes.bool
    }),
    openDetailModal: PropTypes.func.isRequired
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
                <div onClick={app.installed ? onClick : openDetailsFunc} className={styles.appLink}>
                  <AppIcon appId={app.id} className={styles.icon} size="small" /> {app.title}{' '}
                  {!!app.isDevApp && <Tag>Private</Tag>}
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
          <TextLink onClick={openDetailsFunc} linkType="primary">
            About
          </TextLink>
        </div>
      </div>
    );
  }
}
