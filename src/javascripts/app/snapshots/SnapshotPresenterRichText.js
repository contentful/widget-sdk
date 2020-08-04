import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/NewWidgetApi';
import { getModule } from 'core/NgRegistry';
import { createTagsRepo } from 'features/content-tags';

const SnapshotPresenterRichText = ({ className, value, entity, editorData, field, locale }) => {
  const [sdk, setSdk] = useState(null);
  useEffect(() => {
    const spaceContext = getModule('spaceContext');

    createReadonlyFieldWidgetSDK({
      field,
      locale,
      fieldValue: value,
      internalContentType: editorData.contentType.data,
      internalEditorInterface: editorData.editorInterface,
      entry: entity,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
      cma: spaceContext.cma,
      users: spaceContext.users,
      environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
      spaceId: spaceContext.getId(),
      tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
      spaceMember: spaceContext.space.data.spaceMember,
    }).then(setSdk);
  }, [editorData.contentType.data, editorData.editorInterface, entity, field, locale, value]);

  return (
    <div className={className} data-test-id="snapshot-presenter-richtext">
      {sdk && <ReadOnlyRichTextEditor value={value} sdk={sdk} />}
    </div>
  );
};

SnapshotPresenterRichText.propTypes = {
  className: PropTypes.string,
  value: PropTypes.object.isRequired,
  editorData: PropTypes.shape({
    contentType: { data: PropTypes.object },
    editorInterface: PropTypes.object,
  }),
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
