import baseErrorMessageBuilder from './baseErrorMessageBuilder.es6';

export default function buildMessage(error) {
  if (error.path && error.path[0] === 'apiName') {
    if (error.name === 'regexp' && error.value.match(/^\d/)) {
      return 'Please use a letter as the first character';
    }
    if (error.name === 'regexp') {
      return 'Please use only letters and numbers';
    }
    if (error.name === 'size') {
      return 'Please shorten the text so it’s no longer than 64 characters';
    }
    if (error.name === 'uniqueFieldId') {
      return 'A field with this ID already exists';
    }
  }
  return baseErrorMessageBuilder(error);
}
