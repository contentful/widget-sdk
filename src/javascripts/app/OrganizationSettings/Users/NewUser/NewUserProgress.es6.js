import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import pluralize from 'pluralize';

export default function NewUserProgress({ progress, emailList }) {
  return (
    <Typography testId="new-user.progress">
      <Heading>
        Hold on, {pluralize('users', emailList.length, true)} {pluralize('are', emailList.length)}{' '}
        being invited.
      </Heading>
      <Paragraph>
        {progress.failures.length + progress.successes.length}/{emailList.length}
      </Paragraph>
      <Paragraph>This might take a while. Please keep this window open.</Paragraph>
    </Typography>
  );
}

NewUserProgress.propTypes = {
  emailList: PropTypes.arrayOf(PropTypes.string).isRequired,
  progress: PropTypes.shape({
    successes: PropTypes.arrayOf(PropTypes.string).isRequired,
    failures: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired
};
