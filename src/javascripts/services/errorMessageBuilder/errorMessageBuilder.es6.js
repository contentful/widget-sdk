import _ from 'lodash';
import moment from 'moment';
import { joinAnd } from 'utils/StringUtils.es6';
import { getGroupNames } from '@contentful/mimetype';
import baseErrorMessageBuilder from './baseErrorMessageBuilder.es6';

const mimetypeGroupNames = getGroupNames();

const messages = {
  linkMimetypeGroup: function(error) {
    const labels = _.map(error.mimetypeGroupName, name => '“' + mimetypeGroupNames[name] + '”');
    return '' + joinAnd(labels) + ' are the only acceptable file types';
  },

  linkContentType: function(error, ctRepo) {
    const ct = ctRepo.get(error.contentTypeId);
    if (ct) {
      return 'Linked Entry’s content type must be ' + ct.getName() + '.';
    } else {
      return 'Invalid content type';
    }
  },

  dateRange: function(error) {
    const dateFormat = 'lll';
    const min = error.min && moment(error.min).format(dateFormat);
    const max = error.max && moment(error.max).format(dateFormat);

    if (min && max) {
      return 'Please set a date between ' + min + ' and ' + max;
    } else if (min) {
      return 'Please set a time no earlier than ' + min;
    } else {
      return 'Please set a time no later than ' + max;
    }
  },

  type: function(error) {
    if (error.details && (error.type === 'Validation' || error.type === 'Text')) {
      return error.details;
    } else if (error.type === 'Symbol') {
      return baseErrorMessageBuilder.stringLength(null, 256);
    } else if (error.type.match(/^aeio/i)) {
      return 'Must be an ' + error.type + '.';
    } else {
      return 'Must be a ' + error.type + '.';
    }
  },

  notResolvable: function(error) {
    const type = _.get(error, 'link.linkType') || 'Entity';
    return 'Linked ' + type + ' does not exist';
  },

  unknown: function(error) {
    if (error.path.length === 3 && error.path[0] === 'fields') {
      return 'This field is not localized and should not contain a value.';
    } else if (error.path.length === 2 && error.path[0] === 'fields') {
      return 'Unknown field.';
    } else {
      return 'Unkown property.';
    }
  }
};

function customMessage(error) {
  return error.customMessage;
}

function buildErrorMessage(error, ctRepo) {
  let getMessage;
  if (error.customMessage) {
    getMessage = customMessage;
  } else {
    getMessage = messages[error.name] || baseErrorMessageBuilder;
  }
  return getMessage(error, ctRepo);
}

function buildContentTypeError(error) {
  if (error.name === 'size' && error.path.length === 1 && error.path[0] === 'fields') {
    return 'You have reached the maximum number of ' + error.max + ' fields per content type.';
  }
  if (error.name === 'uniqueFieldIds') {
    return 'Field ID must be unique';
  }
  if (error.name === 'uniqueFieldApiNames') {
    return 'Field API Name must be unique';
  }
  if (error.name === 'regexp' && error.path[2] === 'apiName') {
    return 'Please provide input that only contains letters and digits';
  } else {
    return buildErrorMessage(error);
  }
}

function buildAssetError(error) {
  if (
    error.name === 'required' &&
    error.path.length === 4 &&
    error.path[1] === 'file' &&
    error.path[3] === 'url'
  ) {
    return 'Cannot publish until processing has finished';
  } else {
    return buildErrorMessage(error);
  }
}

function errorMessageBuilder(ctRepo) {
  return error => buildErrorMessage(error, ctRepo);
}

errorMessageBuilder.forContentType = buildContentTypeError;
errorMessageBuilder.forAsset = buildAssetError;

export default errorMessageBuilder;
