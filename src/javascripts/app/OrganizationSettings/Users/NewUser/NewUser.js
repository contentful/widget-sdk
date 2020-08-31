import React, { useMemo, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Subheading,
  Paragraph,
  TextField,
  Button,
  FieldGroup,
  RadioButtonField,
  Form,
  ValidationMessage,
  ModalConfirm,
  Typography,
} from '@contentful/forma-36-react-components';
import pluralize from 'pluralize';
import { orgRoles } from 'utils/MembershipUtils';
import { useAddToOrg } from './NewUserHooks';
import { isValidEmail, parseList, parseCopyPastedEmailAddresses } from 'utils/StringUtils';
import NewUserSuccess from './NewUserSuccess';
import NewUserProgress from './NewUserProgress';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import AddToSpaces from '../common/AddToSpaces';
import AddToTeams from '../common/AddToTeams';

const styles = {
  subheading: css({
    marginBottom: tokens.spacingS,
  }),
};

const initialState = {
  submitted: false,
  emailsValue: '',
  emailList: [],
  invalidAddresses: [],
  spaceMemberships: [],
  teams: [],
  progress: { successes: [], failures: [] },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SUBMITTED':
      return { ...state, submitted: true };
    case 'EMAILS_CHANGED': {
      const parsed = parseList(action.payload);
      const invalid = parsed.filter((email) => !isValidEmail(email));
      return {
        ...state,
        submitted: false,
        emailsValue: action.payload,
        emailList: parsed,
        invalidAddresses: invalid,
      };
    }
    case 'SPACE_MEMBERSHIPS_CHANGED':
      return { ...state, spaceMemberships: action.payload, submitted: false };
    case 'TEAMS_CHANGED':
      return { ...state, teams: action.payload, submitted: false };
    case 'ROLE_CHANGED':
      return { ...state, orgRole: action.payload, submitted: false };
    case 'PROGRESS_CHANGED':
      return { ...state, progress: action.payload };
    case 'RESET':
      return { ...initialState };
  }
};

