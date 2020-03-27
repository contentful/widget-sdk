/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Spinner, Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  newPreviewNote: css({
    marginBottom: tokens.spacingL,
  }),
  loadingText: css({
    marginLeft: tokens.spacingM,
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

function ContentTypePreview(props) {
  const { loadPreview, publishedVersion } = props;
  const [isLoading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadPreview(!publishedVersion).then((preview) => {
      setPreview(preview);
      setLoading(false);
    });
  }, [publishedVersion, loadPreview]);

  const isNew = !publishedVersion;

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
          {isLoading && (
            <div className={styles.loaderContainer}>
              <Spinner size="large" className={styles.spinner} />
              <div className={styles.loadingText}>Loading JSON preview</div>
            </div>
          )}

          {!isLoading && (
            <div>
              {props.isDirty && (
                <Note className={styles.unsavedChanges}>
                  You have unsaved changes. Save content type to get a preview.
                </Note>
              )}
              <code className="ct-editor-json__code">
                <pre>{JSON.stringify(preview, null, 2)}</pre>
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ContentTypePreview.propTypes = {
  isDirty: PropTypes.bool.isRequired,
  loadPreview: PropTypes.func.isRequired,
  publishedVersion: PropTypes.number,
};

export default ContentTypePreview;
