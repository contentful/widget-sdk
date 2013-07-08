'use strict';

angular.module('contentful').factory('tutorial', function ($compile, notification, tutorialExampledata, $q, $timeout, $rootScope, analytics) {
  var guiders = window.guiders;
  guiders._defaultSettings.buttons = null;

  function Tutorial() {}

  Tutorial.prototype = {
    getSeen : function () {
      return $.cookies.get('seenTutorial');
    },

    setSeen : function () {
      /*global moment*/
      return $.cookies.set('seenTutorial', true, {
        expiresAt: moment().add('y', 1).toDate()
      });
    },

    start : function () {
      if (!this._initialized) this.initialize();
      this.setSeen();
      guiders.hideAll();
      guiders.show('overview');
    },
    initialize: function () {
      var spaceScope = angular.element('space-view').scope();
      var tutorialScope = spaceScope.$new();

      tutorialScope.goto = function (id) {
        var current = guiders._guiderById(guiders._currentGuiderID);
        var next    = guiders._guiderById(id);
        var omitHidingOverlay = current.overlay && next.overlay;
        guiders.hideAll(omitHidingOverlay);
        guiders.show(id);
      };

      tutorialScope.createExampleContentTypes = function () {
        analytics.track('Created tutorial example data', {
          category: 'content-types'
        });
        tutorialScope.standby = true;
        return tutorialExampledata.createContentTypes(tutorialScope.spaceContext).then(function () {
          tutorialScope.standby = false;
          guiders.next();
        }, function (err) {
          notification.error('Something went wrong:' + err);
          tutorialScope.standby = false;
        });
      };

      tutorialScope.createExampleEntries = function () {
        analytics.track('Created tutorial example data', {
          category: 'entries'
        });
        tutorialScope.standby = true;
        return tutorialExampledata.createEntriesWithContentTypes(tutorialScope.spaceContext).
        then(function () {
          tutorialScope.standby = false;
          if (tutorialScope.spaceContext.tabList.current.viewType == 'entry-list') {
            $('.tab-content .entry-list').scope().resetEntries();
          }
          guiders.next();
        }, function (err) {
          notification.error('Something went wrong:' + err);
          tutorialScope.standby = false;
        });
      };

      tutorialScope.skipExamples = function (category) {
        analytics.track('Skipped tutorial example data', {
          category: category
        });
        guiders.next();
      };

      tutorialScope.abort = function () {
        guiders.hideAll();
      };

      var catGroups;

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

        catGroups = _.groupBy(guiders._guiders, 'category');

        options.onShow = function (guider) {
          var catGroup = catGroups[options.category];
          var position = _.indexOf(catGroup, guider) + 1;
          analytics.track('Opened tutorial window', {
            category: options.category,
            step: position,
            total: catGroup.length,
            id: options.id
          });
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

////////////////////////////////////////////////////////////////////////////////
//   Overview    ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'overview',
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
        category: 'content-types',
        id: 'contentTypeIntro',
        title: 'Welcome to our Content Type tutorial!',
        description: 'Content Types describe the structure of your content.  In this part of the tutorial we guide you through the interface until you have learned how to create a Content Type.',
        overlay: true,
        buttons: [{name: 'Next'}],
        next: 'contentTypeCreate1'
      });

      createGuider({
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
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
        category: 'content-types',
        id: 'contentTypeList',
        title: 'Here is a list of your Content Types',
        description: 'All your Content Types, whether activated or not, can be accessed and edited through this list. Click here to take a look.',
        attachTo: '.nav-bar ul li[data-view-type=content-type-list]',
        position: '2',
        next: 'contentTypeExamples',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeExamples',
        title: 'Want to see some more examples?',
        template: 'tutorial_content_type_examples',
        next: 'contentTypeDone'
      });

      createGuider({
        category: 'content-types',
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

      createGuider({
        category: 'entries',
        id: 'entryIntro',
        title: 'Great! Welcome to our Entries tutorial!',
        description: 'Entries contain to the content itself. They depend on the Content Types you create. In this tutorial we’ll guide you through the Entry editor.',
        overlay: true,
        buttons: [{name: 'Next'}],
        next: 'entrySeed'
      });


      createGuider({
        category: 'entries',
        id: 'entrySeed',
        title: 'Preparing example data',
        description: '<div class="loading"></div><div>Please hang on</div>',
        next: 'entryCreate1',
        onShow: function (){
          tutorialScope.createExampleContentTypes();
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryCreate1',
        title: 'Click on the Add button!',
        description: 'This is a very important step: by clicking on this button you can add Content Types, Entries and API Keys.',
        attachTo: '.tab-list .add.button',
        position: '2',
        next: 'entryCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryCreate2',
        title: 'Now add a Blog Post',
        description: 'This will open the Content Type editor where you will add your fields.',
        attachTo: '.tab-list .add-btn .dropdown-menu ul.content-types li:first',
        position: '3',
        next: 'entryContent',
        onShow: function () {
          var d = spaceScope.$on('otBecameEditable', function () {
            guiders.next();
            d();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryContent',
        title: 'This is how you add content',
        description: 'All you have to do now is to add some content to the fields! Let us first get a brief look at the other parts of the editor.',
        buttons: [{ name: 'Next' }],
        next: 'entrySave'
      });

      createGuider({
        category: 'entries',
        id: 'entrySave',
        title: 'Everything is safe with us',
        description: 'Our system <strong>automatically saves your data</strong> every time there’s a change. No need to press a save button. This status-bar indicates the state of the database connection.',
        attachTo: '.tab-content:visible .save-status',
        position: 11,
        buttons: [{ name: 'Next' }],
        next: 'entryCollaboration'
      });

      createGuider({
        category: 'entries',
        id: 'entryCollaboration',
        title: 'Working together',
        description: 'On Contentful you can work together with your team. On this bar you can see who’s editing the entry <strong>at the same time</strong>.',
        attachTo: '.tab-content:visible .other-users',
        position: 11,
        buttons: [{ name: 'Next' }],
        next: 'entryPublish'
      });

      createGuider({
        category: 'entries',
        id: 'entryPublish',
        title: 'Publish!',
        description: 'Your content is saved automatically, but to make it available for consumption you need to publish it. You can also unpublish previously published content.<br><br><strong>Edit your fields now in the form above, then click this button to publish the entry and proceed.</strong>',
        attachTo: '.tab-content:visible .publish',
        position: 1,
        next: 'entryList',
        onShow: function (guider) {
          guider.attachScope.$watch('entry.isPublished()', function (published) {
            if (published) {
              tutorialScope.entryDone = true;
              guiders.next();
            }
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryList',
        title: 'Your Entries are here',
        description: 'Click on this button, it’ll take you to a <strong>list of all the Entries your team has created</strong>, regardless of whether they were published or are still drafts.',
        attachTo: '.nav-bar ul li[data-view-type=entry-list]',
        position: '2',
        next: 'entryExamples',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryExamples',
        title: 'Want to see some more examples?',
        template: 'tutorial_entry_examples',
        next: 'entryDone'
      });

      createGuider({
        category: 'entries',
        id: 'entryDone',
        title: 'More information about Contentful',
        description: 'If you need more information before starting to use Contentful, please check our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        next: 'overview',
        overlay: true,
        buttons: [{name: 'Next'}]
      });

////////////////////////////////////////////////////////////////////////////////
//   API Key   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyIntro',
        title: 'We’re glad you took our Delivery Tutorial!',
        description: 'Content is accessible in your applications with API Keys. An API Key contains an access token which is used for authentication. In this tutorial we’ll teach you how to create one key for each app.',
        next: 'apiKeyCreate1',
        overlay: true,
        buttons: [{name: 'Next'}]
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyCreate1',
        title: 'Adding starts here',
        attachTo: '.tab-list .add.button',
        position: '2',
        description: 'Everything you need to add is in this menu: Content Types, Entries and API Keys.',
        next: 'apiKeyCreate2',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyCreate2',
        title: 'Select API Key',
        attachTo: '.tab-list .add-btn .dropdown-menu ul:first',
        position: '2',
        description: 'One API Key corresponds to one channel of distribution. This will open the API Key screen.',
        next: 'apiKeyEdit',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyEdit',
        title: 'Give it a name and a description',
        description: 'Name and describe the application you are distributing to. This will help telling the API Keys apart from each other.',
        buttons: [{name: 'Next'}],
        next: 'apiKeySave'
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeySave',
        title: 'When finished, save and generate',
        description: 'When you hit save, the API Key will be generated and ready to use by the app.',
        attachTo: '.api-key-editor:visible button.save',
        offset: {top: 15, left: 0},
        position: '1',
        next: 'apiKeyTest',
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

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyTest',
        title: 'This is your Api Keys Access Token',
        description: 'You can now authenticate your API calls with the access token and consume content from this Space.<br>Try accessing your content using this this token via CURL on the command line or by clicking the link.',
        attachTo: '.api-key-editor:visible .curl-example',
        position: 7,
        next: 'apiKeyList',
        buttons: [{name: 'Next'}]
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyList',
        title: 'Here are your API Keys',
        description: 'Every time you create an API Key it appears on the list shown by this button.',
        attachTo: '.nav-bar ul li[data-view-type=content-delivery]',
        position: '2',
        next: 'apiKeyDone',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyDone',
        title: 'Learn more?',
        description: 'If you need more information before starting to use Contentful, please check our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        overlay: true,
        next: 'overview',
        buttons: [{name: 'Next'}]
      });

    }
  };

  return new Tutorial();
});
