/* eslint "rulesdir/restrict-inline-styles": "warn" */
/* eslint "rulesdir/enforce-getModule-call-inside-fn": "off" */
import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink.es6';
import { CodeFragment } from 'ui/Content.es6';
import { find } from 'lodash';
import { filter, concat } from 'utils/Collections.es6';
import InfoIcon from 'svg/info.es6';
import { CheckboxField, SectionHeading } from '@contentful/forma-36-react-components';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel.es6';
import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

const styles = {
  aliasSpacer: css({ marginBottom: tokens.spacingL }),
  hint: css({
    display: 'flex',
    alignItems: 'center',
    background: tokens.colorIceMid,
    border: `1px solid ${tokens.colorElementLight}`,
    padding: tokens.spacingM,
    margin: `${tokens.spacingL} 0`
  }),
  hintParagraph: css({
    color: tokens.colorTextLight,
    margin: '0',
    marginLeft: tokens.spacingS
  }),
  environmentDiv: css({
    display: 'flex',
    alignItems: 'center',
    marginTop: tokens.spacingL
  }),
  label: css({
    display: 'flex',
    alignItems: 'baseline'
  }),
  toolTipFix: css({
    bottom: 0
  })
};

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
  updateEnvOrAliasLabel: PropTypes.func.isRequired
};

function Hint() {
  return (
    <div className={styles.hint}>
      <InfoIcon />
      <p className={styles.hintParagraph}>
        You {`haven't`} set up any additional environments for this space. Head to the{' '}
        <StateLink key="state-link-environments" to="spaces.detail.settings.environments">
          environment settings
        </StateLink>{' '}
        to learn more.
      </p>
    </div>
  );
}

function ListEnvironments({ environments, canEdit, isSelected, showDefault, toggleSelection }) {
  return environments.map(environment => {
    const isMaster = spaceContext.isMasterEnvironment(environment);
    return (
      <label key={environment.sys.id} className={styles.label}>
        <div className={styles.environmentDiv}>
          <CheckboxField
            labelText=""
            id={`environment-{environment.sys.id}`}
            checked={isSelected(environment)}
            disabled={!canEdit}
            onChange={() => toggleSelection(environment)}
          />
          <CodeFragment>
            <EnvOrAliasLabel
              isSelected={showDefault ? isMaster : false}
              showAliasedTo={false}
              isMaster={isMaster}
              environmentId={environment.sys.id}
            />
          </CodeFragment>
        </div>
      </label>
    );
  });
}

function ListAliases({ aliases, canEdit, isSelected, toggleSelection }) {
  return aliases.map(alias => {
    const isMaster = spaceContext.isMasterEnvironment(alias);
    return (
      <label key={alias.sys.id} className={styles.label}>
        <div className={styles.environmentDiv}>
          <CheckboxField
            labelText=""
            id={`alias-{alias.sys.id}`}
            checked={isSelected(alias)}
            disabled={!canEdit}
            onChange={() => toggleSelection(alias)}
          />
          <CodeFragment>
            <EnvOrAliasLabel
              isSelected={isMaster}
              showAliasedTo={false}
              isMaster={isMaster}
              aliasId={alias.sys.id}
              environmentId={alias.sys.id}
            />
          </CodeFragment>
        </div>
      </label>
    );
  });
}

function List({
  canEdit,
  spaceEnvironments,
  spaceAliases,
  selectedEnvOrAliasLabel,
  updateEnvOrAliasLabel
}) {
  const envAndAliasCount = spaceAliases.length + spaceEnvironments.length;
  // Note that envs[] come from the api_keys endpoint which currently treats Environments and Aliases as Environments
  const isSelected = envOrAlias =>
    !!find(selectedEnvOrAliasLabel, { sys: { id: envOrAlias.sys.id } });
  const toggleSelection = envOrAlias => {
    if (isSelected(envOrAlias)) {
      updateEnvOrAliasLabel(
        filter(selectedEnvOrAliasLabel, cur => cur.sys.id !== envOrAlias.sys.id)
      );
    } else {
      updateEnvOrAliasLabel(concat(selectedEnvOrAliasLabel, [makeLink(envOrAlias)]));
    }
  };

  if (spaceAliases.length > 0) {
    return (
      <>
        <div className={styles.environmentDiv}>
          <SectionHeading element="h4">Environment Aliases</SectionHeading>
        </div>
        <div className={styles.aliasSpacer}>
          <ListAliases
            aliases={spaceAliases}
            isSelected={isSelected}
            toggleSelection={toggleSelection}
            canEdit={canEdit && envAndAliasCount > 1}
          />
        </div>
        <SectionHeading element="h4">Environments</SectionHeading>
        <div>
          <ListEnvironments
            showDefault={false}
            environments={spaceEnvironments}
            isSelected={isSelected}
            toggleSelection={toggleSelection}
            canEdit={canEdit && envAndAliasCount > 1}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <ListEnvironments
        showDefault={true}
        environments={spaceEnvironments}
        isSelected={isSelected}
        toggleSelection={toggleSelection}
        canEdit={canEdit && envAndAliasCount > 1}
      />
    </div>
  );
}

List.propTypes = {
  canEdit: PropTypes.bool,
  spaceEnvironments: PropTypes.array.isRequired,
  spaceAliases: PropTypes.array.isRequired,
  selectedEnvOrAliasLabel: PropTypes.array.isRequired,
  updateEnvOrAliasLabel: PropTypes.func.isRequired
};
