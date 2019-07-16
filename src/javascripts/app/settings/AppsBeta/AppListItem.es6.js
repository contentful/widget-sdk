import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TextLink, Heading } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import { InstalledTag } from './AppStateTags.es6';

const styles = {
  item: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${tokens.spacingM} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`
  }),
  title: css({
    flexGrow: 1,
    padding: `0 ${tokens.spacingM}`,
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
  })
};

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired
    })
  };

  render() {
    const { app } = this.props;

    return (
      <div className={styles.item}>
        <div className={styles.title} data-test-id="app-title">
          <Heading element="h3" className={styles.titleText}>
            {app.title}
          </Heading>
        </div>
        {app.installed && <InstalledTag />}
        <div className={styles.actions}>
          <StateLink to="^.detail" params={{ appId: app.id }}>
            {({ onClick }) => (
              <TextLink onClick={onClick} linkType="primary">
                Open
              </TextLink>
            )}
          </StateLink>
        </div>
      </div>
    );
  }
}
