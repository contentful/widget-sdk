import React, { useState, useCallback, useReducer, useMemo, useEffect } from 'react';
import { css } from 'emotion';
import { groupBy } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllRoles } from 'access_control/OrganizationMembershipRepository';
import { SectionHeading, Icon } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import SpacesAutoComplete from 'app/common/SpacesAutocomplete';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor';
import AutocompleteSelection from 'app/common/AutocompleteSelection';
import useAsync from 'app/common/hooks/useAsync';
import { createImmerReducer } from 'redux/utils/createImmerReducer';
import { Space } from 'app/OrganizationSettings/PropTypes';

const styles = {
  count: css({
    marginTop: tokens.spacingM
  }),
  list: css({
    marginTop: tokens.spacingM
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
  roleEditor: css({
    button: {
      height: 30,
      span: {
        padding: '0 .25rem'
      }
    }
  }),
  errorIcon: css({
    marginLeft: tokens.spacingS
  })
};

const reducer = createImmerReducer({
  SPACE_ADDED: (state, action) => {
    const space = action.payload;
    state.spaceMemberships.push({ space, roles: [] });
  },
  SPACE_REMOVED: (state, action) => {
    const spaceId = action.payload;
    state.spaceMemberships = state.spaceMemberships.filter(
      membership => membership.space.sys.id !== spaceId
    );
  },
  ROLES_CHANGED: (state, action) => {
    const { spaceId, roles = [] } = action.payload;
    const item = state.spaceMemberships.find(membership => membership.space.sys.id === spaceId);
    item.roles = roles;
  }
});

/**
 * Holds an object of space memberships and role ids key'd by space id,
 * At this state, admin is held as a role with a fake id for simplicity.
 * The objects will be converted to a real space membership shape in SpaceMembershipRepo.invite
 * Calls a callback when memberships change
 * [{ space: {}, roles: [ROLE_ID_1, ROLE_ID_2]]
 */
export default function AddToSpaces({
  orgId,
  submitted = false,
  ignoredSpaces = [],
  onChange,
  inputWidth = 'full'
}) {
  const [{ spaceMemberships }, dispatch] = useReducer(reducer, { spaceMemberships: [] });
  const [allRoles, setAllRoles] = useState([]);

  const getRoles = useCallback(() => {
    const endpoint = createOrganizationEndpoint(orgId);
    return getAllRoles(endpoint);
  }, [orgId]);

  const { isLoading, data } = useAsync(getRoles);

  const handleSpaceSelected = space => {
    dispatch({ type: 'SPACE_ADDED', payload: space });
  };

  const handleRoleChanged = spaceId => roles => {
    dispatch({ type: 'ROLES_CHANGED', payload: { spaceId, roles } });
  };

  const handleSpaceRemoved = spaceId => {
    dispatch({ type: 'SPACE_REMOVED', payload: spaceId });
  };

  const selectedSpaces = useMemo(() => spaceMemberships.map(membership => membership.space), [
    spaceMemberships
  ]);

  // Create a list composed of `ignoredSpaces` and `selectedSpaces` and pass it down
  // as value. These spaces will not be displayed by SpacesAutocomplete
  const autoCompleteValue = useMemo(() => [...ignoredSpaces, ...selectedSpaces], [
    selectedSpaces,
    ignoredSpaces
  ]);

  useEffect(() => {
    data && setAllRoles(groupBy(data, 'sys.space.sys.id'));
  }, [data]);

  useEffect(() => {
    onChange(spaceMemberships);
  }, [onChange, spaceMemberships]);

  return (
    <div data-test-id="add-to-spaces">
      <SpacesAutoComplete
        orgId={orgId}
        onChange={handleSpaceSelected}
        value={autoCompleteValue}
        inputWidth={inputWidth}
      />
      {selectedSpaces.length > 0 && (
        <SectionHeading className={styles.count}>{`${pluralize(
          'space',
          selectedSpaces.length,
          true
        )} selected`}</SectionHeading>
      )}
      <div className={styles.list}>
        {spaceMemberships.map(({ space, roles }) => (
          <AutocompleteSelection
            onRemove={() => handleSpaceRemoved(space.sys.id)}
            key={space.sys.id}
            testId="add-to-spaces.list.item">
            <div className={styles.leftColumn}>
              <strong className={styles.spaceName}>{space.name}</strong>
              <SpaceRoleEditor
                value={roles}
                isDisabled={isLoading}
                options={allRoles[space.sys.id]}
                onChange={handleRoleChanged(space.sys.id)}
                className={styles.roleEditor}
              />
              {submitted && !roles.length && (
                <Icon icon="ErrorCircle" color="negative" className={styles.errorIcon} />
              )}
            </div>
          </AutocompleteSelection>
        ))}
      </div>
    </div>
  );
}

AddToSpaces.propTypes = {
  orgId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ignoredSpaces: PropTypes.arrayOf(Space),
  submitted: PropTypes.bool,
  inputWidth: PropTypes.oneOf(['small', 'medium', 'large', 'full'])
};
