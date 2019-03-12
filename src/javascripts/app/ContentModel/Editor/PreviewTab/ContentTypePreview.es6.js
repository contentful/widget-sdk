/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Spinner, Note } from '@contentful/forma-36-react-components';

function ContentTypePreview(props) {
  const { loadPreview, publishedVersion } = props;
  const [isLoading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const isNew = !publishedVersion;

  useEffect(() => {
    loadPreview().then(preview => {
      setPreview(preview);
      setLoading(false);
    });
  }, [publishedVersion, loadPreview]);

  return (
    <div className="ct-editor-json">
      {isNew && (
        <div>
          <Note extraClassNames="f36-margin-bottom--l">
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
            <div style={{ height: 200 }} className="loader__container">
              <Spinner size="large" style={{ display: 'block' }} />
              <div className="f36-margin-left--m">Loading JSON preview</div>
            </div>
          )}

          {!isLoading && (
            <div>
              {props.isDirty && (
                <Note extraClassNames="f36-margin-bottom--l">
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
  publishedVersion: PropTypes.number
};

export default ContentTypePreview;
