import React, { useState } from 'react';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const sessionStore = getBrowserStorage('session');
const FLAG_KEY = 'extensions-development-mode';

export default function ExtensionDevelopmentMode() {
  const [showMixedContentInfo, setShowMixedContentInfo] = useState(
    sessionStore.get(FLAG_KEY) !== true
  );

  if (!showMixedContentInfo) {
    return null;
  }

  return (
    <Note noteType="primary" title="Extension served from localhost">
      To view your extension in development mode, you need to disable mixed content protection.{' '}
      <TextLink
        onClick={() => {
          setShowMixedContentInfo(false);
          sessionStore.set(FLAG_KEY, true);
        }}>
        Ok, hide it.
      </TextLink>
    </Note>
  );
}
