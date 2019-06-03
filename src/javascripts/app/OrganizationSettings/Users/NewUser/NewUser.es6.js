import React, { useState, useMemo } from 'react';
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
import { parseEmails } from './utils.es6';
import { isValidEmail } from 'utils/StringUtils.es6';

export default function NewUser({ orgId }) {
  const [{ isLoading, error, data }, addToOrg, resetAsyncFn] = useAddToOrg(orgId);
  const [submitted, setSubmitted] = useState(false);
  const [emailsValue, setEmailsValue] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [invalidAddresses, setInvalidAddresses] = useState([]);
  const [orgRole, setOrgRole] = useState('');

  const handleEmailsChange = evt => {
    const {
      target: { value }
    } = evt;
    const parsed = parseEmails(value);
    const invalid = parsed.filter(email => !isValidEmail(email));
    setSubmitted(false);
    setEmailsValue(value);
    setEmailList(parsed);
    setInvalidAddresses(invalid);
  };

  const handleRoleChange = evt => {
    const {
      target: { value }
    } = evt;
    setOrgRole(value);
  };

  const handleSubmit = () => {
    setSubmitted(true);

    if (emailList.length === 0 || invalidAddresses.length || !orgRole) return;

    addToOrg(emailList, orgRole);
  };

  const reset = () => {
    setSubmitted(false);
    setEmailsValue('');
    setEmailList([]);
    setInvalidAddresses([]);
    setOrgRole('');
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

            <FieldGroup>
              <Subheading element="h3">Role</Subheading>
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
              <ValidationMessage testId="new-user.org-role.error">{orgRoleError}</ValidationMessage>
            )}

            <Button testId="new-user.submit" loading={isLoading} onClick={handleSubmit}>
              Submit
            </Button>
          </Form>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

NewUser.propTypes = {
  orgId: PropTypes.string.isRequired
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
