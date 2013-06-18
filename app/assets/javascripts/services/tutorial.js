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

      function contentTypeShape(contentType) {
        return {
          numText: _.countBy(contentType.data.fields, {type: 'Text'})['true'],
          hasDate: _.any(contentType.data.fields, {type: 'Date'})
        };
      }
      function contentTypeValid(contentType) {
        var shape = contentTypeShape(contentType);
        return shape.numText == 2 && shape.hasDate;
      }

      guiders.createGuider({
        id: 'overview',
        title: 'Welcome to Contentful',
        //buttons: [{name: 'Next'}],
        button: [],
        description: JST['tutorial_overview'](),
        next: 'contentTypeCreate1',
        overlay: true,
        width: '70%'
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

////////////////////////////////////////////////////////////////////////////////
//   Content Types   ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

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
        description: 'This is the name of this type of entry. Call it "Blog Post" for now.',
        next: 'contentTypeFields',
        onShow: function () {
          $(this.attachTo).one('blur', function () {
            guiders.next();
          });
        }
      });

      var fieldScope = tutorialScope.$new();
      guiders.createGuider({
        id: 'contentTypeFields',
        title: 'Now add some fields with name',
        attachTo: '.tab-content:visible .new-field-form .button.new',
        offset: {top: -15, left: 0},
        position: '5',
        description: JST['tutorial_content_fields'](),
        next: 'contentTypeActivate',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d1 = scope.$watch('contentType.data.fields.length', function () {
            _.defer(guiders.reposition);
          });

          var d2 = scope.$watch(function (scope) {
            fieldScope.contentTypeShape = contentTypeShape(scope.contentType);
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
      $compile(angular.element('.guider#contentTypeFields'))(fieldScope);

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
              tutorialScope.contentTypeDone = true;
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
 
////////////////////////////////////////////////////////////////////////////////
//   Entries   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      guiders.createGuider({
        id: 'entrySeed',
        title: 'Preparing example data',
        description: 'Please hang on',
        next: 'entryCreate1',
        onShow: function () {
          var contentType = _.find(tutorialScope.spaceContext.publishedContentTypes, contentTypeValid);
          if (!contentType) {
            tutorialScope.spaceContext.space.createContentType({
             'fields': [
              {
               'id': 'title',
               'name': 'Title',
               'type': 'Text',
               'required': false,
               'localized': false
              },
              {
               'id': 'content',
               'name': 'Content',
               'type': 'Text',
               'required': false,
               'localized': false
              },
              {
               'id': 'timestamp',
               'name': 'Timestamp',
               'type': 'Date',
               'required': false,
               'localized': false
              }
             ],
             'name': 'Blog Post',
             'sys': {
              'id': 'blogpost'
              },
             'description': 'asdsa'
            }, function (err, contentType) {
              if (err) {
                notification.error('Could not create content type');
              } else {
                contentType.publish(contentType.version, function (err, contentType) {
                  tutorialScope.$apply(function (scope) {
                    scope.spaceContext.registerPublishedContentType(contentType);
                    scope.spaceContext.refreshContentTypes();
                  });
                  guiders.next();
                });
              }
            });
          } else {
            setTimeout(function () {
              guiders.next();
            }, 500);
          }
        }
      });

      guiders.createGuider({
        id: 'entryCreate1',
        title: 'Click here and add a new Blog Post',
        attachTo: '.tab-list .add.button',
        position: '2',
        description: '"Blog Post" is the Content Type you just created (if you didn\'t name it differently).',
        next: 'entryCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      guiders.createGuider({
        id: 'entryCreate2',
        title: 'Click here and add a new Blog Post',
        attachTo: '.tab-list .add-btn .dropdown-menu ul.content-types',
        position: '2',
        description: '"Blog Post" is the Content Type you just created (if you didn\'t name it differently).',
        next: 'entryContent',
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
        id: 'entryContent',
        title: 'Now fill all the fields you have',
        attachTo: '.tab-content:visible textarea:first',
        position: '2',
        description: 'Here you can add your content, title, the timestamp and any other fields you have.',
        buttons: [{
          name: 'Close',
          onclick: function () {
            $('.guider#entryContent').fadeOut('fast');
          }
        }],
        onShow: function () {
          _.defer(guiders.show, 'entryPublish');
        }
      });

      guiders.createGuider({
        id: 'entryPublish',
        title: 'When you\'re done, publish your Blog Post',
        attachTo: '.entry-editor:visible button.publish',
        offset: {top: 15, left: 0},
        position: '1',
        description: 'Publishing makes an entry visible to public users of your content feed.',
        next: 'entryDone',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d1 = scope.$watch('entry.isPublished()', function (published) {
            if (published) {
              d1();
              tutorialScope.entryDone = true;
              guiders.next();
            }
          });
        }
      });

      guiders.createGuider({
        id: 'entryDone',
        title: 'Done!',
        description: 'You just published your first entry. In the next tutorial you will learn how to set up access to the public content feed for your Space.',
        next: 'overview',
        overlay: true,
        buttons: [{name: 'Next'}]
      });

////////////////////////////////////////////////////////////////////////////////
//   API Key   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      guiders.createGuider({
        id: 'apiKeySeed',
        title: 'Preparing example data',
        description: 'Please hang on',
        next: 'apiKeyCreate1',
        onShow: function () {
          setTimeout(function () {
            guiders.next();
          }, 500);
        }
      });

      guiders.createGuider({
        id: 'apiKeyCreate1',
        title: 'Click here and add a new API Key',
        attachTo: '.tab-list .add.button',
        position: '2',
        description: 'To get data from the Content Delivery API, clients need to provide an access token.',
        next: 'apiKeyCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      guiders.createGuider({
        id: 'apiKeyCreate2',
        title: 'Click here and add a new API Key',
        attachTo: '.tab-list .add-btn .dropdown-menu ul:first',
        position: '2',
        description: 'To get data from the Content Delivery API, clients need to provide an access token.',
        next: 'apiKeyEdit',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      guiders.createGuider({
        id: 'apiKeyEdit',
        title: 'Fill in Name and description',
        attachTo: '.api-key-editor:visible input:first',
        position: '2',
        description: 'The simply help to identify the purpose of the API Key if you create multiple keys.',
        next: 'apiKeySave',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d1 = scope.$watch(function (scope) {
            return scope.apiKey &&
              scope.apiKey.data &&
              scope.apiKey.data.name && scope.apiKey.data.description;
          }, function (done) {
            if (done) {
              d1();
              guiders.next();
            }
          });
        }
      });

      guiders.createGuider({
        id: 'apiKeySave',
        title: 'When you\'re done, save your API Key',
        attachTo: '.api-key-editor:visible button.save',
        offset: {top: 15, left: 0},
        position: '1',
        description: 'Afterwards the key can be used by clients.',
        next: 'apiKeyDone',
        onShow: function () {
          var scope = $(this.attachTo).scope();
          var d = scope.$watch('apiKey.data.accessToken', function (token) {
            if (token) {
              d();
              tutorialScope.apiKeyDone = true;
              guiders.next();
            }
          });
        }
      });

      guiders.createGuider({
        id: 'apiKeyDone',
        title: 'Done!',
        attachTo: '.api-key-editor:visible .curl-example',
        position: 7,
        description: 'Try accessing your content using this this API Key via CURL on the command line or by clicking the link.',
        next: 'overview',
        buttons: [{name: 'Next'}]
      });

    }

  };

  return new Tutorial();
});
