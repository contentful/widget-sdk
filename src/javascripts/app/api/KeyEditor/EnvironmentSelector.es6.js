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

function makeLink(env) {
  return {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: env.sys.id
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
  spaceEnvironments: PropTypes.array.isRequired
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
          <CopyButton className={copyButtonStyleOverride} copyValue={env.sys.id} />
          <div style={{ display: 'inline-block', marginLeft: '2em' }} />
          {spaceContext.isMasterEnvironment(env) && <Tag tagType="muted">Default environment</Tag>}
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
