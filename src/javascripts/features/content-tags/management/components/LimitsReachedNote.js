import { Note } from '@contentful/forma-36-react-components';
import { TagsFeedbackLink } from 'features/content-tags/core/components/TagsFeedbackLink';
import React from 'react';
import PropTypes from 'prop-types';

const LimitsReachedNote = ({ className }) => {
  return (
    <Note noteType={'warning'} className={className}>
      You’ve reached the limit for the number of tags in this space.{' '}
      <TagsFeedbackLink label={'Get in touch with us'} /> if you need more.
    </Note>
  );
};

LimitsReachedNote.propTypes = {
  className: PropTypes.string,
};

export { LimitsReachedNote };
