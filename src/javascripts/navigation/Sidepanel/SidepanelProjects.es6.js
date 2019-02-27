import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { TextLink } from '@contentful/forma-36-react-components';

// Styles mostly copied from sidepanel.styl
const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px 0'
  }),
  header: css({
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between'
  }),
  headerTitle: css({
    fontWeight: 'bold',
    marginBottom: tokens.spacingM
  })
};

export default class SidepanelProjects extends React.Component {
  static propTypes = {
    projectsEnabled: PropTypes.bool.isRequired,
    showCreateProjectModal: PropTypes.func.isRequired
  };

  render() {
    const { projectsEnabled, showCreateProjectModal } = this.props;

    if (!projectsEnabled) {
      return null;
    }

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.header)}>
          <div className={cx(styles.headerTitle)}>My Projects</div>
          <TextLink onClick={showCreateProjectModal}>+ Add new project</TextLink>
        </div>
        <div>
          <span>You don’t have any projects. Add one!</span>
        </div>
      </div>
    );
  }
}
