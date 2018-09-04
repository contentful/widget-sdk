import { createElement as e } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { asReact } from 'ui/Framework/DOMRenderer.es6';
import AnimateHeight from 'react-animate-height';
import folderIcon from 'svg/folder.es6';
import environmentIcon from 'svg/environment.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';

function EnvironmentList({ environments, isCurrSpace, currentEnvId, goToSpace, space }) {
  return e(
    'ul',
    null,
    (environments || []).map(env => {
      const envId = env.sys.id;
      const environmentClassNames = `
      nav-sidepanel__environments-list-item
      ${
        isCurrSpace && envId === currentEnvId
          ? 'nav-sidepanel__environments-list-item--is-active'
          : ''
      }
    `;

      return e(
        'li',
        {
          key: envId,
          className: environmentClassNames,
          onClick: e => {
            e.stopPropagation();
            goToSpace(space.sys.id, envId);
          }
        },
        ...[
          e(
            'a',
            {
              href: `/spaces/${space.sys.id}${envId === 'master' ? '' : `/environments/${envId}`}`,
              onClick: e => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  // allow to open in a new tab/window normally
                  e.stopPropagation();
                } else {
                  // parent `li` click handler will navigate
                  e.preventDefault();
                }
              }
            },
            ...[asReact(environmentIcon({ display: 'inline' })), envId]
          )
        ]
      );
    })
  );
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
  getInitialState() {
    return { loading: false, environments: null };
  },
  isOpened() {
    const { openedSpaceId, space } = this.props;
    return openedSpaceId === space.sys.id;
  },
  async toggleEnvironmentList() {
    if (this.isOpened()) {
      this.props.setOpenedSpaceId(null);
      return;
    }

    this.setState({ loading: true });

    const endpoint = createSpaceEndpoint(this.props.space.sys.id);
    const repo = SpaceEnvironmentRepo.create(endpoint);
    let allEnvs;

    try {
      allEnvs = await repo.getAll();
    } catch (_e) {
      this.setState({ loading: false });
      return;
    }

    const envs = allEnvs.filter(env => env.sys.status.sys.id === 'ready');

    const goToSpace = envId => {
      this.props.setOpenedSpaceId(null);
      this.props.goToSpace(this.props.space.sys.id, envId);
    };

    this.setState({ loading: false });

    if (envs.length === 0 || (envs.length === 1 && envs[0].sys.id === 'master')) {
      goToSpace();
    } else if (envs.length === 1) {
      goToSpace(envs[0].sys.id);
    } else {
      this.setState({ environments: envs }, () => {
        this.props.setOpenedSpaceId(this.props.space.sys.id);
      });
    }
  },
  render() {
    const { index, space, currentEnvId, isCurrSpace, goToSpace } = this.props;

    const isOpened = this.isOpened();
    const containerClassNames = `
      nav-sidepanel__space-list-item
      ${isCurrSpace ? 'nav-sidepanel__space-list-item--is-active' : ''}
      ${isOpened ? 'nav-sidepanel__space-list-item--is-open' : ''}
    `;

    const spaceNameClassNames = `
      nav-sidepanel__space-name u-truncate
      ${isCurrSpace ? 'nav-sidepanel__space-name--is-active' : ''}
    `;

    return e(
      'li',
      {
        className: containerClassNames,
        onClick: () => this.toggleEnvironmentList(),
        'data-test-id': `sidepanel-space-link-${index}`,
        'data-test-group-id': 'sidepanel-space-link',
        'aria-selected': isCurrSpace ? 'true' : 'false'
      },
      ...[
        e(
          'div',
          { className: 'nav-sidepanel__space-title' },
          ...[
            e('div', { className: 'nav-sidepanel__space-icon' }, asReact(folderIcon)),
            e('span', { className: spaceNameClassNames }, space.name),
            e('span', {
              className: this.state.loading
                ? 'nav-sidepanel__space-spinner'
                : 'nav-sidepanel__space-open-indicator'
            })
          ]
        ),
        e(
          AnimateHeight,
          { height: isOpened ? 'auto' : '0' },
          e(EnvironmentList, {
            environments: this.state.environments,
            goToSpace,
            isCurrSpace,
            currentEnvId,
            space
          })
        )
      ]
    );
  }
});
