import * as React from 'react';
import { ValidationErrors } from '@contentful/field-editor-validation-errors';
import { WidgetRenderer } from 'app/entity_editor/WidgetRenderer';
import Collaborators from 'app/entity_editor/Collaborators';
import { isRtlLocale } from 'utils/locales';
import createNewWidgetApi from 'app/widgets/NewWidgetApi/createNewWidgetApi';
import { getModule } from 'core/NgRegistry';
import { getEntityLink } from 'app/common/EntityStateLink';

export function EntityFieldControl(props: { scope: any; hasInitialFocus: boolean }) {
  const widgetApi = React.useMemo(() => {
    const spaceContext = getModule('spaceContext');
    return createNewWidgetApi({
      $scope: props.scope,
      spaceContext,
    });
  }, [props.scope]);

  return (
    <>
      <div className="entity-editor__control-group">
        <WidgetRenderer
          scope={props.scope}
          widgetApi={widgetApi}
          hasInitialFocus={props.hasInitialFocus}
          isRtl={isRtlLocale(props.scope.locale.code)}
        />
        <Collaborators
          users={props.scope.fieldLocale.collaborators}
          className="entity-editor__field-collaborators"
        />
      </div>
      <ValidationErrors
        field={widgetApi.field}
        locales={widgetApi.locales}
        space={widgetApi.space}
        getEntryURL={(entry) => {
          return getEntityLink({ id: entry.sys.id, type: 'Entry' }).href;
        }}
      />
    </>
  );
}
