import LazyLoader from 'LazyLoader';
import environment from 'environment';

const MAX_FILES = 20;

const SOURCES = [
  'local_file_system',
  'url',
  'imagesearch',
  'facebook',
  'instagram',
  'googledrive',
  'dropbox',
  'webcam',
  'video',
  'audio',
  'evernote',
  'flickr',
  'box',
  'github',
  'gmail',
  'picasa',
  'onedrive',
  'onedriveforbusiness',
  'clouddrive'
];

function ensureScript () {
  return LazyLoader.get('filestack').then(filestack => {
    const {apiKey, policy, signature} = environment.settings.filestack;
    return filestack.init(apiKey, {policy, signature});
  });
}

let rootIdCounter = 0;
function pickOptions (options) {
  rootIdCounter += 1;
  return Object.assign({
    fromSources: SOURCES,
    rootId: `__filestack-picker-root-${rootIdCounter}`
  }, options);
}

function prepareUploadedFile (uploaded) {
  return {
    upload: uploaded.url,
    fileName: uploaded.filename,
    contentType: uploaded.mimetype
  };
}

function handleOneUploaded ({filesUploaded}) {
  const first = filesUploaded[0];
  if (filesUploaded.length === 1 && first) {
    return prepareUploadedFile(first);
  } else {
    return Promise.reject(new Error('Expected 1 file to be successfully uploaded.'));
  }
}

export function makeDropPane ({id, onSuccess}) {
  return ensureScript()
  .then(filestack => {
    return filestack.makeDropPane({
      id,
      customText: 'Drag and drop a file to upload...',
      disableClick: true,
      overlay: false,
      onSuccess: filesUploaded => {
        const first = filesUploaded[0];
        if (filesUploaded.length === 1 && first) {
          onSuccess(prepareUploadedFile(first));
        }
      }
    }, pickOptions());
  });
}

export function pick () {
  return ensureScript()
  .then(filestack => filestack.pick(pickOptions({
    disableTransformer: true,
    startUploadingWhenMaxFilesReached: true
  })))
  .then(handleOneUploaded);
}

export function pickMultiple () {
  return ensureScript()
  .then(filestack => filestack.pick(pickOptions({maxFiles: MAX_FILES})))
  .then(({filesFailed, filesUploaded}) => {
    if (filesFailed.length < 1 || filesUploaded.length > 0) {
      return filesUploaded.map(prepareUploadedFile);
    } else {
      return Promise.reject(new Error('Some files failed uploading.'));
    }
  });
}

export function editFile (imageUrl) {
  return ensureScript()
  .then(filestack => filestack.cropFiles([imageUrl], pickOptions()))
  .then(handleOneUploaded);
}

export function store (imageUrl) {
  return ensureScript()
  .then(filestack => filestack.storeURL(imageUrl))
  .then(result => result.url);
}
