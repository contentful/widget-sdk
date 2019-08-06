import React, { useState } from 'react';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { getStore } from 'TheStore/index.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const sessionStore = getStore('session');
const FLAG_KEY = 'extensions-development-mode';

const styles = {
  note: css({
    marginBottom: tokens.spacingS,
    position: 'relative'
  })
};

export default function ExtensionDevelopmentMode(props) {
  const [visibility, setVisibility] = useState(sessionStore.get(FLAG_KEY) !== true);

  if (!visibility) {
    return props.children;
  }

  return (
    <>
      <Note noteType="primary" className={styles.note}>
        To view your extension in development mode, you need to disable mixed content protection.{' '}
        <div>
          <TextLink
            onClick={() => {
              setVisibility(false);
              sessionStore.set(FLAG_KEY, true);
            }}>
            Ok, hide it.
          </TextLink>
        </div>
      </Note>
      {props.children}
    </>
  );
}

ExtensionDevelopmentMode.propTypes;
