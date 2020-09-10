import React from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import FolderIcon from 'svg/folder.svg';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { isMasterEnvironment, getEnvironmentAliasesIds } from 'core/services/SpaceEnvContext/utils';

function EnvironmentList({ environments = [], isCurrSpace, currentEnvId, goToSpace, space }) {
  return (
    <ul>
      {environments
        .sort((envA, envB) => {
          return isMasterEnvironment(envB) - isMasterEnvironment(envA);
        })
        .map((env) => {
          const envId = env.sys.id;
          const [alias] = env.sys.aliases || [];
          const environmentIsMaster = isMasterEnvironment(env);
          const isSelected = isCurrSpace && envId === currentEnvId;

          const environmentClassNames = css({
            margin: 0,
            padding: `${tokens.spacingXs} 0 ${tokens.spacingXs} ${tokens.spacing2Xl}`,
            transition: 'background-color 0.1s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isSelected ? tokens.colorElementMid : undefined,
            '&:hover': {
              backgroundColor: tokens.colorElementMid,
            },
            '& > a': {
              color: tokens.colorTextMid,
              maxWidth: '90%',
            },
          });

          return (
            <li
              key={envId}
              className={environmentClassNames}
              onClick={(e) => {
                e.stopPropagation();
                goToSpace(space.sys.id, envId, environmentIsMaster);
              }}>
              <a
                href={`/spaces/${space.sys.id}${
                  environmentIsMaster ? '' : `/environments/${envId}`
                }`}
                onClick={(e) => {
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
                  isMaster={environmentIsMaster}
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
  space: PropTypes.object.isRequired,
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
    isCurrSpace: PropTypes.bool,
  };

  static contextType = SpaceEnvContext;

  state = { loading: false, environments: undefined };

  componentDidMount() {
    if (this.isOpened()) this.refreshEnvironmentsList();
  }

  isOpened = () => {
    const { openedSpaceId, space } = this.props;
    return openedSpaceId === space.sys.id;
  };

  toggleEnvironmentList = async () => {
    if (this.isOpened()) {
      this.props.setOpenedSpaceId(null);
      return;
    }
    this.refreshEnvironmentsList();
  };

  refreshEnvironmentsList = async () => {
    const { currentSpaceId, currentSpaceEnvironments } = this.context;
    this.setState({ loading: true });

    const {
      space: {
        sys: { id: spaceId },
      },
      setOpenedSpaceId,
      goToSpace,
    } = this.props;

    const endpoint = createSpaceEndpoint(spaceId);
    const repo = SpaceEnvironmentRepo.create(endpoint);
    let allEnvs = currentSpaceEnvironments;

    const isSameSpace = currentSpaceEnvironments.length && currentSpaceId === spaceId;
    if (!isSameSpace) {
      try {
        const { environments } = await repo.getAll();
        allEnvs = environments;
      } catch (_e) {
        this.setState({ loading: false });
        return;
      }
    }

    const readyEnvironments = allEnvs.filter((env) => env.sys.status.sys.id === 'ready');
    const goToSpaceReset = (envId, isMasterEnv, isAliased) => {
      setOpenedSpaceId(null);
      goToSpace(spaceId, envId, isMasterEnv, isAliased);
    };

    this.setState({ loading: false });

    if (
      readyEnvironments.length === 0 ||
      (readyEnvironments.length === 1 && isMasterEnvironment(readyEnvironments[0]))
    ) {
      goToSpaceReset();
    } else if (readyEnvironments.length === 1) {
      goToSpaceReset(
        readyEnvironments[0].sys.id,
        isMasterEnvironment(readyEnvironments[0]),
        getEnvironmentAliasesIds(readyEnvironments[0]).length > 0
      );
    } else {
      this.setState({ environments: readyEnvironments }, () => {
        setOpenedSpaceId(spaceId);
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
