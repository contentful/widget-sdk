import {toApiFieldType} from './FieldTypes';

const GITHUB_URL_PROPS = ['host', 'repo', 'branch', 'filepath'];

const ERRORS = {
  DESCRIPTOR: 'Could not fetch the descriptor file. Please check the URL and try again.',
  SRCDOC: 'Could not fetch the extension source. Please check if the descriptor is valid.',
  INVALID: 'The format of descriptor file is invalid.'
};

const nonEmptyString = s => typeof s === 'string' && s.length > 0;

export function isValidSource (parsed) {
  parsed = parsed || {};
  const onlyNonEmptyStrings = GITHUB_URL_PROPS.every(prop => nonEmptyString(parsed[prop]));
  if (onlyNonEmptyStrings) {
    return parsed.host.endsWith('github.com') && parsed.filepath.endsWith('extension.json');
  } else {
    return false;
  }
}

export function fetchExtension ({repo, branch, filepath}) {
  const descriptorUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${filepath}`;

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
  .then(([{name, fieldTypes, src, parameters}, srcdoc]) => {
    fieldTypes = Array.isArray(fieldTypes) ? fieldTypes.map(toApiFieldType) : [];
    const hosting = srcdoc ? {srcdoc} : {src};
    const extension = {name, fieldTypes, parameters, ...hosting};

    const hasCode = nonEmptyString(extension.src) || nonEmptyString(extension.srcdoc);
    const hasAtLeastOneFieldType = Array.isArray(fieldTypes) && fieldTypes.length > 0;

    if (nonEmptyString(extension.name) && hasCode && hasAtLeastOneFieldType) {
      return extension;
    } else {
      return Promise.reject(new Error(ERRORS.INVALID));
    }
  });
}
