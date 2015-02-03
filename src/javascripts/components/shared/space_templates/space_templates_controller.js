'use strict';

angular.module('contentful').controller('SpaceTemplatesController', ['$injector', '$scope', function SpaceController($injector, $scope) {

  var stringUtils          = $injector.get('stringUtils');
  var analytics            = $injector.get('analytics');
  var spaceTemplateCreator = $injector.get('spaceTemplateCreator');
  var spaceTemplateLoader  = $injector.get('spaceTemplateLoader');

  var templateListLoadingStatus = 'loading';
  var templateLoadingStatus = null;
  var contentTypeToDisplayFieldMap;
  var retryAttempts = 0;

  spaceTemplateLoader.getTemplatesList().then(function (templates) {
    templateListLoadingStatus = 'finished';
    $scope.spaceTemplates = _.map(templates, 'fields');
  }).catch(function () {
    $scope.dialog.cancel();
  });

  $scope.completedItems = {};
  $scope.isTemplateListLoading = isTemplateListLoading;
  $scope.isTemplateListVisible = isTemplateListVisible;
  $scope.isTemplateQueueVisible = isTemplateQueueVisible;
  $scope.isTemplateFailed = isTemplateFailed;
  $scope.selectTemplate = selectTemplate;
  $scope.selectBlankTemplate = selectBlankTemplate;
  $scope.dismissDialog = dismissDialog;
  $scope.loadSelectedTemplate = loadSelectedTemplate;
  $scope.queueItemClass = queueItemClass;
  $scope.entityStatusString = entityStatusString;

  function isTemplateListLoading() {
    return templateListLoadingStatus === 'loading';
  }

  function isTemplateListVisible() {
    return templateListLoadingStatus === 'finished' && !templateLoadingStatus;
  }

  function isTemplateQueueVisible() {
    return templateListLoadingStatus === 'finished' && (templateLoadingStatus === 'loading' || templateLoadingStatus === 'failed');
  }

  function isTemplateFailed() {
    return templateLoadingStatus === 'failed';
  }

  function selectBlankTemplate() {
    sendTemplateSelectedAnalyticsEvent('Blank');
    $scope.dialog.cancel();
  }

  function selectTemplate(template) {
    $scope.selectedTemplate = template;
  }

  function loadSelectedTemplate() {
    templateLoadingStatus = 'loading';
    sendTemplateSelectedAnalyticsEvent($scope.selectedTemplate.name);
    $scope.templateCreator = spaceTemplateCreator.getCreator($scope.spaceContext, {
      onItemSuccess: itemDone,
      onItemError: itemError
    });
    spaceTemplateLoader.getTemplate($scope.selectedTemplate).then(createTemplate);
  }

  function sendTemplateSelectedAnalyticsEvent(templateName) {
    analytics.track('Selected Space Template', {
      template: templateName
    });
    analytics.trackTotango('Selected Space Template: '+ templateName);
  }

  function createTemplate(template) {
    contentTypeToDisplayFieldMap = contentTypeToDisplayFieldMap || mapDisplayFields(template.contentTypes);
    $scope.templateCreator.create(template)
    .then(function () {
      templateLoadingStatus = 'finished';
      dismissDialog();
    })
    .catch(function (data) {
      if(retryAttempts === 0){
        retryAttempts++;
        createTemplate(data.template);
      } else {
        templateLoadingStatus = 'failed';
        _.each(data.errors, function (error) {
          analytics.track('Created Errored Space Template', {
            entityType: error.entityType,
            entityId: error.entityId,
            action: error.action
          });
        });
      }
    });
  }

  function dismissDialog() {
    $scope.dialog.confirm($scope.selectedTemplate);
  }

  function itemDone(id, data) {
    $scope.completedItems[id] = {
      status: 'success',
      templateItem: data.item,
      actionData: data.actionData
    };
  }

  function itemError(id, data) {
    $scope.completedItems[id] = {
      status: 'error',
      templateItem: data.item,
      actionData: data.actionData
    };
  }

  function mapDisplayFields(contentTypes) {
    return _.reduce(contentTypes, function (displayFieldsMap, contentType) {
      displayFieldsMap[contentType.sys.id] = contentType.displayField;
      return displayFieldsMap;
    }, {});
  }

  function queueItemClass(status) {
    return 'space-template--item-'+status;
  }

  function entityStatusString(item) {
    return getActionLabel(item.actionData.action) +' '+
      stringUtils.getEntityLabel(item.actionData.entity)+
      getEntityDisplayName(item.templateItem, item.actionData.entity);
  }

  function getEntityDisplayName(item, entityType) {
    if(entityType == 'Asset')
      return ' '+getFirstLocaleField(item.fields.title);
    if(entityType == 'Entry'){
      var displayFieldId = contentTypeToDisplayFieldMap[item.sys.contentType.sys.id];
      return ' '+getFirstLocaleField(item.fields[displayFieldId]);
    }
    if(item.name)
      return ' '+item.name;
    return '';
  }

  function getFirstLocaleField(field) {
    var localeField = _.values(field);
    return localeField.length > 0 ? localeField[0] : null;
  }

  var actionsToLabels = {
    create: 'Creating',
    publish: 'Publishing',
    process: 'Processing'
  };
  function getActionLabel(id) {
    return actionsToLabels[id];
  }

}]);
