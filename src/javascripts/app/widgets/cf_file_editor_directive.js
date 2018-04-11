'use strict';

angular.module('contentful')
.directive('cfFileEditor', ['require', function (require) {
  var _ = require('lodash');
  var aviary = require('aviary');
  var Filestack = require('services/Filestack');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var modalDialog = require('modalDialog');
  var openInputDialog = require('app/InputDialog').default;
  var mimetype = require('mimetype');

  var dropPaneMountCount = 0;

  // TODO use isolated scope for this editor.
  // Ideally everything we do in here should be possible via `widgetApi`.
  // Right now we rely on parent scope properties like:
  // `editorData`, `editorContext`, `fieldLocale`, `locale`, `otDoc`
  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST.cf_file_editor(),
    link: function (scope, elem, _attrs, widgetApi) {
      var field = widgetApi.field;
      var deleteFile = setFile.bind(null, null);

      var dropPaneMountPoint = elem[0].querySelectorAll('.__filestack-drop-pane-mount')[0];
      if (dropPaneMountPoint) {
        dropPaneMountCount += 1;
        dropPaneMountPoint.id = '__filestack-drop-pane-mount-' + dropPaneMountCount;
        Filestack.makeDropPane({
          id: dropPaneMountPoint.id,
          onSuccess: setFile
        });
      }

      var removeUpdateListener = field.onValueChanged(function (file) {
        scope.file = file;
        validate();
      });
      scope.$on('$destroy', removeUpdateListener);

      scope.$on('imageLoadState', function (_e, state) {
        scope.imageIsLoading = state === 'loading';
      });

      scope.selectFile = selectFile;
      scope.rotateOrMirror = rotateOrMirror;
      scope.cropWithFilestack = cropWithFilestack;
      scope.cropCustomAspectRatio = cropCustomAspectRatio;
      scope.editWithAviary = editWithAviary;
      scope.canEditFile = canEditFile;
      scope.deleteFile = deleteFile;

      function selectFile () {
        Filestack.pick().then(setFile, function () {
          notification.error('An error occurred while uploading an asset.');
        });
      }

      function rotateOrMirror (mode) {
        var imageUrl = getImageUrl();
        if (imageUrl) {
          scope.imageIsLoading = true;
          Filestack.rotateOrMirrorImage(mode, imageUrl).then(function (filestackUrl) {
            return setFile({
              upload: filestackUrl,
              fileName: scope.file.fileName,
              contentType: scope.file.contentType
            });
          }, function () {
            scope.imageIsLoading = false;
            notification.error('An error occurred while editing an asset.');
          });
        } else {
          notification.error('An error occurred while editing an asset.');
        }
      }

      function cropWithFilestack (mode) {
        var imageUrl = getImageUrl();
        if (imageUrl) {
          var img = scope.file.details.image;
          mode = mode === 'original' ? (img.width / img.height) : mode;
          Filestack.cropImage(mode, imageUrl).then(setFile, function () {
            notification.error('An error occurred while editing an asset.');
          });
        } else {
          notification.error('The image editor has failed to load.');
        }
      }

      function cropCustomAspectRatio () {
        var img = scope.file.details.image;
        openInputDialog({
          input: {
            value: '' + img.width + ':' + img.height,
            regex: /^[1-9][0-9]{0,3}:[1-9][0-9]{0,3}$/
          },
          title: 'Please provide desired aspect ratio',
          message: [
            'Expected format is <code>{width}:{height}</code>. ',
            'Both <code>{width}</code> and <code>height</code> should be numbers between 1 and 9999. ',
            'The form is prepopulated with the aspect ratio of your image.'
          ].join(''),
          confirmLabel: 'Crop with provided aspect ratio'
        }).promise.then(function (ratio) {
          var dim = ratio.split(':');
          cropWithFilestack(parseInt(dim[0], 10) / parseInt(dim[1], 10));
        });
      }

      function editWithAviary () {
        modalDialog.openConfirmDeleteDialog({
          title: 'Adobe Creative Editor is deprecated',
          message: [
            'Adobe Creative Editor will be discontinued by Adobe soon. It\'s still possible to use ',
            'it but we suggest you to utilize new file editor options provided. You can rotate, ',
            'mirror, crop (with and without maintaining aspect ratio) and circle images using them.'
          ].join(''),
          confirmLabel: 'I still want to use Adobe Creative Editor',
          cancelLabel: 'Cancel'
        }).promise.then(openAviary);
      }

      function canEditFile () {
        var isEditable = _.get(scope, 'fieldLocale.access.editable', false);
        var fileType = _.get(scope, 'file.contentType', '');
        var isImage = mimetype.getGroupLabel({type: fileType}) === 'image';
        var isReady = !scope.imageIsLoading && _.get(scope, 'file.url');
        return isEditable && isImage && isReady;
      }

      function openAviary () {
        var imageUrl = getImageUrl();
        if (!imageUrl) {
          notification.error('The image editor has failed to load.');
          return;
        }

        var preview = elem[0].querySelectorAll('[aviary-editor-preview]')[0];
        preview.src = '';

        preview.onload = function () {
          aviary.createEditor({
            image: preview,
            url: imageUrl,
            onClose: _.noop
          }).then(function (aviaryUrl) {
            return Filestack.store(aviaryUrl);
          }).then(function (filestackUrl) {
            return setFile({
              upload: filestackUrl,
              fileName: scope.file.fileName,
              contentType: scope.file.contentType
            });
          }).then(function () {
            aviary.close();
          }, function (err) {
            notification.error(err.message || 'An error occurred while editing an asset.');
            aviary.close();
          });
        };

        preview.src = imageUrl;
      }

      function getImageUrl () {
        var img = elem[0].querySelectorAll('.thumbnail')[0];
        return img ? stringUtils.removeQueryString(img.src) : null;
      }

      function setFile (file) {
        scope.file = file;
        scope.$applyAsync();
        if (file) {
          return field.setValue(file)
          .then(function () {
            maybeSetTitleOnDoc();
            process();
            validate();
          }, validate);
        } else {
          return field.removeValue().then(validate, validate);
        }
      }

      function maybeSetTitleOnDoc () {
        const path = ['fields', 'title', scope.locale.internal_code];
        const fileName = stringUtils.fileNameToTitle(scope.file.fileName);
        if (!scope.otDoc.getValueAt(path)) {
          scope.otDoc.setValueAt(path, fileName);
        }
      }

      function process () {
        scope.editorData.entity.process(scope.otDoc.getVersion(), scope.locale.internal_code)
        .catch(function (err) {
          deleteFile();

          const errors = _.get(err, ['body', 'details', 'errors'], []);
          const invalidContentTypeErr = _.find(errors, {name: 'invalidContentType'});

          if (invalidContentTypeErr) {
            notification.error(invalidContentTypeErr.details);
          } else {
            notification.error('There has been a problem processing the Asset.');
          }
        });
      }

      function validate () {
        return scope.editorContext.validator.run();
      }
    }
  };
}]);
