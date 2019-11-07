import React from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import FolderIcon from 'svg/folder.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import { getModule } from 'NgRegistry.es6';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

function EnvironmentList({ environments = [], isCurrSpace, currentEnvId, goToSpace, space }) {
  const spaceContext = getModule('spaceContext');
  return (
    <ul>
      {environments
        .sort(
          (envA, envB) =>
            spaceContext.isMasterEnvironment(envB) - spaceContext.isMasterEnvironment(envA)
        )
        .map(env => {
          const envId = env.sys.id;
          const [alias] = env.sys.aliases || [];
          const isMasterEnvironment = spaceContext.isMasterEnvironment(env);
          const isSelected = isCurrSpace && envId === currentEnvId;

          const environmentClassNames = css({
            margin: 0,
            padding: `${tokens.spacingXs} 0 ${tokens.spacingXs} ${tokens.spacing2Xl}`,
            transition: 'background-color 0.1s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isSelected ? tokens.colorElementMid : undefined,
            '&:hover': {
              backgroundColor: tokens.colorElementMid
            },
            '& > a': {
              color: tokens.colorTextMid,
              maxWidth: '90%'
            }
          });

          return (
            <li
              key={envId}
              className={environmentClassNames}
              onClick={e => {
                e.stopPropagation();
                goToSpace(space.sys.id, envId, isMasterEnvironment);
              }}>
              <a
                href={`/spaces/${space.sys.id}${
                  isMasterEnvironment ? '' : `/environments/${envId}`
                }`}
                onClick={e => {
                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    // allow to open in a new tab/window normally
                    e.stopPropagation();
                  } else {
                    // parent `li` click handler will navigate
                    e.preventDefault();
                  }
                }}>
                <EnvOrAliasLabel
                  aliasId={alias && alias.sys.id}
                  environmentId={envId}
                  isMaster={isMasterEnvironment}
                  isSelected={isSelected}
                />
              </a>
            </li>
          );
        })}
    </ul>
  );
}

EnvironmentList.propTypes = {
  environments: PropTypes.arrayOf(PropTypes.object),
  isCurrSpace: PropTypes.bool,
  currentEnvId: PropTypes.string,
  goToSpace: PropTypes.func.isRequired,
  space: PropTypes.object.isRequired
};

export default class SpaceWithEnvironments extends React.Component {
  static displayName = 'SpaceWithEnvironments';

  static propTypes = {
    openedSpaceId: PropTypes.string,
    space: PropTypes.object.isRequired,
    setOpenedSpaceId: PropTypes.func.isRequired,
    goToSpace: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    currentEnvId: PropTypes.string,
    isCurrSpace: PropTypes.bool
  };

  state = { loading: false, environments: undefined };

  isOpened = () => {
    const { openedSpaceId, space } = this.props;
    return openedSpaceId === space.sys.id;
  };

  toggleEnvironmentList = async () => {
    const spaceContext = getModule('spaceContext');

    if (this.isOpened()) {
      this.props.setOpenedSpaceId(null);
      return;
    }

    this.setState({ loading: true });

    const endpoint = createSpaceEndpoint(this.props.space.sys.id);
    const repo = SpaceEnvironmentRepo.create(endpoint);
    let allEnvs;

    try {
      const { environments } = await repo.getAll();
      allEnvs = environments;
    } catch (_e) {
      this.setState({ loading: false });
      return;
    }

    const envs = allEnvs.filter(env => env.sys.status.sys.id === 'ready');

    const goToSpace = (envId, isMasterEnv, isAliased) => {
      this.props.setOpenedSpaceId(null);
      this.props.goToSpace(this.props.space.sys.id, envId, isMasterEnv, isAliased);
    };

    this.setState({ loading: false });
    if (envs.length === 0 || (envs.length === 1 && spaceContext.isMasterEnvironment(envs[0]))) {
      goToSpace();
    } else if (envs.length === 1) {
      goToSpace(
        envs[0].sys.id,
        spaceContext.isMasterEnvironment(envs[0]),
        spaceContext.getAliasesIds(envs[0]).length > 0
      );
    } else {
      this.setState({ environments: envs }, () => {
        this.props.setOpenedSpaceId(this.props.space.sys.id);
      });
    }
  };

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

    return (
      <li
        className={containerClassNames}
        onClick={() => this.toggleEnvironmentList()}
        data-test-id={`sidepanel-space-link-${index}`}
        data-test-group-id="sidepanel-space-link"
        aria-selected={isCurrSpace ? 'true' : 'false'}>
        <div className="nav-sidepanel__space-title">
          <div className="nav-sidepanel__space-icon">
            <FolderIcon />
          </div>
          <span className={spaceNameClassNames}>{space.name}</span>
          <span
            className={
              this.state.loading
                ? 'nav-sidepanel__space-spinner'
                : 'nav-sidepanel__space-open-indicator'
            }
          />
        </div>
        <AnimateHeight height={isOpened ? 'auto' : 0}>
          <EnvironmentList
            environments={this.state.environments}
            goToSpace={goToSpace}
            isCurrSpace={isCurrSpace}
            currentEnvId={currentEnvId}
            space={space}
          />
        </AnimateHeight>
      </li>
    );
  }
}
