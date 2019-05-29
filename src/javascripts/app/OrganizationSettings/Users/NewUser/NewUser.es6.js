import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Subheading,
  Paragraph,
  TextField,
  Button,
  FieldGroup,
  RadioButtonField,
  Form
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import { orgRoles } from 'utils/MembershipUtils.es6';
import { useAddToOrg } from './hooks.es6';
import { parseEmails } from './utils.es6';
import { isValidEmail } from 'utils/StringUtils.es6';

export default function NewUser({ orgId }) {
  const [{ isLoading, error, data }, addToOrg] = useAddToOrg(orgId);
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
    if (invalidAddresses.length) return;
    addToOrg(emailList, orgRole);
  };

  const reset = () => {
    setSubmitted(false);
    setEmailsValue('');
    setEmailList([]);
    setInvalidAddresses([]);
    setOrgRole('');
  };

  const formErrorMessage = useMemo(() => {
    return invalidAddresses.length ? `Invalid email addresses: ${invalidAddresses.join(', ')}` : '';
  }, [invalidAddresses]);

  useEffect(() => {
    if (data && !error) {
      reset();
    }
  }, [data, error]);

  return (
    <Workbench title="Invite users">
      <Workbench.Content centered>
        {error && <Paragraph>Something went wrong</Paragraph>}
        {isLoading && <Paragraph>Hold on. Inviting</Paragraph>}
        {data && <Paragraph>Success!</Paragraph>}

        <Form>
          <Heading>Invite users to your organization</Heading>
          <TextField
            id="emails"
            disabled={isLoading}
            textarea
            required
            onChange={handleEmailsChange}
            value={emailsValue}
            requiredText="required"
            labelText="User email(s)"
            validationMessage={submitted ? formErrorMessage : ''}
            helpText="Up to 100 email addresses, separated by comma or line breaks"
          />

          <FieldGroup>
            <Subheading element="h3">Role</Subheading>
            {orgRoles.map(role => (
              <RadioButtonField
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

          <Button loading={isLoading} onClick={handleSubmit}>
            Submit
          </Button>
        </Form>
      </Workbench.Content>
    </Workbench>
  );
}

NewUser.propTypes = {
  orgId: PropTypes.string.isRequired
};
