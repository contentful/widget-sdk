import {get} from 'lodash';
import * as Filestack from 'services/Filestack';
import openInputDialog from 'app/InputDialog';

const ratio = file => `${file.details.image.width}:${file.details.image.height}`;
const ratioNumber = file => file.details.image.width / file.details.image.height;
const url = (file, qs) => `https:${file.url}${qs ? ('?' + qs) : ''}`;

const NUMBER_REGEX = /^[1-9][0-9]{0,3}$/;
const RATIO_REGEX = /^[1-9][0-9]{0,3}:[1-9][0-9]{0,3}$/;

const RESIZE_MODES = {
  width: file => ({
    initialValue: `${file.details.image.width}`,
    regex: NUMBER_REGEX,
    title: 'Please provide desired width',
    message: `
      Expected value is a number of pixels between 1 and 9999.
      Provided value will be used as a new width of your image.
      Its height will be automatically computed to maintain the original aspect ratio.
    `,
    valueToUrl: value => url(file, `w=${value}`)
  }),
  height: file => ({
    initialValue: `${file.details.image.height}`,
    regex: NUMBER_REGEX,
    title: 'Please provide desired height',
    message: `
      Expected value is a number of pixels between 1 and 9999.
      Provided value will be used as a new height of your image.
      Its width will be automatically computed to maintain the original aspect ratio.
    `,
    valueToUrl: value => url(file, `h=${value}`)
  }),
  scale: file => ({
    initialValue: ratio(file),
    regex: RATIO_REGEX,
    title: 'Please provide desired dimensions',
    message: `
      Expected format is <code>{width}:{height}</code>.
      Both <code>{width}</code> and <code>height</code> should be numbers between 1 and 9999.
      Your image will be scaled without maintaining the original aspect ratio.
      The form is prepopulated with current dimensions of your image.
    `,
    valueToUrl: value => {
      const [w, h] = value.split(':');
      return url(file, `w=${w}&h=${h}&fit=scale`);
    }
  })
};

export function rotateOrMirror (mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  return Filestack.rotateOrMirrorImage(mode, url(file));
}

export function resize (mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  mode = RESIZE_MODES[mode];
  if (!mode) {
    throw new Error('Unknown resize mode.');
  }

  const {initialValue, regex, title, message, valueToUrl} = mode(file);

  return openInputDialog({
    input: {value: initialValue, regex},
    title,
    message,
    confirmLabel: 'Resize image'
  }).promise.then(valueToUrl);
}

export function crop (mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  if (mode === 'custom') {
    return cropWithCustomAspectRatio(file);
  } else {
    return Filestack.cropImage(
      mode === 'original' ? ratioNumber(file) : mode,
      url(file)
    );
  }
}

function cropWithCustomAspectRatio (file) {
  return openInputDialog({
    input: {
      value: ratio(file),
      regex: RATIO_REGEX
    },
    title: 'Please provide desired aspect ratio',
    message: `
      Expected format is <code>{width}:{height}</code>.
      Both <code>{width}</code> and <code>height</code> should be numbers between 1 and 9999.
      The form is prepopulated with the aspect ratio of your image.
    `,
    confirmLabel: 'Crop with provided aspect ratio'
  }).promise
  .then(ratio => {
    const [w, h] = ratio.split(':');
    const parsedRatio = parseInt(w, 10) / parseInt(h, 10);
    return Filestack.cropImage(parsedRatio, url(file));
  });
}

function isValidImage (file = {}) {
  const img = get(file, ['details', 'image']) || {};
  const hasDimensions = typeof img.width === 'number' && typeof img.height === 'number';
  return typeof file.url === 'string' && hasDimensions;
}
