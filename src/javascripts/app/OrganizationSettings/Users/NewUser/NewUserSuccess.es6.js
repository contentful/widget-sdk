import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Note,
  TextLink,
  Typography,
  Heading,
  Paragraph,
  Textarea
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { css } from 'emotion';
import { href } from 'states/Navigator.es6';

const noteStyle = css({
  marginBottom: tokens.spacingM
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

  return (
    <Typography testId="new-user.success">
      <Heading>Done!</Heading>

      {!failures.length && (
        <Paragraph>{`You've successfully invited ${pluralize(
          'users',
          successes.length,
          true
        )} to your organization.`}</Paragraph>
      )}

      {successes.length > 0 && (
        <Note
          className={noteStyle}
          noteType="positive"
          title={`${pluralize('users', successes.length, true)} ${pluralize(
            'have',
            successes.length
          )} been invited to your organization.`}>
          <TextLink href={invitationsUrl} linkType="positive">
            View all invitations
          </TextLink>
        </Note>
      )}

      {failures.length > 0 && (
        <>
          <Note
            className={noteStyle}
            noteType="negative"
            title={`${pluralize('users', failures.length, true)} couldn't be invited.`}>
            They were either existing users or have already been invited.
          </Note>
          <Textarea
            className={noteStyle}
            disabled
            value={failures.map(item => item.email).join('\n')}></Textarea>
        </>
      )}

      <Paragraph>
        <TextLink onClick={onRestart}>Invite more people</TextLink>
      </Paragraph>
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
