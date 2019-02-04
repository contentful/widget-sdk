const createAutoCompletion = require('./auto-completion');
const mimetype = require('@contentful/mimetype');
const helpers = require('./helpers');
const _ = require('lodash');

// Factories for assets
module.exports = function(getAllUsers) {
  return {
    ...createAutoCompletion(getAllUsers),
    width: imageDimensionCompletion('width', 'Width of an image in pixels'),
    height: imageDimensionCompletion('height', 'Height of an image in pixels'),
    type: {
      description: 'The filetype of the item',
      complete: helpers.makeListCompletion(
        _.map(mimetype.getGroupNames(), (name, id) => ({
          value: id,
          description: name
        }))
      ),
      convert: function(_operator, value) {
        return { mimetype_group: value };
      }
    },
    size: {
      description: 'The filesize of the item',
      operators: helpers.makeOperatorList(['<', '<=', '==', '>=', '>']),
      convert: function(operator, value) {
        const query = {};
        value = helpers.sizeParser(value);
        query['fields.file.details.size' + helpers.queryOperator(operator)] = value;
        return query;
      }
    },
    filename: {
      description: 'The exact filename of the item',
      convert: function(_op, value) {
        return { 'fields.file.fileName': value };
      }
    }
  };
};

// Generates a factory for completing image dimensions (width, height)
function imageDimensionCompletion(key, description) {
  return {
    description: description,
    operators: helpers.makeOperatorList(['<', '<=', '==', '>=', '>']),
    convert: function(op, exp) {
      try {
        const query = {};
        query['fields.file.details.image.' + key + helpers.queryOperator(op)] = exp;
        return query;
      } catch (e) {
        return;
      }
    }
  };
}
