import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Button,
  TextField,
  Note,
  Typography,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { useSsoConnectionTest } from '../services/useSsoConnectionTest';
import { formatConnectionTestErrors } from 'app/OrganizationSettings/SSO/utils';

export function TestConnection({ orgId, disabled = true, ssoConfig = {}, onComplete }) {
  const [state, runTest, cancelTest] = useSsoConnectionTest(orgId);
  const { isLoading } = state;
  const isSuccess = ssoConfig?.testConnectionResult === 'success';
  const isFailure = ssoConfig?.testConnectionResult === 'failure';
  const isUnknown = ssoConfig?.testConnectionAt && !isSuccess && !isFailure;

  const handleSubmit = () => {
    runTest().then(onComplete);
  };

  return (
    <Typography>
      <Heading element="h2">Test connection</Heading>
      <Paragraph>
        You need a user account in your SSO provider and permission to use the Contentful app in
        your SSO provider to test the connection.
      </Paragraph>

      <Paragraph>
        <Button
          disabled={disabled}
          onClick={handleSubmit}
          loading={isLoading}
          testId="test-idp-connection.submit">
          {!isLoading && !isSuccess && `Test connection`}
          {!isLoading && isSuccess && `Retest connection`}
          {isLoading && `Testing connection`}
        </Button>
        {isLoading && (
          <Button buttonType="negative" onClick={cancelTest} testId="test-idp-connection.cancel">
            Cancel
          </Button>
        )}
      </Paragraph>

      {!isLoading && (
        <div>
          {isUnknown && (
            <Note testId="test-idp-connection.result.unknown" noteType="warning">
              An unknown error occured while testing the connection. Try again.
            </Note>
          )}
          {isFailure && (
            <Note testId="test-idp-connection.result.failure" noteType="negative">
              Connection wasn’t established. View the Error log below for more information.
            </Note>
          )}
          {isSuccess && (
            <Note testId="test-idp-connection.result.success" noteType="positive">
              Connection test successful!
            </Note>
          )}
        </div>
      )}

      {!isLoading && isFailure && (
        <div>
          <TextField
            textarea
            id="test-idp-connection.errors"
            name="test-errors"
            labelText="Error log"
            textInputProps={{
              rows: 5,
            }}
            testId="errors"
            value={formatConnectionTestErrors(ssoConfig.errors).join('\n')}
          />
        </div>
      )}
    </Typography>
  );
}

TestConnection.propTypes = {
  orgId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  onComplete: PropTypes.func.isRequired,
  ssoConfig: PropTypes.shape({
    result: PropTypes.string,
    timestamp: PropTypes.string,
    errors: PropTypes.array,
  }),
};
