import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Note,
  TextLink,
  Typography,
  Heading,
  Paragraph,
  Textarea,
  Subheading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { css } from 'emotion';
import { href } from 'states/Navigator';
import { isForbidden } from 'utils/ServerErrorUtils';

const noteStyle = css({
  marginBottom: tokens.spacingS
});

const failedEmailsStyle = css({
  marginBottom: tokens.spacingS,
  textarea: {
    resize: 'none'
  }
});

const linkStyle = css({
  marginLeft: tokens.spacingM
});

export default function NewUserSuccess({ failures = [], successes = [], onRestart, orgId }) {
  const invitationsUrl = useMemo(
    () =>
      href({
        path: ['account', 'organizations', 'users', 'invitations'],
        params: { orgId }
      }),
    [orgId]
  );
  const isTotalSuccess = !failures.length;
  const isTotalFailure = !successes.length;
  const isPartialSuccess = !isTotalFailure && !isTotalSuccess;

  const title = useMemo(() => {
    if (isTotalFailure) return `${pluralize('user', failures.length, true)} couldn’t be invited`;
    if (isPartialSuccess) return 'Some users were invited';

    return 'Done!';
  }, [isTotalFailure, failures, isPartialSuccess]);

  return (
    <Typography testId="new-user.done">
      <Heading>{title}</Heading>

      {!failures.length && (
        <Paragraph>{`You've successfully invited ${pluralize(
          'users',
          successes.length,
          true
        )} to your organization.`}</Paragraph>
      )}

      {(isPartialSuccess || isTotalSuccess) && (
        <Note className={noteStyle} testId="new-user.done.success" noteType="positive">
          {`${pluralize('users', successes.length, true)} ${pluralize(
            'have',
            successes.length
          )} been invited to your organization.`}

          <TextLink href={invitationsUrl} linkType="positive" className={linkStyle}>
            View all users
          </TextLink>

          <TextLink onClick={onRestart} linkType="positive" className={linkStyle}>
            Invite more people
          </TextLink>
        </Note>
      )}

      {isPartialSuccess && (
        <Subheading>{`${pluralize(
          'users',
          failures.length,
          true
        )} couldn’t be invited`}</Subheading>
      )}

      {(isPartialSuccess || isTotalFailure) && <NewUserFailures failures={failures} />}
    </Typography>
  );
}

NewUserSuccess.propTypes = {
  onRestart: PropTypes.func.isRequired,
  failures: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string.isRequired,
      error: PropTypes.instanceOf(Error)
    })
  ).isRequired,
  successes: PropTypes.arrayOf(PropTypes.string).isRequired,
  orgId: PropTypes.string.isRequired
};

function NewUserFailures({ failures = [] }) {
  const { rateLimited, alreadyIn } = failures.reduce(
    (result, failure) => {
      const { error, email } = failure;
      const { rateLimited, alreadyIn } = result;

      if (isForbidden(error)) {
        rateLimited.push(email);
      } else {
        alreadyIn.push(email);
      }
      return result;
    },
    { rateLimited: [], alreadyIn: [] }
  );

  return (
    <>
      {alreadyIn.length > 0 && (
        <div data-test-id="new-user.done.failed.alreadyIn">
          <Paragraph>{`Existing users or users that are already invited`}</Paragraph>
          <Textarea disabled className={failedEmailsStyle} value={alreadyIn.join('\n')} />
        </div>
      )}
      {rateLimited.length > 0 && (
        <div data-test-id="new-user.done.failed.rateLimited">
          <Paragraph>{`Users that weren’t invited because you reached the limit`}</Paragraph>
          <Textarea disabled className={failedEmailsStyle} value={rateLimited.join('\n')} />
          <Note
            className={noteStyle}
            noteType="negative"
            title={`You’ve reached your limit of users in this organization.`}>
            {``}
          </Note>
        </div>
      )}
    </>
  );
}
NewUserFailures.propTypes = {
  failures: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string.isRequired,
      error: PropTypes.instanceOf(Error)
    })
  ).isRequired
};
