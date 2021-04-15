/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import getContentTypePreview from './getContentTypePreview';

const styles = {
  newPreviewNote: css({
    marginBottom: tokens.spacingL,
  }),
  loadingText: css({
    marginRight: tokens.spacingM,
  }),
  unsavedChanges: css({
    marginBottom: tokens.spacingL,
  }),
  loaderContainer: css({
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.7)',
    padding: '10px',
    borderRadius: '5em',
  }),
  spinner: css({
    display: 'block',
  }),
};

function ContentTypePreview({ contentTypeData: internalContentType, isDirty }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const preview = getContentTypePreview(internalContentType);
    setPreview(preview);
  }, [internalContentType]);

  const isNew = !internalContentType?.sys?.publishedVersion;

  return (
    <div className="ct-editor-json">
      {isNew && (
        <div>
          <Note className={styles.newPreviewNote}>
            We will show you a preview once the content type has been saved. Save content type to
            get a preview.
          </Note>
          <code className="ct-editor-json__code--unsaved">
            <pre>{JSON.stringify(preview, null, 2)}</pre>
          </code>
        </div>
      )}
      {!isNew && (
        <div>
          <div>
            {isDirty && (
              <Note className={styles.unsavedChanges}>
                You have unsaved changes. Save content type to get a preview.
              </Note>
            )}
            <code className="ct-editor-json__code">
              <pre>{JSON.stringify(preview, null, 2)}</pre>
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

ContentTypePreview.propTypes = {
  contentTypeData: PropTypes.object.isRequired,
  isDirty: PropTypes.bool.isRequired,
};

export default ContentTypePreview;
