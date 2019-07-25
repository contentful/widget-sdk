/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink.es6';
import { CodeFragment } from 'ui/Content.es6';
import { find } from 'lodash';
import { filter, concat } from 'utils/Collections.es6';
import InfoIcon from 'svg/info.es6';
import { CopyButton, Tag } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

function makeLink(envOrAlias) {
  return {
    sys: {
      type: 'Link',
      linkType: envOrAlias.sys.type,
      id: envOrAlias.sys.id
    }
  };
}

export default function EnvironmentSelector(props) {
  return (
    <div>
      <List {...props} />
      {props.isAdmin && props.spaceEnvironments.length < 2 && <Hint />}
    </div>
  );
}
EnvironmentSelector.propTypes = {
  isAdmin: PropTypes.bool,
  canEdit: PropTypes.bool,
  spaceEnvironments: PropTypes.array.isRequired,
  spaceAliases: PropTypes.array.isRequired,
  updateEnvOrAlias: PropTypes.func.isRequired
};

function Hint() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: tokens.colorIceMid,
        border: '1px solid ' + tokens.colorElementLight,
        padding: '15px',
        margin: '1.5em 0'
      }}>
      <InfoIcon />
      <p
        style={{
          color: tokens.colorTextLight,
          margin: '0',
          marginLeft: '10px'
        }}>
        You {`haven't`} set up any additional environments for this space. Head to the{' '}
        <StateLink key="state-link-environments" to="spaces.detail.settings.environments">
          environment settings
        </StateLink>{' '}
        to learn more.
      </p>
    </div>
  );
}

const copyButtonStyleOverride = css({
  button: {
    backgroundColor: 'transparent',
    border: 'none',
    height: '1.7em',
    width: '2em',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
});

const environmentStyle = {};

const aliasStyle = {
  border: `2px dashed ${tokens.colorElementLight}`
};

function List({ canEdit, spaceEnvironments, spaceAliases, selectedEnvOrAlias, updateEnvOrAlias }) {
  const allEnvOrAlias = spaceAliases.concat(spaceEnvironments);
  // Note that envs[] come from the api_keys endpoint which currently treats Environments and Aliases as Environments
  const isSelected = envOrAlias => !!find(selectedEnvOrAlias, { sys: { id: envOrAlias.sys.id } });
  const toggleEnvironmentSelection = envOrAlias => {
    if (isSelected(envOrAlias)) {
      updateEnvOrAlias(filter(selectedEnvOrAlias, cur => cur.sys.id !== envOrAlias.sys.id));
    } else {
      updateEnvOrAlias(concat(selectedEnvOrAlias, [makeLink(envOrAlias)]));
    }
  };

  return (
    <div>
      {allEnvOrAlias.map(envOrAlias => (
        <div
          key={envOrAlias.sys.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '10px'
          }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'baseline'
            }}>
            <input
              type="checkbox"
              style={{ marginRight: '10px' }}
              checked={isSelected(envOrAlias)}
              disabled={!canEdit || allEnvOrAlias.length < 2}
              onChange={() => toggleEnvironmentSelection(envOrAlias)}
            />
            <CodeFragment
              style={envOrAlias.sys.type === 'Environment' ? environmentStyle : aliasStyle}>
              {envOrAlias.sys.id}
            </CodeFragment>
          </label>
          <div style={{ display: 'inline-block', marginLeft: '6px' }} />
          <CopyButton className={copyButtonStyleOverride} copyValue={envOrAlias.sys.id} />
          <div style={{ display: 'inline-block', marginLeft: '2em' }} />
          {envOrAlias.sys.type === 'Environment' &&
            spaceContext.isMasterEnvironment(envOrAlias) && (
              <Tag tagType="muted">Default environment</Tag>
            )}
        </div>
      ))}
    </div>
  );
}

List.propTypes = {
  canEdit: PropTypes.bool,
  spaceEnvironments: PropTypes.array.isRequired,
  spaceAliases: PropTypes.array.isRequired,
  selectedEnvOrAlias: PropTypes.array.isRequired,
  updateEnvOrAlias: PropTypes.func.isRequired
};
