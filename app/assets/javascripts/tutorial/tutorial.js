'use strict';

angular.module('contentful').factory('tutorial', ['$compile', 'notification', 'tutorialExampledata', '$q', '$timeout', '$rootScope', 'analytics', 'logger', 'environment', 'debounce', 'throttle', function ($compile, notification, tutorialExampledata, $q, $timeout, $rootScope, analytics, logger, environment, debounce, throttle) {
  var guiders = window.guiders;
  guiders._defaultSettings.buttons = null;
  guiders._defaultSettings.xButton = true;
  guiders._arrowSize = 10;
  guiders.showDelayed = function (id) {
    var guider = guiders._guiderById(id);
    if (_.isEmpty(guider.attachTo)) {
      //console.log('showing immediate', id, guider.attachTo);
      guiders.showImmediate(id);
    } else {
      var tries = 4;
      attach();
    }
    function attach() {
      //console.log('attach', id, guider.attachTo, 'try', tries);
      if (tries-- === 0) {
        logger.logError('Failed to find attachTo('+guider.attachTo+') for Guider '+id);
        guiders.showImmediate(id);
        return;
      }
      if ($(guider.attachTo).length > 0) {
        guiders.showImmediate(id);
      } else {
        setTimeout(attach, 200);
      }
    }
  };
  guiders.showImmediate = guiders.show;
  guiders.show = guiders.showDelayed;

  var next = {name: '<i class="fa fa-angle-right"></i>', classString: 'btn btn--secondary next-button', onclick: function(){guiders.next();}};

  function Tutorial() {}

  Tutorial.prototype = {
    getSeen : function () {
      return $.cookies.get('seenTutorial');
    },

    setSeen : function () {
      return $.cookies.set('seenTutorial', true, {
        expiresAt: moment().add('y', 1).toDate()
      });
    },

    start : function () {
      var clientScope = angular.element('.client').scope();
      var tutorial = this;
      return tutorialExampledata.switchToTutorialSpace(clientScope).then(function () {
        if (!tutorial._initialized) tutorial.initialize();
        clientScope.disableTooltip = true;
        tutorial.setSeen();
        guiders.hideAll();
        guiders.show('welcome');
      });
    },
    initialize: function () {
      var spaceScope = angular.element('space-view').scope();
      var tutorialScope = spaceScope.$new();

      tutorialScope.goTo = function (id) {
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
          notification.serverError('Error creating tutorial content types', err);
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
            $('.tab-content .entry-list').scope().resetEntries(true);
          }
          guiders.next();
        }, function (err) {
          notification.serverError('Error creating tutorial entries', err);
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
        angular.element('.client').scope().disableTooltip = false;
        guiders.show('restartHint');
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

          function scroll(selector) {
            var $elem = $(selector);
            var $parent = $elem.scrollParent();
            var top = scrollTopOffset($elem[0], $parent[0]);
            // TODO sometimes top is too large
            var bottom = top + $elem[0].offsetHeight;

            if ($parent[0].scrollHeight <= $parent[0].clientHeight) return;

            if ($parent[0].scrollTop + $parent[0].clientHeight < top)
              $elem[0].scrollIntoView();
            else if (bottom < $parent[0].scrollTop)
              $elem[0].scrollIntoView();

            function scrollTopOffset(elem, container) {
              if (elem === container || !elem) return 0;
              return elem.offsetTop + scrollTopOffset(elem.offsetParent);
            }
          }

          $rootScope.$evalAsync(function () {
            guider.scope = parentScope.$new();
            if (guider.attachTo) try {
              if ($(guider.attachTo).parents('.tab-main').length > 0) scroll(guider.attachTo);
              guider.attachScope = $(guider.attachTo).scope().$new();
            } catch (e) {
              logger.logException(e, {
                guiderId: guider.id,
                guiderAttachTo: guider.attachTo
              });
            }
            if (onShow) onShow.call(guider, guider);
          });
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
        options.onClose = function () {
          tutorialScope.$apply('abort()');
        };
        options.onHide = function (guider) {
          try {
            if (onHide) onHide.call(guider, guider);
            if (!$rootScope.$$phase) $rootScope.$apply();
          } finally {
            if (guider.attachScope) {
              $rootScope.$evalAsync(function () {
                if (guider.attachScope) guider.attachScope.$destroy();
                delete guider.attachScope;
              });
            }
            if (guider.scope) {
              $rootScope.$evalAsync(function () {
                if (guider.scope) guider.scope.$destroy();
                delete guider.scope;
              });
            }
          }
        };
        guiders.createGuider(options);
        $compile(angular.element('.guider#'+options.id))(parentScope);
      }

      var repositionLater = throttle(function () {
        guiders.reposition();
      }, 50, true);


      function watchForFieldType(guider, type) {
        return function () {
          return _.find(guider.attachScope.contentType.data.fields, {type: type});
        };
      }

////////////////////////////////////////////////////////////////////////////////
//   Welcome   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'welcome',
        id: 'welcome',
        title: 'Welcome onboard Contentful',
        template: 'tutorial_welcome',
        next: 'contentTypeCreate1',
        overlay: true,
        width: '90%',
        onShow: function () {
          setTimeout(repositionLater, 200);
          //repositionLater();
        }
      });

      createGuider({
        category: 'welcome',
        id: 'restartHint',
        title: 'If you want to restart the tutorial…',
        description: 'If you want to restart the tutorial you can open it again any time by choosing "Start Tutorial" from the user menu.',
        attachTo: '.account-menus .user',
        position: 5,
        xButton: false,
        buttons: [{name: 'OK', classString: 'btn btn--secondary btn--primary', onclick: function(){guiders.hideAll();}}]
      });


////////////////////////////////////////////////////////////////////////////////
//   Content Types   ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'content-types',
        id: 'contentTypeIntro',
        title: 'Welcome to our Content Model tutorial!',
        description: '<p>Before anything else, you have to create your Content Types. All your Content Types are your <strong>Content Model</strong>.</p><p>This is like deciding which forms to use for cookies you’d like to bake.'+
          ' Depending on what you’ll be baking, you’ll use a set of specific forms (Content Types) that will ultimately shape the dough (your content).</p>'+
          ' <p>This first tutorial walks you through Content Types creation.</p>',
        overlay: true,
        buttons: [next],
        next: 'contentTypeCreate1'
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeCreate1',
        title: 'Meet the mighty Add button',
        description: '<p>One click on the Add button and you can add new Content Types, Entries and API Keys to your account.</p><p><strong>Click and see for yourself.</strong></p>',
        attachTo: '.add-dropdown-button',
        position: '7',
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
        title: 'Now add your Content Types',
        description: '<p>One click here will put you right into the Content Type Editor, where you’ll be able to create your Content Type, adding Fields to it.</p><p>Note: you won’t be able to see the Entries option in the Add menu, before you create Content Types</p><p><strong>Take it to the next level, click on Content Types.</strong></p>',
        attachTo: '.add-dropdown-button .add-content-type',
        position: '2',
        next: 'contentTypeEditor',
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
        id: 'contentTypeEditor',
        title: 'Welcome to the Content Type editor. Let’s create your first Content Type',
        description: '<p>A Content Type is like a cookie cutter: it shapes your dough (which in Contentful is your content). Once you\'ve shaped the cutter into whatever you want your cookies to look like, you can change the ingredients. The same is true of your content. Once you defined your Content Type, you can insert any fitting content and media.</p><p>This shaping will facilitate the distribution of your content onto multiple platforms later.</p><p>Put together, your Content Types, make up your Content Model.</p>',
        next: 'contentTypeName',
        overlay: true,
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeName',
        title: 'Name your Content Type',
        attachTo: '.tab-content:visible [ng-model="contentType.data.name"]',
        position: '2',
        description: 'The best name for your Content Type is one that’s descriptive of the content it stores (e.g. Book, Quiz, Recipe). Let’s call this one <strong>Blog Post</strong>.',
        next: 'contentTypeSaving',
        buttons: [next],
        onShow: function (guider) {
          $(this.attachTo).focus();
          var d = guider.attachScope.$watch('contentType.data.name', function (name) {
            if (name && name.match(/blog post/i)) {
              guiders.next();
              d();
            }
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeSaving',
        title: 'That\'s peace of mind',
        attachTo: '.tab-content:visible .save-status',
        position: '11',
        description: 'Each change that you make is automatically saved, so say goodbye to lost work.',
        next: 'contentTypeDescription',
        buttons: [next]
      });


      createGuider({
        category: 'content-types',
        id: 'contentTypeDescription',
        title: 'Describe it',
        attachTo: '.tab-content:visible [ng-model="contentType.data.description"]',
        position: '2',
        description: 'Your description will help other editors to understand which content belongs in this Content Type. We recommend you keep it concise and objective.',
        next: 'contentTypeAddFields',
        buttons: [next],
        onShow: function (guider) {
          $(this.attachTo).focus();
          var d = guider.attachScope.$watch('contentType.data.description', function (description) {
            if (description && description.length > 5) {
              guiders.next();
              d();
            }
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddFields',
        title: 'Populate with fields',
        description: 'Let’s create your first Fields. You can add Fields which store content themselves or Fields that will attach other Entries or Assets to the Entry corresponding to this Content Type.',
        attachTo: '.tab-content:visible [name="contentTypeForm"] .btn--primary:visible',
        position: '12',
        next: 'contentTypeAddText',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddText',
        title: 'Select the Field Type',
        description: 'There are several Field types you can choose from. Take a quick glance at all of them. For this example we will start with a title, so choose the <strong>Text</strong> type.',
        attachTo: '.tab-content:visible .type-menu .type',
        position: '10',
        next: 'contentTypeEditText',
        onShow: function (guider) {
          guider.attachScope.$watch(watchForFieldType(guider, 'Text'), function (has, old) {
            if (has && !old) guiders.next();
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeEditText',
        title: 'Name and describe it',
        description: 'Fields also need a name. For this example let’s name it <strong>Title</strong>. That’s the name content editors will see on the Entry Editor interface. The Field ID for the API will be created automatically. After the tutorial you’ll be able to create Fields to your heart’s content.',
        attachTo: '.tab-content:visible .cf-field-settings-editor *[name="fieldName"]',
        position: '7',
        next: 'contentTypeConfirmId',
        onShow: function (guider) {
          repositionLater();
          $(this.attachTo).focus();
          var d = guider.attachScope.$watch('field.name', function (name) {
            if (name && name.match(/title/i)) {
              guiders.next();
              d();
            }
          });
        }
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeConfirmId',
        title: 'This is the Fields ID',
        description: '<p>The ID is relevant for content delivery. It is autogenerated initially but can also be changed later, as long as the field has not been published.</p><p>Keep in mind that no two fields are allowed to have the same ID.</p>',
        attachTo: '.tab-content:visible .cf-field-settings-editor *[name="fieldId"]',
        position: '11',
        buttons: [next],
        next: 'contentTypeMoreOptions',
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeMoreOptions',
        title: 'More content editing options',
        description: 'The second row displays even more editing options.',
        attachTo: '.tab-content:visible .field-details',
        position: '2',
        next: 'contentTypeRequire',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeRequire',
        title: 'The Require option',
        description: 'Forces users to enter something in this field. They cannot leave it empty.',
        attachTo: '.tab-content:visible .field-details .toggle-required',
        position: '6',
        next: 'contentTypeValidate',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeValidate',
        title: 'The Validations functionality',
        description: 'Often times you need to ensure your content adheres to more specific rules. That is what validations are for. For each Field you can define rules that guarantee that editors can only enter valid content.',
        attachTo: '.tab-content:visible .field-details .toggle-validate',
        position: '6',
        next: 'contentTypeLocalize',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeLocalize',
        title: 'The Localize option',
        description: 'That click will allow you to translate the content in this Field to several languages. You can set up languages in the Locales section of the Space Settings.',
        attachTo: '.tab-content:visible .field-details .toggle-localized',
        position: '6',
        next: 'contentTypeTitleField',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeTitleField',
        title: 'The Use as Title option',
        description: 'Click it and turn a Field into your title in the interface. Logically enough, there can only be one per Content Type.',
        attachTo: '.tab-content:visible .field-details .toggle-title',
        position: '6',
        next: 'contentTypeDelete',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeDelete',
        title: 'The Delete option',
        description: 'If your Field isn’t activated yet, you can either modify it or delete it. However, once the Field is activated it won’t be possible to change the type or delete it. You will be able, though, to disable it. If you need to modify any Field, you’ll first need to deactivate it.',
        attachTo: '.tab-content:visible .field-details .toggle-disabled:visible',
        position: '6',
        next: 'contentTypeAddBody1',
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddBody1',
        title: 'More Fields!',
        description: 'Now let’s populate with some more Fields. Add another <strong>Text</strong> Field, called <strong>Body</strong> (this will be the body of your Blog Post).',
        attachTo: '.tab-content:visible .add-field-button',
        position: '11',
        next: 'contentTypeAddBody2',
        onShow: function (guider) {
          $(guider.attachTo).one('click', function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddBody2',
        title: 'More Fields!',
        description: 'Now let’s populate with some more Fields. Add another <strong>Text</strong> Field, called Body (this will be the body of your Blog Post).',
        attachTo: '.tab-content:visible .type-menu:visible *[data-type-name="Text"]',
        position: '2',
        next: 'contentTypeConfigBody',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.filter(guider.attachScope.contentType.data.fields, {type: 'Text'}).length >= 2;
          }, function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeConfigBody',
        title: 'More Fields!',
        description: 'Give the Field a the title <strong>Body</strong>.',
        attachTo: '.tab-content:visible .field-form:visible',
        position: '11',
        next: 'contentTypeAddTimestamp1',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.find(guider.attachScope.contentType.data.fields, {type: 'Text', name: 'Body', id: 'body'});
          }, function () {
            guiders.next();
          });
        },
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddTimestamp1',
        title: 'More Fields!',
        description: 'Often you’ll need a date and time for your content. Let’s do this: select <strong>Date/Time</strong> in the types selection and call your Field <strong>Timestamp</strong>.',
        attachTo: '.tab-content:visible .add-field-button',
        position: '11',
        next: 'contentTypeAddTimestamp2',
        onShow: function (guider) {
          $(guider.attachTo).one('click', function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddTimestamp2',
        title: 'More Fields!',
        description: 'Often you’ll need a date and time for your content. Let’s do this: select <strong>Date/Time</strong> in the types selection and call your Field Timestamp.',
        attachTo: '.tab-content:visible .type-menu:visible *[data-type-name="Date/Time"]',
        position: '2',
        next: 'contentTypeConfigTimestamp',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.filter(guider.attachScope.contentType.data.fields, {type: 'Date'}).length >= 1;
          }, function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeConfigTimestamp',
        title: 'More Fields!',
        description: 'Give the Field a the title <strong>Timestamp</strong>.',
        attachTo: '.tab-content:visible .field-form:visible',
        position: '11',
        next: 'contentTypeAddAsset1',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.find(guider.attachScope.contentType.data.fields, {type: 'Date', name: 'Timestamp', id: 'timestamp'});
          }, function () {
            guiders.next();
          });
        },
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddAsset1',
        title: 'Now, onto the Asset Field!',
        description: 'The last type of Field to add: an Asset. Choose the <strong>Asset</strong> Field from the menu and call it <strong>Image</strong>.',
        attachTo: '.tab-content:visible .add-field-button',
        position: '11',
        next: 'contentTypeAddAsset2',
        onShow: function (guider) {
          $(guider.attachTo).one('click', function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeAddAsset2',
        title: 'More Fields!',
        description: 'The last type of Field to add: an Asset. Choose the <strong>Asset</strong> Field from the menu and call it Image.',
        attachTo: '.tab-content:visible .type-menu:visible *[data-type-name="Asset"]',
        position: '2',
        next: 'contentTypeConfigAsset',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.filter(guider.attachScope.contentType.data.fields, function (field) {
              return field.type == 'Link' && field.linkType == 'Asset';
            }).length >= 1;
          }, function () {
            guiders.next();
          });
        },
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeConfigAsset',
        title: 'Now, onto the Asset Field!',
        description: 'Give the Field a the title <strong>Image</strong>. That’s it, you can now upload images on your Blog Post.',
        attachTo: '.tab-content:visible .field-form:visible',
        position: '11',
        next: 'contentTypeActivate',
        onShow: function (guider) {
          repositionLater();
          guider.scope.waitFor(function () {
            return _.find(guider.attachScope.contentType.data.fields, function (field) {
              return field.type == 'Link' && field.linkType == 'Asset' && field.name == 'Image' && field.id == 'image';
            });
          }, function () {
            guiders.next();
          });
        },
        buttons: [next]
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeActivate',
        title: 'Ready, steady, activate!',
        description: 'Don’t forget to click the Activate button when you are done creating a Content Type. You need to activate it so that your editors can create Entries of that Content Type.',
        attachTo: '.content-type-editor:visible .tab-actions .publish',
        offset: {top: 15, left: 0},
        position: '1',
        next: 'contentTypeList',
        onShow: function (guider) {
          guider.attachScope.$on('contentTypePublished', function (event, contentType) {
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
        title: 'Your Content Types’ home',
        description: 'Access and edit your Content Types anytime you want, whether they are activated or not. <strong>Click on the icon and take a look for yourself.</strong>',
        attachTo: '.nav-bar ul li[data-view-type=content-type-list]',
        position: '7',
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
        title: 'You defined your first Content Type!',
        template: 'tutorial_content_type_examples',
        xButton: false,
        next: 'contentTypeDone'
      });

      createGuider({
        category: 'content-types',
        id: 'contentTypeDone',
        title: 'Round the clock infos',
        description: 'Get more info on Contentful, features and functionalities any time of the day and night on our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        next: 'welcome',
        buttons: [
          {name: 'Back to tutorials overview menu', onclick: function () { guiders.next(); }}
        ]
      });

////////////////////////////////////////////////////////////////////////////////
//   Entries   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'entries',
        id: 'entryIntro',
        title: 'Greetings! Let’s start the Entries & Assets tutorial',
        description: '<p>The Entries are where your content will reside, live, stay put if you wish. Assets, are media that you add to your content, such as a picture, video or audio file.</p><p>Your Entries and Assets depend on the Content Types we defined in the previous step of the tutorial.</p>',
        overlay: true,
        buttons: [
          {name: 'Discover the Entry Editor', onclick: function () { guiders.next(); }}
        ],
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
        title: 'Meet the mighty Add button',
        description: 'One click on the Add button and you can add new Content Types, Entries, Assets and API Keys to your space.',
        attachTo: '.add-dropdown-button',
        position: '7',
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
        title: 'Now add a Quiz Question',
        description: 'Clicking on the chosen Content Type, <strong>Quiz Question</strong>, will open the Entry Editor, where you will be able to edit the content for a new Quiz.',
        attachTo: '.add-dropdown-button li[data-content-type-id="6Ku1uo32lqMYieci6ocUCs"]',
        position: '2',
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
        title: 'This is the Entry editor',
        description: 'Here you can’t add or edit Fields anymore. This Editor allows editors to focus on inserting content, according to the Content Type you created before.',
        overlay: true,
        buttons: [next],
        next: 'entryQuestion'
      });

      createGuider({
        category: 'entries',
        id: 'entryQuestion',
        title: 'Ask a question',
        description: 'Ask “Which CMS delivers content to web and native mobile applications?”',
        attachTo: '.entry-editor:visible .l-form-row[data-field-id="question"] input',
        position: '2',
        next: 'entryAnswers',
        buttons: [next],
        onShow: function (guider) {
          $(this.attachTo).focus();
          var d = this.attachScope.$watch('fieldData.value', debounce(function (value, old) {
            if (value !== old) {
              if (guiders._currentGuiderID === guider.id) guiders.next();
              d();
              d = null;
            }
          }, 2000));
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryAnswers',
        title: 'Add some answers',
        description: '<p>Add the following answers to each <strong>Answer</strong> Field by order: Wordpress, Contentful, Drupal, Joomla.</p><p>In the <strong>Correct Answer</strong> Field, you can define which option number has the correct answer. <strong>Well, you know it’s number 2, right?</strong>',
        attachTo: '.entry-editor:visible .l-form-row[data-field-id="answer1"] textarea',
        position: '2',
        next: 'entryAsset',
        buttons: [next],
        onShow: function (guider) {
          $(this.attachTo).focus();
          var d = this.attachScope.$watch('entry.data.fields.correctAnswer[spaceContext.defaultLocale.code]', debounce(function (value, old) {
            if (value !== old) {
              if (guiders._currentGuiderID === guider.id) guiders.next();
              d();
              d = null;
            }
          }, 500));
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryAsset',
        title: 'Let\'s add your first asset',
        description: '<p>By clicking the “New” button, you will open the Asset editor. Assets can also be created through the top add button independent from an Entry and then linked.</p><p>For now lets click on the “New” button and open the Asset editor right away.</p>',
        attachTo: '.entry-editor:visible .l-form-row[data-field-id="image"] .add-new:visible',
        position: '11',
        next: 'assetTitle',
        onShow: function () {
          $(this.attachTo).one('click', function () {
            spaceScope.one('otBecameEditable', function () {
              guiders.next();
            });
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'assetTitle',
        title: 'Name and describe your Asset',
        description: 'First, as you’ve probably noticed, you need to name your Asset. Let’s call it <strong>Quiz Picture</strong>. Then add a short description, to help other members of your team to work on it even if they haven’t created it themselves.',
        attachTo: '.asset-editor:visible .l-form-row[data-field-id="title"] input',
        position: '2',
        next: 'assetUpload',
        buttons: [next],
        onShow: function (guider) {
          $(this.attachTo).focus();
          var d = this.attachScope.$watch('asset.data.fields.title[spaceContext.defaultLocale.code]', debounce(function (value, old) {
            if (value !== old) {
              if (guiders._currentGuiderID === guider.id) guiders.next();
              d();
              d = null;
            }
          }, 1000));
        }
      });

      createGuider({
        category: 'entries',
        id: 'assetUpload',
        title: 'Time to upload',
        description: '<p>Finally, upload your file by either clicking “Open File Picker” or drag and drop the file from your computer.</p><p>For this tutorial, let’s open the File Picker.</p>',
        attachTo: '.asset-editor:visible .upload-button',
        position: 2,
        next: 'assetPick',
        onShow: function (guider) {
          $(guider.attachTo).one('click', function () {
            guiders.next();
          });
        }

      });

      createGuider({
        category: 'entries',
        id: 'assetPick',
        title: 'Pick and choose',
        description: '<p>There is quite a few types of Asset sources you can choose from in the File Picker.</p><p>Select <strong>Web Images and search for quiz</strong>. See the first colourful image? Select that one and click upload.</p>',
        attachTo: '#filepicker_dialog_container',
        position: 6,
        next: 'assetPublish',
        onShow: function (guider) {
          $('#'+guider.id).css({'z-index': 100000});
          var assetScope = $('.asset-editor:visible').scope();
          guider.scope.waitFor(function () {
            return assetScope.$eval('asset.data.fields.file[spaceContext.defaultLocale.code].url');
          }, function () {
            assetScope = null;
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'assetPublish',
        title: 'Are you ready?',
        description: '<p>Publish your Asset to successfully display it later on any platform. If you choose to archive it, it will still be properly linked to the Entry but won’t be displayed with the exported content. You can publish it later at any given moment.</p><p><strong>For now, publish!</strong></p>',
        attachTo: '.asset-editor:visible .publish',
        position: 1,
        next: 'entryOpenTab',
        onShow: function (guider) {
          guider.attachScope.waitFor('asset.isPublished()', function () {
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryOpenTab',
        title: 'Back to your Entry',
        description: 'Every editor will open a new tab here. Go back to the Entry Editor to continue with the tutorial.',
        attachTo: '.tab-list .tab[data-view-type="entry-editor"]:visible',
        position: 7,
        next: 'entryCollaboration',
        onShow: function () {
          spaceScope.one('tabBecameActive', function () {
            setTimeout(function () {
              guiders.next();
            }, 500);
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryCollaboration',
        title: 'Team effort',
        description: 'Contentful makes working together easy. Multiple users, simultaneous editing. See who is currently working on the same Entry with you.',
        attachTo: '.entry-editor:visible .other-users',
        position: 12,
        buttons: [next],
        next: 'entrySave'
      });

      createGuider({
        category: 'entries',
        id: 'entrySave',
        title: 'Everything is safe with us',
        description: 'We <strong>automatically save your data</strong> on every single change you make, regardless of the stage you are at. No need to frantically click save or worry about losing data. Look at the bottom bar to see the current save status.',
        attachTo: '.entry-editor:visible .save-status',
        position: 11,
        buttons: [next],
        next: 'entryPublish'
      });

      createGuider({
        category: 'entries',
        id: 'entryPublish',
        title: 'Ready, steady, publish!',
        description: 'When you feel ready for your audience to get your content, hit that button. Until that moment we will keep everything saved for you. We also give you an exit door and enable you to unpublish previously published content.',
        attachTo: '.entry-editor:visible .publish',
        position: 1,
        next: 'entryList',
        onShow: function (guider) {
          guider.attachScope.waitFor('entry.isPublished()', function () {
            tutorialScope.entryDone = true;
            guiders.next();
          });
        }
      });

      createGuider({
        category: 'entries',
        id: 'entryList',
        title: 'Your Entries and Assets',
        description: '<p>By clicking Entries and Assets, you can see the respective lists. Both Assets and Entries will be listed regardless of whether they are published or still drafts.</p><p>Click on <strong>Entries</strong> now.</p>',
        attachTo: '.nav-bar ul li[data-view-type=entry-list]',
        position: '6',
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
        title: 'You defined you first Entry and Asset',
        template: 'tutorial_entry_examples',
        xButton: false,
        next: 'entryDone'
      });

      createGuider({
        category: 'entries',
        id: 'entryDone',
        title: 'Round the clock infos',
        description: 'Get more info on Contentful, features and functionalities any time of the day and night on our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        next: 'welcome',
        overlay: true,
        buttons: [
          {name: 'Back to tutorials overview menu', onclick: function () { guiders.next(); }}
        ]
      });

////////////////////////////////////////////////////////////////////////////////
//   API Key   /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyIntro',
        title: 'One step away from flying solo!',
        description: '<p>Once you created your Content Model, got it populated with Entries and Assets, you should get it to your users. Your content is distributed onto your apps through API Keys. The API is like your 60’s phone operator connecting your content and your app.</p><p>In this tutorial you’ll learn how to create an API Key for each one of your distribution platforms (app, website, etc).</p>',
        next: 'apiKeyCreate1',
        overlay: true,
        buttons: [next]
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyCreate1',
        title: 'One more click onto the Add button',
        attachTo: '.add-dropdown-button',
        position: '7',
        description: '<p>This time we’ll use it to create an API Key. Now, you’ve seen all the Add button can do.</p><p><strong>Click the Add button</strong></p>',
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
        title: 'Now, select “API Key”',
        attachTo: '.add-dropdown-button .add-api-key',
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
        title: 'Name and describe your first API Key',
        description: 'Each API Key works for one distribution platform. To make sure you get the right content to the right platform, give your API Keys descriptive names.',
        buttons: [next],
        attachTo: '.api-key-editor:visible input[ng-model="apiKey.data.name"]',
        position: 2,
        next: 'apiKeySave'
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeySave',
        title: 'All done? Save and generate the Key',
        description: 'Clicking the save button will secure your changes, as well as generate the API Key you defined. Your content will then be available for your app.',
        attachTo: '.api-key-editor:visible button.save',
        position: '1',
        next: 'apiKeyTest',
        onShow: function () {
          this.attachScope.waitFor('apiKey.data.accessToken', function () {
            setTimeout(function(){
              tutorialScope.apiKeyDone = true;
              guiders.next();
            }, 500);
          });
        }
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyTest',
        title: 'Tadaa! This is your Access Token',
        description: '<p>The Access Token enables you to authenticate the API calls your distribution platform makes on Contentful to retrieve your content. Access Tokens make sure that your content can only be used from your own applications.</p><p>You can test this by using this token by either clicking the link or via CURL by using the command line.</p>',
        attachTo: '.api-key-editor:visible input.access-token:first',
        position: '6',
        next: 'apiKeyList',
        buttons: [next],
        //onShow: function () {
          //repositionLater();
        //}
      });

      createGuider({
        category: 'apiKeys',
        id: 'apiKeyList',
        title: 'The home to your API Keys',
        description: '<p>Access and edit your API Keys anytime from the Content Delivery Menu.</p><p>Click <strong>API</strong> now.</p>',
        attachTo: '.nav-bar ul li[data-view-type=api-home]',
        position: '6',
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
        title: 'You’ve closed the tutorial loop.',
        description: 'Get more info on Contentful, features and functionalities any time of the day and night on our <a href="http://support.contentful.com/home">Knowledge Base Pages</a>.',
        overlay: true,
        next: 'welcome',
        buttons: [
          {name: 'Back to tutorials overview menu', onclick: function () { guiders.next(); }}
        ]

      });

      this._initialized = true;

    }
  };

  return new Tutorial();
}]);
