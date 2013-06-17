'use strict';

angular.module('contentful').factory('tutorial', function ($compile, notification) {
  var guiders = window.guiders;

  function Tutorial() {}

  Tutorial.prototype = {
    start : function () {
      if (!this._initialized) this.initialize();
      guiders.hideAll();
      guiders.show('overview');
    },
    initialize: function () {
      var spaceScope = angular.element('space-view').scope();
      var tutorialScope = spaceScope.$new();
      tutorialScope.goto = function (id) {
        guiders.hideAll();
        guiders.show(id);
      };

      tutorialScope.abort = function () {
        guiders.hideAll();
      };

      function contentTypeValid(contentType) {
        var hasText     = _.any(contentType.data.fields, {type: 'Text'});
        //var hasObject   = _.any(contentType.data.fields, {type: 'Object'});
        //var hasDateTime = _.any(contentType.data.fields, {type: 'Date'});
        return hasText //&& hasObject && hasDateTime;
      }

      guiders.createGuider({
        id: 'overview',
        title: 'Welcome to contentful',
        //buttons: [{name: 'Next'}],
        button: [],
        description: JST['tutorial_overview'](),
        next: 'contentTypeCreate1',
        overlay: true,
        width: '70%',
        onShow: function () {
          _.delay(function () {
            tutorialScope.contentTypeDone = _.any(tutorialScope.spaceContext.publishedContentTypes, contentTypeValid);
            if (!tutorialScope.$$phase) tutorialScope.$apply();
          }, 10);
        }
      });
      $compile(angular.element('.guider#overview'))(tutorialScope);

      //guiders.createGuider({
        //id: 'contentTypeSeed',
        //title: 'Creating example data',
        //description: 'Blablabla',
        //next: 'contentTypeCreate1',
        //onShow: function () {
          //var contentType = _.find(tutorialScope.spaceContext.publishedContentTypes, contentTypeValid);
          //if (contentType) {
            //contentType.unpublish(function (err) {
              //tutorialScope.$apply(function (scope) {
                //scope.spaceContext.tabList.closeAll();
                //if (err) {
                  //notification.error('Could not unpublish Content Type');
                //} else {
                  //contentType.delete(function (err) {
                    //tutorialScope.$apply(function (scope) {
                      //if (err) {
                        //notification.error('Could not delete Content Type');
                      //} else {
                        //console.log('deleting');
                        //scope.spaceContext.removeContentType(contentType);
                        //scope.$emit('entityDeleted', contentType);
                        //_.defer(function () { guiders.next(); });
                      //}
                    //});
                  //});
                //}
              //});
            //});
          //} else {
            //setTimeout(function () {
              //guiders.next();
            //}, 500);
          //}
        //}
      //});

      guiders.createGuider({
        id: 'contentTypeCreate1',
        title: 'Click here and add a new Content Type',
        attachTo: '.tab-list .add.button',
        position: '2',
        description: 'Content Types will be the managing pieces of your content.',
        next: 'contentTypeCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      guiders.createGuider({
        id: 'contentTypeCreate2',
        title: 'Click here and add a new Content Type',
        attachTo: '.tab-list .add-btn .dropdown-menu ul:first li:last',
        position: '3',
        description: 'Content Types will be the managing pieces of your content.',
        next: 'contentTypeName',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            var d = spaceScope.$on('otBecameEditable', function () {
              guiders.next();
              d();
            });

          });
        }
      });

      guiders.createGuider({
        id: 'contentTypeName',
        title: 'Now add a name and a description',
        attachTo: '.tab-content:visible [ng-model="contentType.data.name"]',
        position: '3',
        description: 'This is the name of this type of entry. For example you can call it BlogPosts.',
        next: 'contentTypeFields',
        onShow: function () {
          $(this.attachTo).one('blur', function () {
            guiders.next();
          });
        }
      });

      guiders.createGuider({
        id: 'contentTypeFields',
        title: 'Now add some fields with name',
        attachTo: '.tab-content:visible .new-field-form .button.new',
        offset: {top: -15, left: 0},
        position: '5',
        description: 'Here you add the "placeholders" for your content. Add one text, one Object and one Date/Time.',
        next: 'contentTypeActivate',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d1 = scope.$watch('contentType.data.fields.length', function () {
            _.defer(guiders.reposition);
          });

          var d2 = scope.$watch(function (scope) {
            return contentTypeValid(scope.contentType);
          }, function (done) {
            if (done) {
              d1();
              d2();
              guiders.next();
            }
          });
        }
      });
      guiders.createGuider({
        id: 'contentTypeActivate',
        title: 'Now activate your Content Type',
        attachTo: '.content-type-editor:visible button.publish',
        offset: {top: 15, left: 0},
        position: '1',
        description: 'Activation makes the content type available for use.',
        next: 'contentTypeDone',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d1 = scope.$on('newContentTypePublished', function (event, contentType) {
            if (contentType.getId() == scope.contentType.getId()) {
              d1();
              guiders.next();
            }
          });
        }
      });
      guiders.createGuider({
        id: 'contentTypeDone',
        title: 'Done!',
        description: 'You just created your first Content Type',
        next: 'overview',
        overlay: true,
        buttons: [{name: 'Next'}]
      });
    }

  };

  return new Tutorial();
});
//.run(function (tutorial) {
  //_.delay(tutorial.start, 10);
  //window.guiders.show('overview');
//});
