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
import { Spinner, Flex } from '@contentful/forma-36-react-components';

function EnvironmentList({
  environments = [],
  isCurrSpace,
  currentEnvId,
  currentAliasId,
  goToSpace,
  space,
}) {
  const sortedEnvOrAliases = environments
    .map((env) =>
      env.sys.aliases
        ? env.sys.aliases.map((alias) => ({
            aliasId: alias.sys.id,
            isMasterEnvironment: isMasterEnvironment(env),
            environmentId: env.sys.id,
            isSelected: isCurrSpace && alias.sys.id === currentAliasId,
          }))
        : []
    )
    .concat(
      environments.map((env) => ({
        aliasId: null,
        isMasterEnvironment: isMasterEnvironment(env),
        environmentId: env.sys.id,
        isSelected: isCurrSpace && !currentAliasId && env.sys.id === currentEnvId,
      }))
    )
    .reduce((acc, val) => acc.concat(val), [])
    .sort((envOrAliasA, envOrAliasB) => {
      // sort aliases higher than envs
      if (envOrAliasA.aliasId && !envOrAliasB.aliasId) {
        return -1;
      } else if (envOrAliasB.aliasId && !envOrAliasA.aliasId) {
        return 1;
      }

      // sort master highly
      if ((envOrAliasA.aliasId || envOrAliasA.environmentId) === 'master') {
        return -1;
      } else if ((envOrAliasB.aliasId || envOrAliasB.environmentId) === 'master') {
        return 1;
      }

      // sort by name
      return (envOrAliasA.aliasId || envOrAliasA.environmentId).localeCompare(
        envOrAliasB.aliasId || envOrAliasB.environmentId
      );
    });

  return (
    <ul>
      {sortedEnvOrAliases.map((envOrAlias) => {
        const environmentClassNames = css({
          margin: 0,
          padding: `${tokens.spacingXs} 0 ${tokens.spacingXs} ${tokens.spacing2Xl}`,
          transition: 'background-color 0.1s ease-in-out',
          display: 'flex',
          alignEnvOrAliass: 'center',
          backgroundColor: envOrAlias.isSelected ? tokens.colorElementMid : undefined,
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
            key={envOrAlias.aliasId || envOrAlias.environmentId}
            className={environmentClassNames}
            onClick={(e) => {
              e.stopPropagation();
              goToSpace(
                space.sys.id,
                envOrAlias.aliasId || envOrAlias.environmentId,
                envOrAlias.aliasId === 'master' || envOrAlias.environmentId === 'master'
                  ? true
                  : false
              );
            }}>
            <a
              href={`/spaces/${space.sys.id}${
                envOrAlias.aliasId === 'master' || envOrAlias.environmentId === 'master'
                  ? ''
                  : `/environments/${envOrAlias.aliasId || envOrAlias.environmentId}`
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
              <EnvOrAliasLabel {...envOrAlias} />
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
  currentAliasId: PropTypes.string,
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
    currentAliasId: PropTypes.string,
    isCurrSpace: PropTypes.bool,
  };

  static contextType = SpaceEnvContext;

  state = { loading: false, environments: undefined };

  componentDidMount() {
    if (this.isOpened()) {
      this.refreshEnvironmentsList();
    }
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
    const { index, space, currentEnvId, currentAliasId, isCurrSpace, goToSpace } = this.props;

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
          <span className={spaceNameClassNames}>{space.name} </span>
          {this.state.loading ? (
            <Flex marginRight="spacingM">
              <Spinner size="small" />
            </Flex>
          ) : (
            <span className="nav-sidepanel__space-open-indicator" />
          )}
        </div>
        <AnimateHeight height={isOpened ? 'auto' : 0}>
          <EnvironmentList
            environments={this.state.environments}
            goToSpace={goToSpace}
            isCurrSpace={isCurrSpace}
            currentEnvId={currentEnvId}
            currentAliasId={currentAliasId}
            space={space}
          />
        </AnimateHeight>
      </li>
    );
  }
}
