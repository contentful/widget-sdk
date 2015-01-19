'use strict';

angular.module('contentful').provider('contentfulClient', ['$injector', function ContentfulClientProvider($injector) {
  /*
   * This module is a fork of https://github.com/contentful/contentful.js which allows us to use Contentful
   * as if it were an external service. As such it might not reflect other patterns present throughout the app.
   *
   * It's been modified to use Angular's $http for requests and with some smaller features removed.
   *
   * It's also been modified to make use of the CMA instead, with the X-Contentful-Skip-Transformation header.
  */

  var redefine = $injector.get('redefine');
  var $http, $q, resolveResponse, querystring;

  var Client = redefine.Class({
    constructor: function Client(options) {
      enforcep(options, 'host');
      enforcep(options, 'accessToken');
      enforcep(options, 'space');

      this.options = _.defaults({}, options, {
        secure: true
      });
    },

    request: function(path, options) {
      if (!options) options = {};
      if (!options.headers) options.headers = {};
      if (!options.params) options.params = {};
      options.headers['Content-Type'] = 'application/vnd.contentful.delivery.v1+json';
      options.headers['X-Contentful-Skip-Transformation'] = true;
      options.params.access_token = this.options.accessToken;

      options.url = [
        this.options.secure ? 'https' : 'http',
        '://',
        _.first(this.options.host.split(':')),
        ':',
        this.options.secure ? '443' : '80',
        '/spaces/',
        this.options.space,
        path
      ].join('');

      return $http(options)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        return $q.reject(error.data);
      });
    },

    asset: function(id) {
      return this.request('/assets/' + id).then(Asset.parse);
    },

    assets: function(object) {
      var params = Query.parse(object);
      return this.request('/assets', {params: params})
        .then(_.partial(SearchResult.parse, Asset));
    },

    contentType: function(id) {
      return this.request('/content_types/' + id)
        .then(ContentType.parse);
    },

    contentTypes: function(object) {
      var params = Query.parse(object);
      return this.request('/content_types', {params: params})
        .then(_.partial(SearchResult.parse, ContentType));
    },

    editingInterface: function (contentTypeId, id) {
      return this.request('/content_types/'+ contentTypeId +'/editor_interfaces/'+ id);
    },

    entry: function(id) {
      return this.request('/entries/' + id)
        .then(Entry.parse);
    },

    entries: function(object) {
      var params = Query.parse(object);
      return this.request('/entries', {params: params})
        .then(_.partial(SearchResult.parse, Entry));
    },

    space: function() {
      return this.request('');
    }
  });

  var Asset = redefine.Class({
    constructor: function Asset() {},

    statics: {
      parse: function(object) {
        return _.extend(new Asset(), {
          sys: Sys.parse(object.sys),
          fields: object.fields
        });
      }
    }
  });

  var Entry = redefine.Class({
    constructor: function Entry() {},

    statics: {
      parse: function(object) {
        return _.extend(new Entry(), {
          sys: Sys.parse(object.sys),
          fields: object.fields
        });
      }
    }
  });

  var ContentType = redefine.Class({
    constructor: function ContentType() {},

    statics: {
      parse: function(object) {
        return _.extend(new ContentType(), {
          sys: Sys.parse(object.sys),
          fields: object.fields.map(Field.parse),
        }, _.pick(object, 'name', 'displayField'));
      }
    }
  });

  var Field = redefine.Class({
    constructor: function Field() {},

    statics: {
      parse: function(object) {
        return _.extend(new Field(), object);
      }
    }
  });

  var SearchResult = redefine.Class({
    constructor: function SearchResult() {},

    statics: {
      parse: function(ItemType, object) {
        walkMutate(object, isParseableResource, parseResource);
        var items = resolveResponse(object);
        return redefine(
          items, {
            limit: object.limit,
            skip: object.skip,
            total: object.total
          }, {
            enumerable: false
          }
        );
      }
    }
  });

  var Query = redefine.Class({
    constructor: function Query() {},

    toQueryString: function() {
      return querystring.stringify(this);
    },

    statics: {
      parse: function(object) {
        return _.extend(new Query(), stringifyArrayValues(object));
      },
    }
  });

  var Space = redefine.Class({
    constructor: function Space() {},

    statics: {
      parse: function(object) {
        return _.extend(new Space(), object);
      }
    }
  });

  var Sys = redefine.Class({
    constructor: function Sys() {},

    statics: {
      parse: function(object) {
        return _.extend(
          new Sys(),
          _.pick(object, 'id', 'revision', 'type', 'locale'),
          compacto({
            contentType: object.contentType && Link.parse(object.contentType),
            createdAt: object.createdAt && new Date(object.createdAt),
            linkType: object.linkType,
            updatedAt: object.updatedAt && new Date(object.updatedAt),
            space: object.space && Link.parse(object.space)
          })
        );
      }
    }
  });

  var Link = redefine.Class({
    constructor: function Link() {},

    statics: {
      parse: function(object) {
        return _.extend(new Link(), {
          sys: Sys.parse(object.sys)
        });
      }
    }
  });

  var parseableResourceTypes = {
    Asset: Asset,
    ContentType: ContentType,
    Entry: Entry,
    Space: Space
  };

  this.$get = ['$injector', function ($injector) {
    $http = $injector.get('$http');
    $q = $injector.get('$q');
    resolveResponse = $injector.get('resolveResponse');
    querystring = $injector.get('querystring');

    return {
      newClient: function (params) {
        return new Client(params);
      }
    };
  }];

  function exists(value) {
    /*jshint eqnull:true*/
    return value != null;
  }

  function truthy(value) {
    return (value !== false) && exists(value);
  }

  function compacto(object) {
    return _.reduce(object, function(compacted, value, key) {
      if (truthy(value)) compacted[key] = value;
      return compacted;
    }, {});
  }

  function enforcep(object, property) {
    if (!exists(object[property]))
      throw new TypeError('Expected property ' + property);
  }

  function isParseableResource(object) {
    return _.isObject(object) && _.isObject(object.sys) && 'type' in object.sys &&
      object.sys.type in parseableResourceTypes;
  }

  function parseResource(resource) {
    var Type = parseableResourceTypes[resource.sys.type];
    return Type.parse(resource);
  }

  function stringifyArrayValues(object) {
    return _.reduce(object, function(object, value, key) {
      object[key] = _.isArray(value) ? value.join(',') : value;
      return object;
    }, {});
  }

  function walkMutate(input, pred, mutator) {
    if (pred(input))
      return mutator(input);

    if (_.isArray(input) || _.isObject(input)) {
      _.each(input, function(item, key) {
        input[key] = walkMutate(item, pred, mutator);
      });
      return input;
    }

    return input;
  }

}]);
