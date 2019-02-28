import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { TextLink, Spinner } from '@contentful/forma-36-react-components';

import createMicroBackendsClient from 'MicroBackendsClient.es6';

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
    currOrg: PropTypes.object.isRequired,
    projectsEnabled: PropTypes.bool.isRequired,
    showCreateProjectModal: PropTypes.func.isRequired,
    goToProject: PropTypes.func.isRequired
  };

  state = {
    isLoading: false,
    projects: []
  };

  componentDidMount() {
    this.getAllProjects();
  }

  componentDidUpdate(prevProps) {
    const { currOrg } = this.props;

    if (currOrg.sys.id !== prevProps.currOrg.sys.id) {
      this.getAllProjects();
    }
  }

  getAllProjects = async () => {
    const {
      currOrg: {
        sys: { id: orgId }
      }
    } = this.props;

    this.setState({
      isLoading: true
    });

    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    let projects;

    try {
      const resp = await backend.call();

      projects = await resp.json();
    } catch (e) {
      // Assume 404
      projects = [];
    }

    this.setState({
      isLoading: false,
      projects
    });
  };

  goToProject = projectId => () => {
    const { goToProject } = this.props;

    goToProject(projectId);
  };

  render() {
    const { projectsEnabled, showCreateProjectModal } = this.props;
    const { isLoading, projects } = this.state;

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
          {isLoading && (
            <span>
              <Spinner />
              Loading...
            </span>
          )}
          {!isLoading && projects.length === 0 && (
            <span>You don’t have any projects. Add one!</span>
          )}
          {!isLoading && projects.length !== 0 && (
            <ul>
              {projects.map(project => (
                <li key={project.sys.id} onClick={this.goToProject(project.sys.id)}>
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
