import React, { useState, useCallback, useReducer, useMemo, useEffect } from 'react';
import { css } from 'emotion';
import { groupBy } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import { SectionHeading, IconButton, Icon } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import SpacesAutoComplete from 'app/common/SpacesAutocomplete.es6';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';
import useAsync from 'app/common/hooks/useAsync.es6';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';

const styles = {
  count: css({
    marginTop: tokens.spacingM
  }),
  list: css({
    marginTop: tokens.spacingM
  }),
  listItem: css({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 10px',
    margin: 0,
    alignItems: 'center',
    ':hover': {
      backgroundColor: tokens.colorElementLightest
    }
  }),
  leftColumn: css({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }),
  spaceName: css({
    fontWeight: tokens.fontWeightMedium,
    width: 200
  }),
  roleEditor: css({}),
  errorIcon: css({
    marginLeft: tokens.spacingS
  })
};

const reducer = createImmerReducer({
  SPACE_ADDED: (state, action) => {
    const space = action.payload;
    state.spaceMemberships[space.sys.id] = { space, roles: [] };
  },
  SPACE_REMOVED: (state, action) => {
    const spaceId = action.payload;
    delete state.spaceMemberships[spaceId];
  },
  ROLES_CHANGED: (state, action) => {
    const { spaceId, roles = [] } = action.payload;
    state.spaceMemberships[spaceId].roles = roles;
  }
});

/**
 * Holds an object of space memberships and role ids key'd by space id,
 * At this state, admin is held as a role with a fake id for simplicity.
 * The objects will be converted to a real space membership shape in SpaceMembershipRepo.invite
 * Calls a callback when memberships change
 * { SPACE_ID: [ROLE_ID_1, ROLE_ID_2] }
 */
export default function SpaceMembershipList({ orgId, submitted = false, onChange }) {
  const [{ spaceMemberships }, dispatch] = useReducer(reducer, { spaceMemberships: {} });
  const [allRoles, setAllRoles] = useState([]);

  const getRoles = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    const allRoles = await getAllRoles(endpoint);

    setAllRoles(groupBy(allRoles, 'sys.space.sys.id'));
  }, [orgId]);

  const { isLoading } = useAsync(getRoles);

  const handleSpaceSelected = space => {
    dispatch({ type: 'SPACE_ADDED', payload: space });
  };

  const handleRoleChanged = spaceId => roles => {
    dispatch({ type: 'ROLES_CHANGED', payload: { spaceId, roles } });
  };

  const handleSpaceRemoved = spaceId => {
    dispatch({ type: 'SPACE_REMOVED', payload: spaceId });
  };

  const selectedSpaces = useMemo(
    () => Object.values(spaceMemberships).map(membership => membership.space),
    [spaceMemberships]
  );

  useEffect(() => {
    if (!Object.keys(spaceMemberships).length) return;

    onChange(Object.values(spaceMemberships));
  }, [onChange, spaceMemberships]);

  return (
    <>
      <SpacesAutoComplete orgId={orgId} onChange={handleSpaceSelected} value={selectedSpaces} />
      {selectedSpaces.length > 0 && (
        <SectionHeading className={styles.count}>{`${pluralize(
          'space',
          selectedSpaces.length,
          true
        )} selected`}</SectionHeading>
      )}
      <ul className={styles.list}>
        {Object.values(spaceMemberships).map(({ space, roles }) => (
          <li key={space.sys.id} className={styles.listItem}>
            <div className={styles.leftColumn}>
              <strong className={styles.spaceName}>{space.name}</strong>
              {/* <div className={styles.roleEditor}> */}
              <SpaceRoleEditor
                value={roles}
                isDisabled={isLoading}
                options={allRoles[space.sys.id]}
                onChange={handleRoleChanged(space.sys.id)}
              />
              {submitted && !roles.length && (
                <Icon icon="ErrorCircle" color="negative" className={styles.errorIcon} />
              )}
              {/* </div> */}
            </div>
            <IconButton
              buttonType="secondary"
              iconProps={{ icon: 'Close' }}
              onClick={() => handleSpaceRemoved(space.sys.id)}
              label="Remove space"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

SpaceMembershipList.propTypes = {
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool
};
