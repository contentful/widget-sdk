'use strict';

angular.module('contentful').factory('tutorial', function ($compile, notification, tutorialExampledata, $q, $timeout, $rootScope) {
  var guiders = window.guiders;
  guiders._defaultSettings.buttons = null;

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

      tutorialScope.generateExampleData = function () {
        $('.guider#overview').fadeOut('fast');
        guiders.show('exampleDataSeed');
      };

      tutorialScope.goto = function (id) {
        var current = guiders._guiderById(guiders._currentGuiderID);
        var next    = guiders._guiderById(id);
        var omitHidingOverlay = current.overlay && next.overlay;
        guiders.hideAll(omitHidingOverlay);
        guiders.show(id);
      };

      tutorialScope.createExampleContentTypes = function () {
        tutorialScope.standby = true;
        tutorialExampledata.createContentTypes(tutorialScope.spaceContext).then(function () {
          tutorialScope.standby = false;
          guiders.next();
        }, function (err) {
          notification.error('Something went wrong:' + err);
          tutorialScope.standby = false;
        });
      };

      tutorialScope.next = function () {
        guiders.next();
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

      function createGuider(options) {
        options = _.clone(options);
        var template;
        if (options.template) {
          template = JST[options.template]();
          options.description = template;
        }

        var parentScope = options.scope || tutorialScope;
        var onShow = options.onShow;
        var onHide = options.onHide;
        options.onShow = function (guider) {
          $rootScope.$evalAsync(function () {
            guider.scope = parentScope.$new();
            if (guider.attachTo) guider.attachScope = $(guider.attachTo).scope().$new();
            if (onShow) onShow.call(guider, guider);
          });
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
        options.onHide = function (guider) {
          try {
            if (onHide) onHide.call(guider, guider);
            if (!$rootScope.$$phase) $rootScope.$apply();
          } finally {
            if (guider.attachScope) {
              $rootScope.$evalAsync(function () {
                guider.attachScope.$destroy();
                delete guider.attachScope;
              });
            }
            if (guider.scope) {
              $rootScope.$evalAsync(function () {
                guider.scope.$destroy();
                delete guider.scope;
              });
            }
          }
        };
        guiders.createGuider(options);
        $compile(angular.element('.guider#'+options.id))(parentScope);
      }

      var repositionLater = _.throttle(function () {
        guiders.reposition();
      }, 50, true);

      createGuider({
        id: 'overview',
        title: 'Take one of our tutorials',
        //buttons: [{name: 'Next'}],
        button: [],
        template: 'tutorial_overview',
        next: 'contentTypeCreate1',
        overlay: true,
        width: '70%',
        xButton: true
      });

////////////////////////////////////////////////////////////////////////////////
//   Content Types   ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        id: 'contentTypeIntro',
        title: 'Welcome to our Content Type tutorial!',
        description: 'Content Types describe the structure of your content.  In this part of the tutorial we guide you through the interface until you have learned how to create a Content Type.',
        overlay: true,
        buttons: [{name: 'Next'}],
        next: 'contentTypeCreate1'
      });

      createGuider({
        id: 'contentTypeCreate1',
        title: 'The Add menu has all you need',
        description: 'By clicking on this button you can add Content Types, Entries and API Keys.',
        attachTo: '.tab-list .add.button',
        position: '2',
        next: 'contentTypeCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        id: 'contentTypeCreate2',
        title: 'Now add a Content Type',
        description: 'This will open the Content Type editor where you will add your fields.',
        attachTo: '.tab-list .add-btn .dropdown-menu ul:first li:last',
        position: '3',
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

      createGuider({
        id: 'contentTypeName',
        title: 'You need a name',
        attachTo: '.tab-content:visible [ng-model="contentType.data.name"]',
        position: '3',
        description: 'The name should describe generically what this Content Type represents. <em>Recipe</em>, <em>Book</em>, <em>Restaurant</em> and <em>Quiz</em> are examples of names you can use.',
        next: 'contentTypeDescription',
        buttons: [{name: 'Next'}],
        onShow: function (guider) {
          var d = guider.attachScope.$watch('contentType.data.name', function (name) {
            if (name && name.length > 0) {
              guiders.next();
              d();
            }
          });
        }
      });

      createGuider({
        id: 'contentTypeDescription',
        title: 'Describe it',
        attachTo: '.tab-content:visible [ng-model="contentType.data.description"]',
        position: '3',
        description: 'Giving a description to your Content Type will help the people that edit the content to understand what content should go in there.',
        next: 'contentTypeTitle',
        buttons: [{name: 'Next'}],
        onShow: function (guider) {
          var d = guider.attachScope.$watch('contentType.data.description', function (description) {
            if (description && description.length > 0) {
              guiders.next();
              d();
            }
          });
        }
      });

      createGuider({
        id: 'contentTypeTitle',
        title: 'Let\'s add some fields..',
        description: 'You will later insert content into these fields. Create a first one called <strong>Title</strong> with type <strong>Text</strong>.',
        attachTo: '.tab-content:visible .new-field-form .button.new',
        offset: {top: -15, left: 0},
        position: '5',
        next: 'contentTypeContent',
        onShow: function (guider) {
          guider.scope.$watch(repositionLater);
          guider.scope.$watch(function () {
            return _.find(guider.attachScope.contentType.data.fields, {name: 'Title', type: 'Text'});
          }, function (has, old) {
            if (has && !old) guiders.next();
          });
        }
      });

      createGuider({
        id: 'contentTypeContent',
        title: 'We need more information',
        description: 'Add also a field called <strong>Content</strong> with type <strong>Text</strong>.',
        attachTo: '.tab-content:visible .new-field-form .button.new',
        offset: {top: -15, left: 0},
        position: '5',
        next: 'contentTypeDate',
        onShow: function (guider) {
          guider.scope.$watch(repositionLater);
          guider.scope.$watch(function () {
            return _.find(guider.attachScope.contentType.data.fields, {name: 'Content', type: 'Text'});
          }, function (has, old) {
            if (has && !old) guiders.next();
          });
        }
      });

      createGuider({
        id: 'contentTypeDate',
        title: 'When exactly?',
        description: 'In many cases you will need a time or a date in your content. Create a field called <strong>Timestamp</strong> with the type <strong>Date/Time</strong><br>Enter the Name, change the type here, then click the Plus-button to add.',
        attachTo: '.tab-content:visible .new-field-form .type',
        offset: {top: 10, left: -15},
        position: '1',
        next: 'contentTypeMore',
        onShow: function (guider) {
          guider.scope.$watch(repositionLater);
          guider.scope.$watch(function () {
            return _.find(guider.attachScope.contentType.data.fields, {name: 'Timestamp', type: 'Date'});
          }, function (has, old) {
            if (has && !old) guiders.next();
          });
        }
      });

      createGuider({
        id: 'contentTypeMore',
        title: 'Wait, there’s more!',
        description: 'You can add as many fields as you want, activate or deactivate them and add validations through the validations menu. Click <em>Next</em> when you\'re done:',
        attachTo: '.tab-content:visible .new-field-form .button.new',
        offset: {top: -15, left: 0},
        position: '5',
        next: 'contentTypeActivate',
        buttons: [{name: 'Next'}],
        onShow: function (guider) {
          guider.scope.$watch(repositionLater);
        }
      });

      createGuider({
        id: 'contentTypeActivate',
        title: 'Activate it!',
        description: 'Every time you finish creating a Content Type, you must activate it before you can create entries with this type.',
        attachTo: '.content-type-editor:visible button.publish',
        offset: {top: 15, left: 0},
        position: '1',
        next: 'contentTypeList',
        onShow: function (guider) {
          guider.attachScope.$on('newContentTypePublished', function (event, contentType) {
            var scope = event.currentScope;
            if (contentType.getId() == scope.contentType.getId()) {
              tutorialScope.contentTypeDone = true;
              guiders.next();
            }
          });
 
        }
      });

      createGuider({
        id: 'contentTypeList',
        title: 'Here is a list of your Content Types',
        description: 'All your Content Types, whether activated or not, can be accessed and edited through this list. Click here to take a look.',
        attachTo: '.nav-bar ul li:first',
        position: '2',
        next: 'contentTypeExamples',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        id: 'contentTypeExamples',
        title: 'Want to see some more examples?',
        template: 'tutorial_content_type_examples',
        next: 'contentTypeDone'
      });

      createGuider({
        id: 'contentTypeDone',
        title: 'If you want to know more…',
        description: 'If you need more information before starting to use Contentful, please check our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        next: 'overview',
        buttons: [
          {name: 'Back to overview', onclick: function () { guiders.next(); }}
        ]
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

////////////////////////////////////////////////////////////////////////////////
//   Example Data   ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      guiders.createGuider({
        id: 'exampleDataSeed',
        title: 'Generating example data',
        description: 'Please hang on',
        overlay: true,
        onShow: function () {
          tutorialExampledata.createEntriesWithContentTypes().
          then(function () {
            tutorialScope.visitView('entry-list');
            _.defer(function () {
              $('.tab-content .entry-list').scope().resetEntries();
            });
            guiders.next();
          });
        },
        next: 'exampleDataDone'
      });

      guiders.createGuider({
        id: 'exampleDataDone',
        title: 'Done!',
        description: 'We created a couple of entries for you to toy with. Also check out the Content Types we created.',
        attachTo: '.nav-bar ul',
        position: 2
      });
    }
  };

  return new Tutorial();
});
