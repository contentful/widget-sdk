'use strict';

angular.module('contentful').controller('SpaceTemplatesController', ['$injector', '$scope', function SpaceController($injector, $scope) {

  var stringUtils          = $injector.get('stringUtils');
  var analytics            = $injector.get('analytics');
  var spaceTemplateCreator = $injector.get('spaceTemplateCreator');
  var spaceTemplateLoader  = $injector.get('spaceTemplateLoader');

  var dialogView = 'loading';
  var contentTypeToDisplayFieldMap;
  var retryAttempts = 0;

  spaceTemplateLoader.getTemplatesList().then(function (templates) {
    dialogView = 'spaceTemplateList';
    $scope.spaceTemplates = _.map(templates, 'fields');
  }).catch(function () {
    $scope.dialog.cancel();
  });

  $scope.$on('spaceCreationRequested', showLoadingState);
  $scope.$on('spaceCreationFailed', showSpaceCreation);
  $scope.$on('spaceCreated', waitForSpace);

  $scope.completedItems = {};
  $scope.dialogViewIs = dialogViewIs;
  $scope.showSpaceCreation = showSpaceCreation;
  $scope.selectTemplate = selectTemplate;
  $scope.selectBlankTemplate = selectBlankTemplate;
  $scope.dismissDialog = dismissDialog;
  $scope.loadSelectedTemplate = loadSelectedTemplate;
  $scope.queueItemClass = queueItemClass;
  $scope.entityStatusString = entityStatusString;

  function dialogViewIs(expectedView) {
    return expectedView === dialogView;
  }

  function selectBlankTemplate() {
    selectTemplate({name: 'Blank'});
    showSpaceCreation();
  }

  function selectTemplate(template) {
    $scope.selectedTemplate = template;
  }

  function showSpaceCreation() {
    dialogView = 'spaceCreation';
  }

  function showLoadingState() {
    dialogView = 'loading';
  }

  function waitForSpace(ev, space) {
    var existingSpace = dotty.get($scope, 'spaceContext.space');
    if(existingSpace && existingSpace.getId() === space.getId()){
      loadSelectedTemplate();
    } else {
      $scope.$watch('::spaceContext.space', function (updatedSpace) {
        if(updatedSpace && updatedSpace.getId() === space.getId()){
          loadSelectedTemplate();
        }
      });
    }
  }

  function loadSelectedTemplate() {
    showLoadingState();
    sendTemplateSelectedAnalyticsEvent($scope.selectedTemplate.name);
    if($scope.selectedTemplate === 'Blank'){
      return dismissDialog();
    }
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
    dialogView = 'spaceTemplateQueue';
    contentTypeToDisplayFieldMap = contentTypeToDisplayFieldMap || mapDisplayFields(template.contentTypes);
    $scope.templateCreator.create(template)
    .then(function () {
      dismissDialog();
    })
    .catch(function (data) {
      if(retryAttempts === 0){
        retryAttempts++;
        createTemplate(data.template);
      } else {
        $scope.templateCreationFailed = true;
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
