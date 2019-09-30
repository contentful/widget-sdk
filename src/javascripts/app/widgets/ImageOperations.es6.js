import { get } from 'lodash';
import React from 'react';
import * as Filestack from 'services/Filestack.es6';
import { openInputDialog } from 'app/InputDialogComponent.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as HostnameTransformer from '@contentful/hostname-transformer';

const ratio = file => `${file.details.image.width}:${file.details.image.height}`;
const ratioNumber = file => file.details.image.width / file.details.image.height;
const url = (file, qs) => `https:${externalImageUrl(file.url)}${qs ? '?' + qs : ''}`;

const NUMBER_REGEX = /^[1-9][0-9]{0,3}$/;
const RATIO_REGEX = /^[1-9][0-9]{0,3}:[1-9][0-9]{0,3}$/;

const RESIZE_MODES = {
  width: file => ({
    initialValue: `${file.details.image.width}`,
    regex: NUMBER_REGEX,
    title: 'Set width',
    message: `
      The original aspect ratio is maintained when a new width is set.
    `,
    valueToUrl: value => url(file, `w=${value}&fit=scale`)
  }),
  height: file => ({
    initialValue: `${file.details.image.height}`,
    regex: NUMBER_REGEX,
    title: 'Set height',
    message: `
      The original aspect ratio is maintained when a new height is set.
    `,
    valueToUrl: value => url(file, `h=${value}&fit=scale`)
  }),
  scale: file => ({
    initialValue: ratio(file),
    regex: RATIO_REGEX,
    title: 'Please provide desired dimensions',
    message: (
      <>
        Expected format is <code>width:height</code>. Both <code>width</code> and{' '}
        <code>height</code> should be numbers between 1 and 9999. Your image will be scaled without
        maintaining the original aspect ratio. The form is prepopulated with current dimensions of
        your image.
      </>
    ),
    valueToUrl: value => {
      const [w, h] = value.split(':');
      return url(file, `w=${w}&h=${h}&fit=scale`);
    }
  })
};

export function rotateOrMirror(mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  return Filestack.rotateOrMirrorImage(mode, url(file));
}

export function resize(mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  mode = RESIZE_MODES[mode];
  if (!mode) {
    throw new Error('Unknown resize mode.');
  }

  const { initialValue, regex, title, message, valueToUrl } = mode(file);

  return openInputDialog(
    {
      title,
      message,
      confirmLabel: 'Resize image',
      intent: 'positive',
      isValid: value => {
        return regex.test(value);
      }
    },
    initialValue
  ).then(value => {
    if (value) {
      return valueToUrl(value);
    }
  });
}

export function crop(mode, file) {
  if (!isValidImage(file)) {
    return Promise.reject(new Error('Expected an image.'));
  }

  if (mode === 'custom') {
    return cropWithCustomAspectRatio(file);
  } else {
    return Filestack.cropImage(mode === 'original' ? ratioNumber(file) : mode, url(file));
  }
}

function cropWithCustomAspectRatio(file) {
  return openInputDialog(
    {
      confirmLabel: 'Please provide desired aspect ratio',
      intent: 'positive',
      isValid: value => {
        return RATIO_REGEX.test(value);
      },
      title: 'Please provide desired aspect ratio',
      message: (
        <>
          Expected format is <code>width:height</code>. Both <code>width</code> and{' '}
          <code>height</code> should be numbers between 1 and 9999. The form is prepopulated with
          the aspect ratio of your image.
        </>
      )
    },
    ratio(file)
  ).then(ratio => {
    if (ratio) {
      const [w, h] = ratio.split(':');
      const parsedRatio = parseInt(w, 10) / parseInt(h, 10);
      return Filestack.cropImage(parsedRatio, url(file));
    }
  });
}

function isValidImage(file = {}) {
  const img = get(file, ['details', 'image']) || {};
  const hasDimensions = typeof img.width === 'number' && typeof img.height === 'number';
  return typeof file.url === 'string' && hasDimensions;
}

// Normalizes image URL to internal Contentful Images API URL.
// Transforms to external domain configured for oganization.
function externalImageUrl(url) {
  const domains = TokenStore.getDomains();
  const internalUrl = HostnameTransformer.toInternal(url, domains);

  // Enforce use of images domain
  return HostnameTransformer.toExternal(internalUrl, {
    assets: domains.images,
    images: domains.images
  });
}
