'use strict';

angular.module('contentful').controller('SpaceTemplatesController', ['$injector', '$scope', function SpaceController($injector, $scope) {

  var stringUtils          = $injector.get('stringUtils');
  var spaceTemplateCreator = $injector.get('spaceTemplateCreator');
  var spaceTemplateLoader  = $injector.get('spaceTemplateLoader');

  var templateListLoadingStatus = 'loading';
  var templateLoadingStatus = null;


  spaceTemplateLoader.getTemplatesList().then(function (templates) {
    templateListLoadingStatus = 'finished';
    $scope.spaceTemplates = _.map(templates, 'fields');
  }).catch(function () {
    $scope.dialog.cancel();
  });

  $scope.completedQueue = [];
  $scope.isTemplateListLoading = isTemplateListLoading;
  $scope.isTemplateListVisible = isTemplateListVisible;
  $scope.isTemplateQueueVisible = isTemplateQueueVisible;
  $scope.isTemplateFailed = isTemplateFailed;
  $scope.selectTemplate = selectTemplate;
  $scope.newContentType = newContentType;
  $scope.loadSelectedTemplate = loadSelectedTemplate;
  $scope.retryFailedTemplate = retryFailedTemplate;
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

  function selectTemplate(template) {
    $scope.selectedTemplate = template;
  }

  function newContentType() {
    $scope.entityCreationController.newContentType('frame');
    $scope.dialog.confirm();
  }

  function loadSelectedTemplate() {
    templateLoadingStatus = 'loading';
    $scope.templateCreator = spaceTemplateCreator.getCreator($scope.spaceContext, {
      onItemSuccess: itemDone,
      onItemError: itemError
    });
    spaceTemplateLoader.getTemplate($scope.selectedTemplate).then(createTemplate);
  }

  function retryFailedTemplate() {
    templateLoadingStatus = 'loading';
    createTemplate($scope.attemptedTemplate);
  }

  function queueItemClass(status) {
    return 'space-template--item-'+status;
  }

  function entityStatusString(item) {
    var str = getActionLabel(item.metadata.action) +' '+ stringUtils.getEntityLabel(item.metadata.entity);
    if(item.template.name) str += ' '+item.template.name;
    return str;
  }

  function createTemplate(template) {
    $scope.templateCreator.create(template)
    .then(function () {
      templateLoadingStatus = 'finished';
      $scope.dialog.confirm($scope.selectedTemplate);
    }, function (data) {
      templateLoadingStatus = 'failed';
      $scope.attemptedTemplate = data.template;
    });
  }

  function itemDone(item, metadata) {
    $scope.completedQueue.push({
      status: 'success',
      template: item,
      metadata: metadata
    });
  }

  function itemError(item, metadata) {
    $scope.completedQueue.push({
      status: 'error',
      template: item,
      metadata: metadata
    });
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
