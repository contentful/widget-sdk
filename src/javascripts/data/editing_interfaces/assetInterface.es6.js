import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import legacyClient from 'legacy-client';

registerFactory('data/editingInterfaces/asset', () => {
  const assetFields = legacyClient.assetContentType.data.fields;

  const widgets = _.forEach(
    [
      {
        fieldId: 'title',
        widgetId: 'singleLine'
      },
      {
        fieldId: 'description',
        widgetId: 'singleLine'
      },
      {
        fieldId: 'file',
        widgetId: 'fileEditor'
      }
    ],
    assignField
  );

  return {
    widgets: widgets
  };

  function assignField(widget) {
    widget.field = _.find(assetFields, { id: widget.fieldId });
  }
});
