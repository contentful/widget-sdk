import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import { createNewReadOnlyWidgetApi } from 'app/widgets/NewWidgetApi/createNewWidgetApi';
import { getModule } from 'core/NgRegistry';

const SnapshotPresenterRichText = ({ className, value, contentType, entity, field, locale }) => {
  const [sdk, setSdk] = useState(null);
  useEffect(() => {
    const spaceContext = getModule('spaceContext');
    const readOnlyWidgetApi = createNewReadOnlyWidgetApi({
      field,
      locale,
      fieldValue: value,
      contentType,
      entry: entity,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
      cma: spaceContext.cma,
    });
    setSdk(readOnlyWidgetApi);
  }, [contentType, entity, field, locale, value]);

  return (
    <div className={className} data-test-id="snapshot-presenter-richtext">
      {sdk && <ReadOnlyRichTextEditor value={value} sdk={sdk} />}
    </div>
  );
};

SnapshotPresenterRichText.propTypes = {
  className: PropTypes.string,
  value: PropTypes.object.isRequired,
  contentType: PropTypes.shape({ data: PropTypes.object }),
  entity: PropTypes.object.isRequired,
  field: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string,
      linkType: PropTypes.string,
    }),
    PropTypes.shape({
      type: PropTypes.string,
      items: PropTypes.shape({
        type: PropTypes.string,
        linkType: PropTypes.string,
      }),
    }),
  ]),
  locale: PropTypes.shape({
    code: PropTypes.string,
    internal_code: PropTypes.string,
  }),
};

SnapshotPresenterRichText.defaultProps = {
  className: '',
};

export default SnapshotPresenterRichText;
