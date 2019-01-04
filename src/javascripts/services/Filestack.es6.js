import _ from 'lodash';
import { getModule } from 'NgRegistry.es6';

const environment = getModule('environment');

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

function init() {
  return new Promise(resolve =>
    require.ensure(['filestack-js'], require => {
      const filestack = require('filestack-js');
      const { apiKey, policy, signature } = environment.settings.filestack;
      resolve(filestack.init(apiKey, { security: { policy, signature } }));
    })
  );
}

let rootIdCounter = 0;

function pickOptions(options) {
  rootIdCounter += 1;
  return Object.assign(
    {
      fromSources: SOURCES,
      rootId: `__filestack-picker-root-${rootIdCounter}`
    },
    options
  );
}

function prepareUploadedFile(uploaded) {
  return {
    upload: uploaded.url,
    fileName: uploaded.filename,
    contentType: uploaded.mimetype
  };
}

function handleOneUploaded({ filesUploaded }) {
  const first = filesUploaded[0];
  if (filesUploaded.length === 1 && first) {
    return prepareUploadedFile(first);
  } else {
    return Promise.reject(new Error('Expected 1 file to be successfully uploaded.'));
  }
}

export async function makeDropPane({ id, onSuccess }) {
  const client = await init();
  return client
    .picker({
      container: id,
      displayMode: 'dropPane',
      dropPane: {
        id,
        customText: 'Drag and drop a file to upload…',
        disableClick: true,
        overlay: false,
        onSuccess: filesUploaded => {
          const first = filesUploaded[0];
          if (filesUploaded.length === 1 && first) {
            onSuccess(prepareUploadedFile(first));
          }
        }
      }
    })
    .open();
}

export function pick() {
  return new Promise(async function(resolve) {
    const client = await init();
    client
      .picker(
        pickOptions({
          disableTransformer: true,
          startUploadingWhenMaxFilesReached: true,
          onUploadDone: ({ filesUploaded }) => resolve(handleOneUploaded({ filesUploaded }))
        })
      )
      .open();
  });
}

export async function pickMultiple() {
  return new Promise(async function(resolve, reject) {
    const client = await init();
    return client
      .picker(
        pickOptions({
          maxFiles: MAX_FILES,
          onUploadDone: ({ filesFailed, filesUploaded }) => {
            if (filesFailed.length < 1 || filesUploaded.length > 0) {
              resolve(filesUploaded.map(prepareUploadedFile));
            } else {
              reject(new Error('Some files failed uploading.'));
            }
          }
        })
      )
      .open();
  });
}

export async function store(imageUrl) {
  const client = await init();
  const result = await client.storeURL(imageUrl);
  return result.url;
}

export async function cropImage(mode, imageUrl) {
  return new Promise(async function(resolve) {
    const transformations = { crop: false, circle: false, rotate: false };
    if (typeof mode === 'number') {
      transformations.crop = { aspectRatio: mode };
    } else if (mode === 'circle') {
      transformations.circle = true;
    } else {
      transformations.crop = true;
    }

    const client = await init();
    const picker = client.picker(
      pickOptions({
        transformations,
        onUploadDone: ({ filesUploaded }) => resolve(handleOneUploaded({ filesUploaded })),
        onCancel: () => resolve(null)
      })
    );
    picker.crop([imageUrl]);
  });
}

export async function rotateOrMirrorImage(mode, imageUrl) {
  const options = {
    '90cw': { rotate: { deg: 90 } },
    '90ccw': { rotate: { deg: 90 * 3 } },
    flip: { flip: true },
    flop: { flop: true }
  }[mode];

  const client = await init();
  return store(client.transform(imageUrl, options));
}
