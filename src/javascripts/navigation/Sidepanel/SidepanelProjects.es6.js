import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import _ from 'lodash';

import tokens from '@contentful/forma-36-tokens';
import { TextLink, Spinner } from '@contentful/forma-36-react-components';

import { getVariation } from 'LaunchDarkly.es6';
import { PROJECTS_FLAG } from 'featureFlags.es6';

import { connect } from 'react-redux';
import * as actionCreators from 'redux/actions/projects/actionCreators.es6';

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

export class SidepanelProjects extends React.Component {
  static propTypes = {
    currOrg: PropTypes.object.isRequired,
    showCreateProjectModal: PropTypes.func.isRequired,
    goToProject: PropTypes.func.isRequired,
    getAllProjects: PropTypes.func.isRequired,
    projects: PropTypes.object
  };

  state = {
    isEnabled: false,
    isLoading: false,
    projects: []
  };

  componentDidMount() {
    const { currOrg } = this.props;

    if (currOrg) {
      this.initialize();
    }
  }

  componentDidUpdate(prevProps) {
    const { currOrg } = this.props;

    if (currOrg.sys.id !== prevProps.currOrg.sys.id) {
      this.setState(
        {
          isEnabled: false
        },
        this.initialize
      );
    }
  }

  initialize = async () => {
    const {
      currOrg: {
        sys: { id: orgId }
      },
      getAllProjects
    } = this.props;

    const isEnabled = await getVariation(PROJECTS_FLAG, { orgId });

    if (isEnabled) {
      getAllProjects({ orgId });
    }

    this.setState({
      isEnabled
    });
  };

  goToProject = projectId => () => {
    const { goToProject } = this.props;

    goToProject(projectId);
  };

  render() {
    const {
      showCreateProjectModal,
      projects,
      currOrg: {
        sys: { id: orgId }
      }
    } = this.props;
    const { isEnabled } = this.state;

    const orgProjects = _.get(projects, orgId, {
      items: []
    });

    if (!isEnabled) {
      return null;
    }

    const { items, isPending } = orgProjects;

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.header)}>
          <div className={cx(styles.headerTitle)}>My Projects</div>
          <TextLink onClick={showCreateProjectModal}>+ Create project</TextLink>
        </div>
        <div>
          {isPending && <Spinner />}
          {!isPending && items.length === 0 && <span>You don’t have any projects. Add one!</span>}
          {!isPending && items.length !== 0 && (
            <ul>
              {items.map(project => (
                <li
                  key={project.sys.id}
                  onClick={this.goToProject(project.sys.id)}
                  className="nav-sidepanel__space-list-item ">
                  {project.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    projects: state.projects
  }),
  {
    getAllProjects: actionCreators.getAllProjects
  }
)(SidepanelProjects);
