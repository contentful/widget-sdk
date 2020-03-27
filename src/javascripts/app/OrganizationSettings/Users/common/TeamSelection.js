import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AutocompleteSelection from 'app/common/AutocompleteSelection';
import { Typography, Paragraph, Icon, Tooltip } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import pluralize from 'pluralize';
import {
  Team as TeamPropType,
  TeamSpaceMembership as TeamSpaceMembershipPropType,
} from 'app/OrganizationSettings/PropTypes';
import tokens from '@contentful/forma-36-tokens';
import { joinWithAnd } from 'utils/StringUtils';

const styles = {
  content: css({
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
  }),
  teamName: css({
    width: 200,
  }),
  teamList: css({
    marginTop: tokens.spacingS,
  }),
  toggleButton: css({
    display: 'flex',
  }),
  teamRolesTooltip: css({
    display: 'block',
    whiteSpace: 'pre',
    textAlign: 'left',
  }),
};

export default function TeamSelection({ onRemove, team, teamSpaceMemberships = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AutocompleteSelection
      onRemove={onRemove}
      key={team.sys.id}
      testId="add-to-spaces.list.item"
      extraContent={
        isOpen ? <TeamSpaceMembershipList teamSpaceMemberships={teamSpaceMemberships} /> : null
      }>
      <div className={styles.content}>
        <strong className={styles.teamName}>{team.name}</strong>
        <Toggle
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          count={teamSpaceMemberships.length}
        />
      </div>
    </AutocompleteSelection>
  );
}

TeamSelection.propTypes = {
  onRemove: PropTypes.func.isRequired,
  team: TeamPropType.isRequired,
  teamSpaceMemberships: PropTypes.arrayOf(TeamSpaceMembershipPropType),
};

function Toggle({ isOpen, onClick, count }) {
  const style = css({
    appearance: 'none',
    display: 'flex',
  });
  const hasMemberships = count > 0;
  const label = `in ${pluralize('space', count, true)}`;
  const iconName = isOpen ? 'ChevronUp' : 'ChevronRight';

  if (!hasMemberships) return 'No spaces';

  return (
    /* eslint-disable-next-line rulesdir/restrict-non-f36-components  */
    <button onClick={onClick} className={style}>
      {label}
      <Icon icon={iconName} color="muted" />
    </button>
  );
}
Toggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number.isRequired,
};

function TeamSpaceMembershipList({ teamSpaceMemberships = [] }) {
  const style = css({
    marginLeft: 200,
    marginTop: tokens.spacingS,
  });
  return (
    <Typography className={style}>
      {teamSpaceMemberships &&
        teamSpaceMemberships.map((membership) => (
          <Paragraph key={membership.sys.id}>
            <strong>{membership.sys.space.name}</strong> as {getRolesText(membership)}
          </Paragraph>
        ))}
    </Typography>
  );
}

TeamSpaceMembershipList.propTypes = {
  teamSpaceMemberships: PropTypes.arrayOf(TeamSpaceMembershipPropType).isRequired,
};

// Get a text listing the roles up to a limit
// i.e:
// roles: ['Editor', 'Author', 'Translator', 'Translator 2']
// => Editor, Author and 2 other space roles
function getRolesText(membership) {
  if (membership.admin) return 'Admin';
  if (membership.roles.length > 2) {
    const [first, second, ...rest] = membership.roles;
    return (
      <Tooltip
        content={
          <span className={styles.teamRolesTooltip}>
            {membership.roles.map((role) => `${role.name} \n`)}
          </span>
        }>
        {joinWithAnd([
          first.name,
          second.name,
          `${rest.length} other space ${pluralize('role', rest.length)}`,
        ])}
      </Tooltip>
    );
  }

  return joinWithAnd(membership.roles.map((role) => role.name));
}
