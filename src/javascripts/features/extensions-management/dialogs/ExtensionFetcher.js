import { toApiFieldType } from 'widgets/FieldTypes';
import gitUrlParse from 'git-url-parse';

const GITHUB_URL_PROPS = ['resource', 'full_name', 'ref', 'filepath'];

const ERRORS = {
  DESCRIPTOR: 'Could not fetch the descriptor file. Please check the URL and try again.',
  SRCDOC: 'Could not fetch the extension source. Please check if the descriptor is valid.',
  INVALID: 'The format of the descriptor file is invalid.',
};

const nonEmptyString = (s) => typeof s === 'string' && s.length > 0;

function isValidGHUserContentUrl(url) {
  return url.startsWith('https://raw.githubusercontent.com/') && url.endsWith('extension.json');
}

function isValidContentfulExtsUrl(url) {
  return /https:\/\/[^.\s]+\.contentfulexts\.com\/extension\.json/.test(url);
}

export function getDescriptorUrl(url) {
  if (isValidGHUserContentUrl(url) || isValidContentfulExtsUrl(url)) {
    return url;
  } else {
    const { full_name, ref, filepath } = gitUrlParse(url) || {};
    return `https://raw.githubusercontent.com/${full_name}/${ref}/${filepath}`;
  }
}

export function isValidSource(url) {
  url = (url || '').trim();

  if (isValidGHUserContentUrl(url) || isValidContentfulExtsUrl(url)) {
    return true;
  }

  const parsed = gitUrlParse(url) || {};
  const onlyNonEmptyStrings = GITHUB_URL_PROPS.every((prop) => nonEmptyString(parsed[prop]));

  if (onlyNonEmptyStrings) {
    return parsed.resource.endsWith('github.com') && parsed.filepath.endsWith('extension.json');
  } else {
    return false;
  }
}

export function fetchExtension(url) {
  const descriptorUrl = getDescriptorUrl((url || '').trim());

  return window
    .fetch(descriptorUrl)
    .then((res) => {
      if (res.status >= 400) {
        return Promise.reject(new Error(ERRORS.DESCRIPTOR));
      } else {
        return res.json();
      }
    })
    .then((descriptor) => {
      if (typeof descriptor.srcdoc === 'string') {
        const srcdocUrl = new URL(descriptor.srcdoc, descriptorUrl);
        return window.fetch(srcdocUrl.toString()).then((res) => {
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
    .then(([{ name, fieldTypes, src, parameters, sidebar }, srcdoc]) => {
      fieldTypes = Array.isArray(fieldTypes) ? fieldTypes.map(toApiFieldType) : [];
      const hosting = srcdoc ? { srcdoc } : { src };
      const extension = { name, fieldTypes, parameters, sidebar: !!sidebar, ...hosting };

      const hasName = nonEmptyString(extension.name);
      const hasCode = nonEmptyString(extension.src) || nonEmptyString(extension.srcdoc);
      const valid = hasName && hasCode;

      return valid ? extension : Promise.reject(new Error(ERRORS.INVALID));
    });
}
