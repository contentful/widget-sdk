import React, { useState } from 'react';
import { connect } from 'react-redux';
import { without } from 'lodash';
import { flow, filter as ldFilter, sortBy, map } from 'lodash/fp';
import { css } from 'emotion';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import {
  Option,
  Select,
  Button,
  TextInput,
  IconButton,
  Card,
  Heading
} from '@contentful/forma-36-react-components';
import sharedStyles from './sharedStyles.es6';

const membershipIdsToMembers = (membershipIds, allMemberships) =>
  allMemberships.filter(({ sys: { id } }) => membershipIds.includes(id));

const sort = sortBy(['sys.user.firstName', 'sys.user.lastName', 'sys.user.email']);

const styles = {
  card: css({
    display: 'inline-block',
    minWidth: '20rem',
    flex: 1
  }),
  addMemberButton: css({
    display: 'inline-block'
  })
};

export default connect(state => ({
  allOrgMemberships: Object.values(getOrgMemberships(state)),
  orgId: getOrgId(state)
}))(({ allOrgMemberships, projectMemberIds, setProjectMemberIds, editing, orgId }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <Card className={styles.card}>
      <Heading className={sharedStyles.heading}>{`Members (${projectMemberIds.length})`}</Heading>
      {editing && (
        <div className="project-home__add-member">
          <TextInput
            placeholder="filter users to select..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <div style={{ display: 'flex' }}>
            <Select
              value={selectedUser}
              onChange={({ target: { value } }) => setSelectedUser(value)}>
              <Option value="" disabled>
                Please select an user
              </Option>
              {flow(
                ldFilter(
                  ({
                    sys: {
                      id,
                      user: { firstName, lastName, email }
                    }
                  }) =>
                    firstName &&
                    lastName &&
                    email &&
                    !projectMemberIds.includes(id) &&
                    (filter === '' ||
                      firstName.toLowerCase().includes(filter.toLowerCase()) ||
                      lastName.toLowerCase().includes(filter.toLowerCase()) ||
                      email.toLowerCase().includes(filter.toLowerCase()))
                ),
                sort,
                map(({ sys: { id, user: { firstName, lastName, email } } }) => (
                  <Option key={id} value={id}>
                    {firstName} {lastName} ({email})
                  </Option>
                ))
              )(allOrgMemberships)}
            </Select>
            <Button
              className={styles.addMemberButton}
              disabled={selectedUser === ''}
              buttonType="primary"
              size="small"
              onClick={() =>
                setSelectedUser('') ||
                setFilter('') ||
                setProjectMemberIds(projectMemberIds.concat(selectedUser))
              }>
              Add member
            </Button>
          </div>
        </div>
      )}
      <div>
        {sort(membershipIdsToMembers(projectMemberIds, allOrgMemberships)).map(
          ({
            sys: {
              id,
              user: { firstName, lastName, email }
            }
          }) => (
            <div key={id}>
              <a
                href={`/account/organizations/${orgId}/organization_memberships/${id}`}
                target="_blank"
                rel="noopener noreferrer">
                {firstName} {lastName} ({email})
              </a>
              {editing && (
                <IconButton
                  label="remove"
                  iconProps={{ icon: 'Close' }}
                  buttonType="negative"
                  onClick={() => setProjectMemberIds(without(projectMemberIds, id))}
                />
              )}
            </div>
          )
        )}
      </div>
    </Card>
  );
});
