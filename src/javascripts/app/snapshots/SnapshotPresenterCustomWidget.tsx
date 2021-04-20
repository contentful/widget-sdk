import React, { useMemo } from 'react';

import { FieldExtensionSDK, KnownSDK } from '@contentful/app-sdk';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { Widget, WidgetLocation, WidgetRenderer } from '@contentful/widget-renderer';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { Locale } from 'app/entity_editor/EntityField/types';
import { Entity } from 'app/entity_editor/Document/types';
import { useSpaceEnvContext, useContentTypes } from 'core/services/SpaceEnvContext';
import { getEnvironmentAliasesIds, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { SpaceMember } from 'app/widgets/ExtensionSDKs/createUserApi';
import createUsersCache from 'data/userCache';
import { EditorInterfaceProps } from 'contentful-management/types';

interface SnapshotPresenterCustomWIdgetProps {
  locale: Locale;
  field: {
    apiName?: string;
    id: string;
  };
  entity: Entity;
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterfaceProps;
  };
  value: any;
  widget: Widget;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

const SnapshotPresenterCustomWidget = ({
  widget,
  value,
  editorData,
  entity,
  locale,
  field,
  parameters,
}: SnapshotPresenterCustomWIdgetProps) => {
  const {
    currentSpaceId,
    currentEnvironment,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpace,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useContentTypes();
  const { client: spaceApiClient } = useCurrentSpaceAPIClient();

  const sdk: FieldExtensionSDK = useMemo(() => {
    const spaceId = currentSpaceId as string;
    const environmentId = currentEnvironmentId as string;
    const aliasesId = getEnvironmentAliasesIds(currentEnvironment);
    const spaceMember = getSpaceMember(currentSpace) as SpaceMember;
    const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
    const usersEndpoint = createUsersCache(spaceEndpoint);
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
      currentEnvironmentAliasId,
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
    widget,
    value,
    parameters,
    spaceApiClient,
    currentSpaceId,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpaceContentTypes,
    currentEnvironment,
    currentSpace,
  ]);

  return (
    <div data-test-id="snapshot-presenter-extension">
      <WidgetRenderer
        location={WidgetLocation.ENTRY_FIELD}
        sdk={(sdk as unknown) as KnownSDK}
        widget={widget}
      />
    </div>
  );
};

SnapshotPresenterCustomWidget.defaultProps = {
  className: '',
};

export default SnapshotPresenterCustomWidget;
