import React from 'react';
import { Note } from '@contentful/forma-36-react-components';
import AppsFeedback from 'app/settings/apps/AppsFeedback.es6';

export default () => (
  <Note extraClassNames="teams-experimental-note">
    <span className="teams-experimental-note__message">
      This is an experimental alpha feature. We are heavily iterating on it based on your feedback.
    </span>
    <AppsFeedback target="bizVel" about="Teams" />
  </Note>
);
