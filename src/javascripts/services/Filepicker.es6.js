import $q from '$q';
import $rootScope from '$rootScope';
import LazyLoader from 'LazyLoader';
import environment from 'environment';
import logger from 'logger';

const MAX_FILES_OPTION = { maxFiles: 20 };

const DEFAULT_SETTINGS = {
  policy: environment.settings.filepicker.policy,
  signature: environment.settings.filepicker.signature,
  // Enable all filepicker services except cropping step before upload ('CONVERT').
  services: ['ALFRESCO', 'BOX', 'CLOUDDRIVE', 'COMPUTER', 'DROPBOX', 'FACEBOOK',
    'GITHUB', 'GOOGLE_DRIVE', 'FLICKR', 'EVERNOTE', 'GMAIL', 'INSTAGRAM',
    'SKYDRIVE', 'IMAGE_SEARCH', 'URL', 'WEBCAM', 'VIDEO', 'PICASA', 'FTP',
    'WEBDAV', 'CLOUDAPP', 'IMGUR']
};

const loadedScript = LazyLoader.get('filepicker').then(setup);

export function makeDropPane (dropPane, options = {}) {
  return loadedScript.then((filepicker) => {
    options = newSettings(options);
    return filepicker.makeDropPane(dropPane, options);
  });
}

export function pick (options = {}) {
  return loadedScript.then((filepicker) => {
    const deferred = $q.defer();
    options = newSettings(options);
    filepicker.pick(
      options,
      makeFPCb(deferred, 'resolve'),
      makeFPCb(deferred, 'reject')
    );

    return deferred.promise
      .catch((fpError) => {
        handleFailure('pick', fpError);
        return $q.reject(fpError);
      });
  });
}

export function pickMultiple (options = {}) {
  return loadedScript.then((filepicker) => {
    const deferred = $q.defer();
    options = newSettings(options, MAX_FILES_OPTION);

    filepicker.pickMultiple(
      options,
      makeFPCb(deferred, 'resolve'),
      makeFPCb(deferred, 'reject')
    );

    return deferred.promise
      .catch(function (fpError) {
        handleFailure('pickMultiple', fpError);
        return $q.reject(fpError);
      });
  });
}

export function store (newURL, file) {
  return loadedScript.then((filepicker) => {
    const deferred = $q.defer();
    filepicker.store(
      {
        url: newURL,
        filename: file.fileName,
        mimetype: file.contentType,
        isWriteable: true,
        size: file.details.size
      },
      newSettings(),
      makeFPCb(deferred, 'resolve'),
      makeFPCb(deferred, 'reject')
    );
    return deferred.promise;
  });
}

export function parseFPFile (FPFile) {
  return FPFile ? {
    upload: FPFile.url,
    fileName: FPFile.filename,
    contentType: FPFile.mimetype
  } : null;
}

export function isUserClosedDialogError (fpError) {
  return fpError && fpError.code === 101;
}

function newSettings (...options) {
  return Object.assign({}, DEFAULT_SETTINGS, ...options);
}

function makeFPCb (deferred, method) {
  return (val) => {
    $rootScope.$apply(function () {
      deferred[method](val);
    });
  };
}

function handleFailure (fnName, fpError) {
  if (!isUserClosedDialogError(fpError)) {
    logger.logWarn(`filepicker.${fnName}() failed`, {
      fpError,
      // Choose this hash so new events still get grouped with old events.
      groupingHash: 'Error while picking file'
    });
  }
}

function setup (filepicker) {
  filepicker.setKey(environment.settings.filepicker.api_key);
  if (environment.env === 'development') {
    LazyLoader.get('filepickerDebug');
  }
  return filepicker;
}
