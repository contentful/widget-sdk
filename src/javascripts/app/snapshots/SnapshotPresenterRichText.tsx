import React, { useMemo } from 'react';
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';

import { createReadonlyFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import { Entity } from 'app/entity_editor/Document/types';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { LegacyWidget } from 'widgets/WidgetCompat';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getEnvironmentAliasesIds, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createCache from 'data/userCache';
import { SpaceMember } from 'app/widgets/ExtensionSDKs/createUserApi';
import { SpaceEndpoint } from 'data/CMA/types';
import { EditorInterfaceProps } from 'contentful-management/types';

const SnapshotPresenterRichText = ({
  className,
  value,
  entity,
  editorData,
  field,
  locale,
  widget,
  parameters,
}: SnapshotPresenterRichTextProps) => {
  const {
    currentSpaceId,
    currentEnvironment,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const spaceApiClient = useCurrentSpaceAPIClient();

  const sdk: FieldExtensionSDK = useMemo(() => {
    const spaceId = currentSpaceId as string;
    const environmentId = currentEnvironmentId as string;
    const aliasesId = getEnvironmentAliasesIds(currentEnvironment);
    const spaceMember = getSpaceMember(currentSpace) as SpaceMember;
    const spaceEndpoint = (createSpaceEndpoint(spaceId, environmentId) as unknown) as SpaceEndpoint; // TODO: a better solution would be to transform EndpointFactory.js and Endpoint.js to TS
    const usersEndpoint = createCache(spaceEndpoint);
    const tagsEndpoint = createTagsRepo(spaceEndpoint, environmentId);

    return createReadonlyFieldWidgetSDK({
      cma: spaceApiClient,
      editorInterface: editorData.editorInterface,
      endpoint: spaceEndpoint,
      entry: entity,
      publicFieldId: field.apiName ?? field.id,
      fieldValue: value,
      initialContentTypes: currentSpaceContentTypes,
      internalContentType: editorData.contentType.data,
      publicLocaleCode: locale.code,
      spaceId,
      environmentId,
      currentEnvironmentAliasId: currentEnvironmentAliasId,
      allEnvironmentAliasIds: aliasesId,
      spaceMember,
      tagsRepo: tagsEndpoint,
      usersRepo: usersEndpoint,
      widgetId: widget.id,
      widgetNamespace: widget.namespace,
      parameters,
    });
  }, [
    field,
    locale,
    entity,
    editorData,
    value,
    widget,
    parameters,
    currentSpaceId,
    currentEnvironment,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceContentTypes,
    spaceApiClient,
  ]);

  return (
    <div className={className} data-test-id="snapshot-presenter-richtext">
      {sdk && <ReadOnlyRichTextEditor value={value} sdk={sdk} />}
    </div>
  );
};

interface SnapshotPresenterRichTextProps {
  className: string;
  value: any;
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterfaceProps;
  };
  entity: Entity;
  field: Field;
  locale: Locale;
  widget: LegacyWidget;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

SnapshotPresenterRichText.defaultProps = {
  className: '',
};

export default SnapshotPresenterRichText;
