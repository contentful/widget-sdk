import {toApiFieldType} from './FieldTypes';
import parseGithubUrl from 'parse-github-url';

const GITHUB_URL_PROPS = ['host', 'repo', 'branch', 'filepath'];

const ERRORS = {
  DESCRIPTOR: 'Could not fetch the descriptor file. Please check the URL and try again.',
  SRCDOC: 'Could not fetch the extension source. Please check if the descriptor is valid.',
  INVALID: 'The format of descriptor file is invalid.'
};

const nonEmptyString = s => typeof s === 'string' && s.length > 0;

function isValidGHUserContentUrl (url) {
  return url.startsWith('https://raw.githubusercontent.com/') && url.endsWith('extension.json');
}

function getDescriptorUrl (url) {
  if (isValidGHUserContentUrl(url)) {
    return url;
  } else {
    const {repo, branch, filepath} = parseGithubUrl(url) || {};
    return `https://raw.githubusercontent.com/${repo}/${branch}/${filepath}`;
  }
}

export function isValidSource (url) {
  url = (url || '').trim();

  if (isValidGHUserContentUrl(url)) {
    return true;
  }

  const parsed = parseGithubUrl(url) || {};
  const onlyNonEmptyStrings = GITHUB_URL_PROPS.every(prop => nonEmptyString(parsed[prop]));

  if (onlyNonEmptyStrings) {
    return parsed.host.endsWith('github.com') && parsed.filepath.endsWith('extension.json');
  } else {
    return false;
  }
}

export function fetchExtension (url) {
  const descriptorUrl = getDescriptorUrl((url || '').trim());

  return fetch(descriptorUrl)
  .then(res => {
    if (res.status >= 400) {
      return Promise.reject(new Error(ERRORS.DESCRIPTOR));
    } else {
      return res.json();
    }
  })
  .then(descriptor => {
    if (typeof descriptor.srcdoc === 'string') {
      const srcdocUrl = new URL(descriptor.srcdoc, descriptorUrl);
      return fetch(srcdocUrl.toString())
      .then(res => {
        if (res.status >= 400) {
          return Promise.reject(new Error(ERRORS.SRCDOC));
        } else {
          return Promise.all([descriptor, res.text()]);
        }
      });
    } else {
      return [descriptor, null];
    }
  })
  .then(([{name, fieldTypes, src, parameters, sidebar}, srcdoc]) => {
    fieldTypes = Array.isArray(fieldTypes) ? fieldTypes.map(toApiFieldType) : [];
    const hosting = srcdoc ? {srcdoc} : {src};
    const extension = {name, fieldTypes, parameters, sidebar: !!sidebar, ...hosting};

    const hasCode = nonEmptyString(extension.src) || nonEmptyString(extension.srcdoc);
    const hasAtLeastOneFieldType = Array.isArray(fieldTypes) && fieldTypes.length > 0;

    if (nonEmptyString(extension.name) && hasCode && hasAtLeastOneFieldType) {
      return extension;
    } else {
      return Promise.reject(new Error(ERRORS.INVALID));
    }
  });
}
