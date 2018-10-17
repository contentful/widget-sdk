import React from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import { Badge, CodeFragment } from 'ui/Content.es6';
import { byName as Colors } from 'Styles/Colors.es6';
import { find } from 'lodash';
import { filter, concat } from 'utils/Collections.es6';
import InfoIcon from 'svg/info.es6';
import CopyButton from 'ui/Components/CopyIconButton.es6';

function makeLink(env) {
  return {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: env.sys.id
    }
  };
}

export default function(props) {
  return (
    <div>
      <List {...props} />
      {props.isAdmin && props.spaceEnvironments.length < 2 && <Hint />}
    </div>
  );
}

function Hint() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: Colors.iceMid,
        border: '1px solid ' + Colors.elementLight,
        padding: '15px',
        margin: '1.5em 0'
      }}>
      <InfoIcon />
      <p
        style={{
          color: Colors.textLight,
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

function List({ canEdit, spaceEnvironments, envs, updateEnvs }) {
  const isSelected = env => !!find(envs, { sys: { id: env.sys.id } });

  const toggleEnvironmentSelection = env => {
    if (isSelected(env)) {
      updateEnvs(filter(envs, cur => cur.sys.id !== env.sys.id));
    } else {
      updateEnvs(concat(envs, [makeLink(env)]));
    }
  };

  return (
    <div>
      {spaceEnvironments.map(env => (
        <div
          key={env.sys.id}
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
              checked={isSelected(env)}
              disabled={!canEdit || spaceEnvironments.length < 2}
              onChange={() => toggleEnvironmentSelection(env)}
            />
            <CodeFragment>{env.sys.id}</CodeFragment>
          </label>
          <div style={{ display: 'inline-block', marginLeft: '6px' }} />
          <CopyButton value={env.sys.id} />
          <div style={{ display: 'inline-block', marginLeft: '2em' }} />
          {env.sys.id === 'master' && <Badge>Default environment</Badge>}
        </div>
      ))}
    </div>
  );
}
List.propTypes = {
  canEdit: PropTypes.bool,
  spaceEnvironments: PropTypes.array,
  envs: PropTypes.array,
  updateEnvs: PropTypes.func
};
