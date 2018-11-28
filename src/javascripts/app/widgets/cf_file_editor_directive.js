'use strict';

angular.module('contentful').directive('cfFileEditor', [
  'require',
  require => {
    const _ = require('lodash');
    const Filestack = require('services/Filestack.es6');
    const ImageOperations = require('app/widgets/ImageOperations.es6');
    const { Notification } = require('@contentful/ui-component-library');
    const stringUtils = require('utils/StringUtils.es6');
    const mimetype = require('@contentful/mimetype');

    let dropPaneMountCount = 0;

    // TODO use isolated scope for this editor.
    // Ideally everything we do in here should be possible via `widgetApi`.
    // Right now we rely on parent scope properties like:
    // `editorData`, `editorContext`, `fieldLocale`, `locale`, `otDoc`
    return {
      restrict: 'E',
      require: '^cfWidgetApi',
      template: JST.cf_file_editor(),
      link: function(scope, elem, _attrs, widgetApi) {
        const field = widgetApi.field;
        const deleteFile = (scope.deleteFile = setFile.bind(null, null));

        const dropPaneMountPoint = elem[0].querySelectorAll('.__filestack-drop-pane-mount')[0];
        if (dropPaneMountPoint) {
          dropPaneMountCount += 1;
          dropPaneMountPoint.id = '__filestack-drop-pane-mount-' + dropPaneMountCount;
          Filestack.makeDropPane({
            id: dropPaneMountPoint.id,
            onSuccess: setFile
          });
        }

        const removeUpdateListener = field.onValueChanged(file => {
          scope.file = file;
          if (isUnprocessedFile(file)) {
            process();
          }
          validate();
        });
        scope.$on('$destroy', removeUpdateListener);

        scope.$on('imageLoadState', (_e, state) => {
          scope.imageIsLoading = state === 'loading';
        });

        scope.selectFile = function selectFile() {
          Filestack.pick().then(setFile, () => {
            Notification.error('An error occurred while uploading your asset.');
          });
        };

        scope.rotateOrMirror = function rotateOrMirror(mode) {
          scope.imageIsLoading = true;
          ImageOperations.rotateOrMirror(mode, scope.file).then(setUpload, err => {
            scope.imageIsLoading = false;
            notifyEditError(err);
          });
        };

        scope.resize = function resize(mode) {
          ImageOperations.resize(mode, scope.file).then(setUpload, notifyEditError);
        };

        scope.crop = function crop(mode) {
          // Cropping to a circle converts to PNG. Instead of updating only
          // the upload URL we need to update the whole file to include new
          // file name and MIME type.
          ImageOperations.crop(mode, scope.file).then(setFile, notifyEditError);
        };

        scope.canEditFile = function canEditFile() {
          const isEditable = _.get(scope, 'fieldLocale.access.editable', false);
          const fileType = _.get(scope, 'file.contentType', '');
          const isImage = mimetype.getGroupLabel({ type: fileType }) === 'image';
          const isReady = !scope.imageIsLoading && _.get(scope, 'file.url');
          return isEditable && isImage && isReady;
        };

        scope.isUnprocessedFile = isUnprocessedFile;

        function notifyEditError(err) {
          if (!err || !err.cancelled) {
            Notification.error('An error occurred while editing your asset.');
          }
        }

        function setUpload(uploadUrl) {
          return setFile({
            upload: uploadUrl,
            fileName: scope.file.fileName,
            contentType: scope.file.contentType
          });
        }

        function setFile(file) {
          scope.file = file;
          scope.$applyAsync();
          if (file) {
            return field.setValue(file).then(() => {
              maybeSetTitleOnDoc();
              process();
              validate();
            }, validate);
          } else {
            return field.removeValue().then(validate, validate);
          }
        }

        function maybeSetTitleOnDoc() {
          const path = ['fields', 'title', scope.locale.internal_code];
          const fileName = stringUtils.fileNameToTitle(scope.file.fileName);
          if (!scope.otDoc.getValueAt(path)) {
            scope.otDoc.setValueAt(path, fileName);
          }
        }

        function process() {
          scope.editorData.entity
            .process(scope.otDoc.getVersion(), scope.locale.internal_code)
            .catch(err => {
              deleteFile();

              const errors = _.get(err, ['body', 'details', 'errors'], []);
              const invalidContentTypeErr = _.find(errors, { name: 'invalidContentType' });

              if (invalidContentTypeErr) {
                Notification.error(invalidContentTypeErr.details);
              } else {
                Notification.error('An error occurred while processing your asset.');
              }
            });
        }

        function validate() {
          return scope.editorContext.validator.run();
        }

        function isUnprocessedFile(file) {
          // File uploaded but not processed (there is no `file.url` yet).
          return !!(file && file.upload && !file.url);
        }
      }
    };
  }
]);
