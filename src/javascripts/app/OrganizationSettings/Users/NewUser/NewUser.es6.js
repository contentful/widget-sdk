import React, { useMemo, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  Subheading,
  Paragraph,
  TextField,
  Button,
  FieldGroup,
  RadioButtonField,
  Form,
  ValidationMessage,
  TextLink
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import pluralize from 'pluralize';
import { orgRoles } from 'utils/MembershipUtils.es6';
import { useAddToOrg } from './hooks.es6';
import { isValidEmail, parseList } from 'utils/StringUtils.es6';
import SpaceMembershipList from './SpaceMembershipList.es6';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  subheading: css({
    marginBottom: tokens.spacingS
  })
};

const initialState = {
  submitted: false,
  emailsValue: '',
  emailList: [],
  invalidAddresses: [],
  spaceMemberships: []
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SUBMITTED':
      return { ...state, submitted: true };
    case 'EMAILS_CHANGED': {
      const parsed = parseList(action.payload);
      const invalid = parsed.filter(email => !isValidEmail(email));
      return {
        ...state,
        submitted: false,
        emailsValue: action.payload,
        emailList: parsed,
        invalidAddresses: invalid
      };
    }
    case 'SPACE_MEMBERSHIPS_CHANGED':
      return { ...state, spaceMemberships: action.payload, submitted: false };
    case 'ROLE_CHANGED':
      return { ...state, orgRole: action.payload, submitted: false };
    case 'RESET':
      return { ...initialState };
  }
};

export default function NewUser({ orgId, onReady }) {
  const [{ isLoading, error, data }, addToOrg, resetAsyncFn] = useAddToOrg(orgId);
  const [
    { submitted, emailsValue, emailList, invalidAddresses, orgRole, spaceMemberships },
    dispatch
  ] = useReducer(reducer, initialState);

  const handleEmailsChange = evt => {
    const {
      target: { value }
    } = evt;
    dispatch({ type: 'EMAILS_CHANGED', payload: value });
  };

  const handleRoleChange = evt => {
    const {
      target: { value }
    } = evt;
    dispatch({ type: 'ROLE_CHANGED', payload: value });
  };

  const handleSubmit = () => {
    dispatch({ type: 'SUBMITTED' });

    if (emailList.length === 0 || invalidAddresses.length || !orgRole) return;
    if (spaceMemberships.length && spaceMemberships.some(membership => !membership.roles.length))
      return;

    addToOrg(emailList, orgRole, spaceMemberships);
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    resetAsyncFn();
  };

  const emailsErrorMessage = useMemo(() => {
    if (!submitted) return '';

    if (emailList.length === 0) {
      return 'Please enter at least one email address';
    }

    if (invalidAddresses.length) {
      return `Invalid email addresses: ${invalidAddresses.join(', ')}`;
    }

    if (emailList.length > 100) {
      return `You can only invite 100 users at a time. Please remove ${pluralize(
        'address',
        emailList.length - 100,
        true
      )} to proceed`;
    }

    return '';
  }, [invalidAddresses, emailList, submitted]);

  const orgRoleError = useMemo(() => {
    if (submitted && !orgRole) {
      return 'Please select a role';
    }
    return '';
  }, [orgRole, submitted]);

  const spaceMembershipsError = useMemo(() => {
    if (submitted && spaceMemberships.some(membership => !membership.roles.length)) {
      return `Select space roles for the users you're inviting`;
    }
  }, [spaceMemberships, submitted]);

  // dismiss the loading state of the Angular UI router state
  useEffect(() => {
    onReady();
  }, [onReady]);

  const handleSpaceSelected = useCallback(spaceMemberships => {
    dispatch({ type: 'SPACE_MEMBERSHIPS_CHANGED', payload: spaceMemberships });
  }, []);

  return (
    <Workbench title="Invite users">
      <Workbench.Content centered>
        {error && <Paragraph>Something went wrong</Paragraph>}
        {isLoading && <NewUserProgress emailList={emailList} />}
        {data && <NewUserSuccess emailList={emailList} onRestart={reset} />}

        {!data && !error && !isLoading && (
          <Form>
            <Heading>Invite users to your organization</Heading>
            <TextField
              id="emails"
              name="emails"
              testId="new-user.emails"
              disabled={isLoading}
              textarea
              required
              onChange={handleEmailsChange}
              value={emailsValue}
              labelText="User email(s)"
              validationMessage={emailsErrorMessage}
              helpText="Up to 100 email addresses, separated by comma or line breaks"
            />

            <fieldset>
              <Subheading element="h3" className={styles.subheading}>
                Role
              </Subheading>
              <FieldGroup>
                {orgRoles.map(role => (
                  <RadioButtonField
                    testId="new-user.role"
                    id={role.value}
                    disabled={isLoading}
                    labelText={role.name}
                    helpText={role.description}
                    key={role.value}
                    onChange={handleRoleChange}
                    checked={orgRole === role.value}
                    value={role.value}
                    name="orgRole"
                  />
                ))}
              </FieldGroup>

              {orgRoleError && (
                <ValidationMessage testId="new-user.org-role.error">
                  {orgRoleError}
                </ValidationMessage>
              )}
            </fieldset>

            <fieldset>
              <Subheading element="h3" className={styles.subheading}>
                Spaces
              </Subheading>
              <SpaceMembershipList
                orgId={orgId}
                onChange={handleSpaceSelected}
                submitted={submitted}
              />
              {spaceMembershipsError && (
                <ValidationMessage testId="new-user.space-memberships.error">
                  {spaceMembershipsError}
                </ValidationMessage>
              )}
            </fieldset>

            <Button
              buttonType="positive"
              testId="new-user.submit"
              loading={isLoading}
              onClick={handleSubmit}>
              Send invitations
            </Button>
          </Form>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

NewUser.propTypes = {
  orgId: PropTypes.string.isRequired,
  onReady: PropTypes.func.isRequired
};

const NewUserProgress = ({ emailList }) => {
  return (
    <Typography testId="new-user.progress">
      <Heading>Hold on, {pluralize('users', emailList.length, true)} are being invited</Heading>
      <Paragraph>This might take a while. Please keep this window open.</Paragraph>
    </Typography>
  );
};

NewUserProgress.propTypes = {
  emailList: PropTypes.arrayOf(PropTypes.string)
};

const NewUserSuccess = ({ emailList, onRestart }) => {
  return (
    <Typography testId="new-user.success">
      <Heading>Success!</Heading>
      <Paragraph>{`You've successfully invited ${pluralize(
        'users',
        emailList.length,
        true
      )} to your organization.`}</Paragraph>
      <Paragraph>
        They will receive an invitation e-mail. You can review or revoke their access at any time.
      </Paragraph>
      <Paragraph>
        <TextLink href="#">See all invitations</TextLink>
      </Paragraph>
      <Paragraph>
        <TextLink onClick={onRestart}>Invite more people</TextLink>
      </Paragraph>
    </Typography>
  );
};

NewUserSuccess.propTypes = {
  emailList: PropTypes.arrayOf(PropTypes.string).isRequired,
  onRestart: PropTypes.func.isRequired
};