export default function NewUser({ orgId, hasTeamsFeature, isOwner }) {
  const [
    {
      submitted,
      emailsValue,
      emailList,
      invalidAddresses,
      orgRole,
      spaceMemberships,
      teams,
      progress,
    },
    dispatch,
  ] = useReducer(reducer, initialState);
  const handleProgressChange = (payload) => dispatch({ type: 'PROGRESS_CHANGED', payload });
  const [{ isLoading, error, data }, addToOrg, resetAsyncFn] = useAddToOrg(
    orgId,
    handleProgressChange
  );

  const handleEmailsChange = (evt) => {
    const {
      target: { value },
    } = evt;
    dispatch({ type: 'EMAILS_CHANGED', payload: value });
  };

  /*
    Handles copy-pasting emails with the format
    "John Doe <john.doe@example.com>, Jane Doe <jane.doe@example.com>"
    It will only paste the email addresses
  */
  const handleEmailsPaste = (evt) => {
    const text = evt.clipboardData.getData('text');
    const target = evt.target;
    // use comma as separator if it's already being used
    // otherwise, use new lines
    const separator = /,/.test(target.value) ? ', ' : '\n';
    // match whatever is betwen < and >
    const paste = parseCopyPastedEmailAddresses(text, separator);

    if (paste.length) {
      // pastes
      target.setRangeText(paste, target.selectionStart, target.selectionEnd, 'end');
      dispatch({ type: 'EMAILS_CHANGED', payload: target.value });
      evt.preventDefault();
    }
  };

  const handleRoleChange = (evt) => {
    const {
      target: { value },
    } = evt;
    dispatch({ type: 'ROLE_CHANGED', payload: value });
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMITTED' });

    if (emailList.length === 0 || invalidAddresses.length || !orgRole) return;
    if (spaceMemberships.length && spaceMemberships.some((membership) => !membership.roles.length))
      return;

    if (!spaceMemberships.length && !teams.length) {
      // if no spaces or teams were selected, display a confirmation dialog
      const confirmed = await confirmNoSpaces(emailList.length);
      if (!confirmed) return;
    }

    addToOrg(emailList, orgRole, spaceMemberships, teams);
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    resetAsyncFn();
  };

  const emailsErrorMessage = useMemo(() => {
    if (!submitted) return '';

    if (emailList.length === 0) {
      return 'Enter at least one email address so we can invite them to your organization';
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
      return `Choose an organization role for the people you're inviting`;
    }
    return '';
  }, [orgRole, submitted]);

  const spaceMembershipsError = useMemo(() => {
    if (submitted && spaceMemberships.some((membership) => !membership.roles.length)) {
      return `Select space roles for the users you're inviting`;
    }
  }, [spaceMemberships, submitted]);

  const availableOrgRoles = isOwner ? orgRoles : orgRoles.filter((role) => role.value !== 'owner');

  const handleSpaceSelected = useCallback((spaceMemberships) => {
    dispatch({ type: 'SPACE_MEMBERSHIPS_CHANGED', payload: spaceMemberships });
  }, []);

  const handleTeamSelected = useCallback((teams) => {
    dispatch({ type: 'TEAMS_CHANGED', payload: teams });
  }, []);

  return (
    <>
      {error && <Paragraph>Something went wrong</Paragraph>}
      {isLoading && <NewUserProgress progress={progress} emailList={emailList} />}
      {data && (
        <NewUserSuccess
          failures={data.failures}
          successes={data.successes}
          onRestart={reset}
          orgId={orgId}
        />
      )}
      {!data && !error && !isLoading && (
        <Form data-test-id="new-user-invitation-form">
          <Heading>Invite users to your organization</Heading>
          <TextField
            id="emails"
            name="emails"
            testId="new-user.emails"
            disabled={isLoading}
            textarea
            required
            onChange={handleEmailsChange}
            onPaste={handleEmailsPaste}
            value={emailsValue}
            labelText="User email(s)"
            validationMessage={emailsErrorMessage}
            helpText="Up to 100 email addresses, separated by comma or line breaks"
          />

          <fieldset>
            <Subheading element="h3" className={styles.subheading}>
              Choose an organization role
            </Subheading>
            <FieldGroup>
              {availableOrgRoles.map((role) => (
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
              <ValidationMessage testId="new-user.org-role.error">{orgRoleError}</ValidationMessage>
            )}
          </fieldset>

          <fieldset>
            <Subheading element="h3" className={styles.subheading}>
              Add to spaces
            </Subheading>
            <AddToSpaces
              orgId={orgId}
              onChange={handleSpaceSelected}
              submitted={submitted}
              inputWidth="large"
            />
            {spaceMembershipsError && (
              <ValidationMessage testId="new-user.space-memberships.error">
                {spaceMembershipsError}
              </ValidationMessage>
            )}
          </fieldset>
          {hasTeamsFeature && (
            <fieldset>
              <Subheading element="h3" className={styles.subheading}>
                Add to teams
              </Subheading>
              <AddToTeams orgId={orgId} onChange={handleTeamSelected} inputWidth="large" />
            </fieldset>
          )}

          <Button
            buttonType="positive"
            testId="new-user.submit"
            loading={isLoading}
            onClick={handleSubmit}>
            Send invitations
          </Button>
        </Form>
      )}
    </>
  );
}

NewUser.propTypes = {
  orgId: PropTypes.string.isRequired,
  hasTeamsFeature: PropTypes.bool,
  isOwner: PropTypes.bool,
};

async function confirmNoSpaces(count) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      isShown={isShown}
      title="Invite without access to a space"
      onConfirm={() => {
        onClose(true);
      }}
      onCancel={() => {
        onClose(false);
      }}
      confirmLabel="Send invitations anyway"
      testId="new-user.no-spaces-confirmation">
      <Typography>
        <Paragraph>
          Are you sure you want to invite {count > 1 ? `${count} users` : 'a user'} without access
          to a space?
        </Paragraph>
        <Paragraph>{`They won't be able to create or edit content. You can change that by adding them to spaces later.`}</Paragraph>
      </Typography>
    </ModalConfirm>
  ));
}
