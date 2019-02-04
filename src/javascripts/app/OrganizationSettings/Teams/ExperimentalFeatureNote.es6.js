import React from 'react';
import { Note } from '@contentful/forma-36-react-components';
import FeedbackButton from 'app/common/FeedbackButton.es6';

const ExperimentalFeatureNote = () => (
  <Note extraClassNames="teams-experimental-note f36-margin-bottom--l f36-margin-left--xl">
    <span className="teams-experimental-note__message">
      This is a new feature. We&apos;re still working on it and we&apos;d love to hear your
      thoughts.
    </span>
    <FeedbackButton target="bizVel" about="Teams" />
  </Note>
);

export default ExperimentalFeatureNote;
