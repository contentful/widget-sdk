'use strict';

angular.module('contentful').factory('contentfulClient', ['$injector', function ($injector) {
  /*
   * This module is a fork of https://github.com/contentful/contentful.js which allows us to use Contentful
   * as if it were an external service. As such it might not reflect other patterns present throughout the app.
   *
   * It's been modified to use Angular's $http for requests and with some smaller features removed.
   *
   * It's also been modified to make use of the CMA instead, with the X-Contentful-Skip-Transformation header.
  */

  var $http       = $injector.get('$http');
  var $q          = $injector.get('$q');
  var querystring = $injector.get('querystring');

  var parseableResourceTypes = {
    Asset: Asset,
    ContentType: ContentType,
    Entry: Entry,
    Space: Space
  };

  function Client(options) {
    enforcep(options, 'host');
    enforcep(options, 'accessToken');
    enforcep(options, 'space');

    this.options = _.defaults({}, options, {
      secure: true
    });
  }

  Client.prototype.request = function(path, options) {
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
  };

  Client.prototype.asset = function(id) {
    return this.request('/assets/' + id).then(Asset.parse);
  };

  Client.prototype.assets = function(object) {
    var params = Query.parse(object);
    return this.request('/assets', {params: params})
      .then(_.partial(SearchResult.parse, Asset));
  };

  Client.prototype.contentType = function(id) {
    return this.request('/content_types/' + id)
      .then(ContentType.parse);
  };

  Client.prototype.contentTypes = function(object) {
    var params = Query.parse(object);
    return this.request('/content_types', {params: params})
      .then(_.partial(SearchResult.parse, ContentType));
  };

  Client.prototype.editingInterface = function(contentTypeId, id) {
    return this.request('/content_types/'+ contentTypeId +'/editor_interfaces/'+ id);
  };

  Client.prototype.entry = function(id) {
    return this.request('/entries/' + id)
      .then(Entry.parse);
  };

  Client.prototype.entries = function(object) {
    var params = Query.parse(object);
    return this.request('/entries', {params: params})
      .then(_.partial(SearchResult.parse, Entry));
  };

  Client.prototype.space = function() {
    return this.request('');
  };

  function Asset() {}

  Asset.parse = function(object) {
    return _.extend(new Asset(), {
      sys: Sys.parse(object.sys),
      fields: object.fields
    });
  };

  function Entry() {}

  Entry.parse = function(object) {
    return _.extend(new Entry(), {
      sys: Sys.parse(object.sys),
      fields: object.fields
    });
  };

  function ContentType() {}

  ContentType.parse = function(object) {
    return _.extend(new ContentType(), {
      sys: Sys.parse(object.sys),
      fields: object.fields.map(Field.parse)
    }, _.pick(object, ['name', 'displayField']));
  };

  function Field() {}

  Field.parse = function(object) {
    return _.extend(new Field(), object);
  };

  function SearchResult() {}

  SearchResult.parse = function(ItemType, object) {
    walkMutate(object, isParseableResource, parseResource);
    var items = resolveResponse(object);
    defineProperty(items, 'limit', object.limit);
    defineProperty(items, 'skip', object.skip);
    defineProperty(items, 'total', object.total);
    return items;
  };

  function Query() {}

  Query.prototype.toQueryString = function() {
    return querystring.stringify(this);
  };

  Query.parse = function(object) {
    return _.extend(new Query(), stringifyArrayValues(object));
  };

  function Space() {}

  Space.parse = function(object) {
    return _.extend(new Space(), object);
  };

  function Sys() {}

  Sys.parse = function(object) {
    return _.extend(
      new Sys(),
      _.pick(object, ['id', 'revision', 'type', 'locale']),
      compacto({
        contentType: object.contentType && Link.parse(object.contentType),
        createdAt: object.createdAt && new Date(object.createdAt),
        linkType: object.linkType,
        updatedAt: object.updatedAt && new Date(object.updatedAt),
        space: object.space && Link.parse(object.space)
      })
    );
  };

  function Link() {}

  Link.parse = function(object) {
    return _.extend(new Link(), {
      sys: Sys.parse(object.sys)
    });
  };

  return {
    newClient: function (params) {
      return new Client(params);
    }
  };

  function defineProperty(obj, key, value) {
    if (_.isFunction(Object.defineProperty)) {
      Object.defineProperty(obj, key, { enumerable: false, value: value });
    } else {
      obj[key] = value;
    }
  }

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

  function resolveResponse(response) {
    walkMutate(response, isLink, function(link) {
      return getLink(response, link) || link;
    });
    return response.items || [];
  }

  function isLink(object) {
    return dotty.get(object, 'sys.type') === 'Link';
  }

  function getLink(response, link) {
    var type = link.sys.linkType;
    var id = link.sys.id;
    var pred = function(resource) {
      return resource.sys.type === type && resource.sys.id === id;
    };
    return _.find(response.items, pred) ||
      response.includes && _.find(response.includes[type], pred);
  }

}]);
