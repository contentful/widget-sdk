import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, Note } from '@contentful/forma-36-react-components';

function ContentTypePreview(props) {
  const { preview, isNew, isLoading, isDirty } = props;
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
              {isDirty && (
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
  preview: PropTypes.object,
  isNew: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export default ContentTypePreview;
