import Templates from './templates';
import modalDialog from 'modalDialog';

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;

export default function createWebhookTemplateDialogOpener(config) {
  const { webhookRepo, contentTypes, defaultLocaleCode, domain, onCreate, hasAwsProxy } = config;

  const validTemplateIds = Templates.map(template => template.id);
  const templateContentTypes = prepareContentTypesForTemplates(
    contentTypes,
    defaultLocaleCode,
    domain
  );

  return function openTemplateDialog(templateId) {
    templateId = validTemplateIds.includes(templateId) ? templateId : Templates[0].id;

    modalDialog.open({
      ignoreEsc: false,
      backgroundClose: false,
      template:
        '<react-component class="modal-background" name="app/settings/webhooks/WebhookTemplateDialog.es6" props="props" />',
      controller: $scope => {
        $scope.props = {
          templateId,
          webhookRepo,
          templateContentTypes,
          hasAwsProxy,
          reposition: () => $scope.$emit('centerOn:reposition'),
          closeDialog: () => $scope.dialog.confirm(),
          onCreate
        };
      }
    });
  };
}

function prepareContentTypesForTemplates(contentTypes, defaultLocaleCode, domain) {
  return contentTypes
    .filter(ct => isNonEmptyString(ct.displayField))
    .map(ct => {
      const displayField = ct.fields.find(f => f.id === ct.displayField);
      return {
        id: ct.sys.id,
        name: ct.name,
        displayFieldId: displayField && displayField.apiName
      };
    })
    .filter(ct => isNonEmptyString(ct.displayFieldId))
    .map(ct => ({
      ...ct,
      titlePointer: `/payload/fields/${ct.displayFieldId}/${defaultLocaleCode}`,
      appUrlPointers: `https://app.${domain}/spaces/{ /payload/sys/space/sys/id }/entries/{ /payload/sys/id }`
    }));
}
