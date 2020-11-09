import React, { useMemo } from 'react';

import { FieldExtensionSDK, KnownSDK } from 'contentful-ui-extensions-sdk';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import {
  EditorInterface,
  Widget,
  WidgetLocation,
  WidgetRenderer,
} from '@contentful/widget-renderer';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { Locale } from 'app/entity_editor/EntityField/types';
import { Entity } from 'app/entity_editor/Document/types';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getEnvironmentAliasesIds, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { SpaceMember } from 'app/widgets/ExtensionSDKs/createUserApi';
import { SpaceEndpoint } from 'data/CMA/types';
import createUsersCache from 'data/userCache';

interface SnapshotPresenterCustomWIdgetProps {
  locale: Locale;
  field: {
    apiName?: string;
    id: string;
  };
  entity: Entity;
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterface;
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
    const usersEndpoint = createUsersCache(spaceEndpoint);
    const tagsEndpoint = createTagsRepo(spaceEndpoint, environmentId);

    return createReadonlyFieldWidgetSDK({
      cma: spaceApiClient,
      editorInterface: editorData.editorInterface,
      endpoint: spaceEndpoint,
      entry: entity,
      environmentIds: [environmentId, ...aliasesId],
      publicFieldId: field.apiName ?? field.id,
      fieldValue: value,
      initialContentTypes: currentSpaceContentTypes,
      internalContentType: editorData.contentType.data,
      publicLocaleCode: locale.code,
      spaceId,
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
