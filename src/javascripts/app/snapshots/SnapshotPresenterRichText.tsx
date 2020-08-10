import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { getModule } from 'core/NgRegistry';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/NewWidgetApi';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import { createTagsRepo } from 'features/content-tags';

const SnapshotPresenterRichText = ({
  className,
  value,
  entity,
  editorData,
  field,
  locale,
  widget,
}) => {
  const sdk: FieldExtensionSDK = useMemo(() => {
    const spaceContext = getModule('spaceContext');

    return createReadonlyFieldWidgetSDK({
      cma: spaceContext.cma,
      editorInterface: editorData.editorInterface,
      endpoint: spaceContext.endpoint,
      entry: entity,
      environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
      publicFieldId: field.apiName ?? field.id,
      fieldValue: value,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
      internalContentType: editorData.contentType.data,
      publicLocaleCode: locale.code,
      spaceId: spaceContext.getId(),
      spaceMember: spaceContext.space.data.spaceMember,
      tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
      usersRepo: spaceContext.users,
      widgetId: widget.id,
      widgetNamespace: widget.namespace,
    });
  }, [field, locale, entity, editorData, value, widget]);

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
    contentType: PropTypes.shape({ data: PropTypes.object }),
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
    // eslint-disable-next-line @typescript-eslint/camelcase
    internal_code: PropTypes.string,
  }),
  widget: PropTypes.shape({
    id: PropTypes.string,
    namespace: PropTypes.string,
  }),
};

SnapshotPresenterRichText.defaultProps = {
  className: '',
};

export default SnapshotPresenterRichText;
