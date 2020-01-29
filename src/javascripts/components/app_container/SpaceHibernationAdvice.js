import React from 'react';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';

export default function SpaceHibernationAdvice() {
  return (
    <div className="advice advice-content-fallback">
      <div className="advice__frame">
        <i className="fa fa-cloud-upload advice__icon advice__icon--giant"></i>
        <Typography>
          <Heading>Hold on! We’re bringing your space back</Heading>
          <Paragraph>
            You haven’t been here for a while, so your space slipped into hibernation.
          </Paragraph>
          <Paragraph>
            Don’t worry, all your content is safe and shall be available for use in a few moments.
          </Paragraph>
        </Typography>
      </div>
    </div>
  );
}
