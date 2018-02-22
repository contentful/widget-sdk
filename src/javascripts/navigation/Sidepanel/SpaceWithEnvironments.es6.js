import {createElement as e} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {asReact} from 'ui/Framework/DOMRenderer';
import AnimateHeight from 'libs/react-animate-height';
import folderIcon from 'svg/folder';
import environmentIcon from 'svg/environment';
import client from 'client';

function EnvironmentList ({environments, isCurrSpace, currentEnvId, goToSpace, space}) {
  return e('ul', null, (environments || []).map(env => {
    const envId = env.sys.id;
    const environmentClassNames = `
      nav-sidepanel__environments-list-item
      ${isCurrSpace && envId === currentEnvId ? 'nav-sidepanel__environments-list-item--is-active' : ''}
    `;

    return e('li', {
      key: envId,
      className: environmentClassNames,
      onClick: e => {
        e.stopPropagation();
        goToSpace(space.sys.id, envId);
      }
    }, ...[
      asReact(environmentIcon),
      envId
    ]);
  }));
}

export default createReactClass({
  displayName: 'SpaceWithEnvironments',
  propTypes: {
    openedSpaceId: PropTypes.string,
    space: PropTypes.object.isRequired,
    setOpenedSpaceId: PropTypes.func.isRequired,
    goToSpace: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    currentEnvId: PropTypes.string,
    isCurrSpace: PropTypes.bool
  },
  getInitialState () {
    return {loading: false, environments: null};
  },
  isOpened () {
    const {openedSpaceId, space} = this.props;
    return openedSpaceId === space.sys.id;
  },
  toggleEnvironmentList () {
    if (this.isOpened()) {
      this.props.setOpenedSpaceId(null);
      return;
    }

    this.setState({loading: true});

    client.request({
      method: 'GET',
      path: `/spaces/${this.props.space.sys.id}/environments`
    }).then(res => {
      const envs = res.items.filter(env => env.sys.status.sys.id === 'ready');
      const goToSpace = envId => {
        this.props.setOpenedSpaceId(null);
        this.props.goToSpace(this.props.space.sys.id, envId);
      };

      this.setState({loading: false});

      if (envs.length === 0 || (envs.length === 1 && envs[0].sys.id === 'master')) {
        goToSpace();
      } else if (envs.length === 1) {
        goToSpace(envs[0].sys.id);
      } else {
        this.setState({environments: envs}, () => {
          this.props.setOpenedSpaceId(this.props.space.sys.id);
        });
      }
    }, () => this.setState({loading: false}));
  },
  render () {
    const {
      index,
      space,
      currentEnvId,
      isCurrSpace,
      goToSpace
    } = this.props;

    const isOpened = this.isOpened();
    const classNames = `
      nav-sidepanel__space-list-item
      ${isCurrSpace ? 'nav-sidepanel__space-list-item--is-active' : ''}
      ${isOpened ? 'nav-sidepanel__space-list-item--is-open' : ''}
    `;

    return e('li', {
      className: classNames,
      onClick: () => this.toggleEnvironmentList(),
      'data-test-id': `sidepanel-space-link-${index}`,
      'data-test-group-id': 'sidepanel-space-link',
      'aria-selected': isOpened ? 'true' : 'false'
    }, ...[
      e('div', {className: 'nav-sidepanel__space-title'}, ...[
        e('div', {className: 'nav-sidepanel__space-icon'}, asReact(folderIcon)),
        e('span', {className: 'nav-sidepanel__space-name u-truncate'}, space.name),
        e('span', {className: this.state.loading ? 'nav-sidepanel__space-spinner' : 'nav-sidepanel__space-open-indicator'})
      ]),
      e(
        AnimateHeight,
        {height: isOpened ? 'auto' : '0'},
        e(EnvironmentList, {
          environments: this.state.environments,
          goToSpace,
          isCurrSpace,
          currentEnvId,
          space
        })
      )
    ]);
  }
});
