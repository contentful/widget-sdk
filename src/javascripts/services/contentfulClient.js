import _ from 'lodash';
import qs from 'qs';

const parseableResourceTypes = {
  Asset: Asset,
  ContentType: ContentType,
  Entry: Entry,
  Space: Space,
};

/**
 * This is a fork of an old version of https://github.com/contentful/contentful.js which allows us to use Contentful
 * as if it were an external service. As such it might not reflect other patterns present throughout the app.
 *
 * It's been modified to make use of the CMA instead, with the X-Contentful-Skip-Transformation header.
 *
 * @param {Object} params
 * @returns {Client}
 *
 * @deprecated
 * This client uses `X-Contentful-Skip-Transformation` for CMA requests which exposes internal IDs, something we
 * generally want to avoid in the web app now. Use {data/APIClient} instead e.g. via `spaceContext.cma` or
 * `sdk.space` wherever possible.
 */
export default function newClient(params) {
  return new Client(params);
}

function Client(options) {
  enforcep(options, 'host');
  enforcep(options, 'accessToken');
  enforcep(options, 'space');

  this.options = _.defaults({}, options, {
    secure: true,
  });
}

Client.prototype.request = function (path, options = {}) {
  const protocol = this.options.secure ? 'https' : 'http';
  const [host] = this.options.host.split(':');
  const port = this.options.secure ? '443' : '80';
  const spaceOptions = this.options.space;
  const params = _.isEmpty(options?.params) ? '' : `?${qs.stringify(options.params)}`;
  const url = `${protocol}://${host}:${port}/spaces/${spaceOptions}${path}${params}`;

  const config = {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/vnd.contentful.delivery.v1+json',
      'X-Contentful-Skip-Transformation': true,
      Authorization: `Bearer ${this.options.accessToken}`,
    },
  };

  return window.fetch(url, config).then((response) => {
    const json = response.json();

    return response.ok ? json : Promise.reject(json);
  });
};

Client.prototype.asset = function (id) {
  return this.request('/assets/' + id).then(Asset.parse);
};

Client.prototype.assets = function (object) {
  const params = Query.parse(object);
  return this.request('/assets', { params: params }).then(_.partial(SearchResult.parse, Asset));
};

Client.prototype.contentType = function (id) {
  return this.request('/content_types/' + id).then(ContentType.parse);
};

Client.prototype.contentTypes = function (object) {
  const params = Query.parse(object);
  return this.request('/content_types', { params: params }).then(
    _.partial(SearchResult.parse, ContentType)
  );
};

Client.prototype.entry = function (id) {
  return this.request('/entries/' + id).then(Entry.parse);
};

Client.prototype.entries = function (object) {
  const params = Query.parse(object);
  return this.request('/entries', { params: params }).then(_.partial(SearchResult.parse, Entry));
};

Client.prototype.space = function () {
  return this.request('');
};

function Asset() {}

Asset.parse = (object) =>
  _.extend(new Asset(), {
    sys: Sys.parse(object.sys),
    fields: object.fields,
  });

function Entry() {}

Entry.parse = (object) =>
  _.extend(new Entry(), {
    sys: Sys.parse(object.sys),
    fields: object.fields,
  });

function ContentType() {}

ContentType.parse = (object) =>
  _.extend(
    new ContentType(),
    {
      sys: Sys.parse(object.sys),
      fields: object.fields.map(Field.parse),
    },
    _.pick(object, ['name', 'displayField'])
  );

function Field() {}

Field.parse = (object) => _.extend(new Field(), object);

function SearchResult() {}

SearchResult.parse = (_ItemType, object) => {
  walkMutate(object, isParseableResource, parseResource);
  const items = resolveResponse(object);
  defineProperty(items, 'limit', object.limit);
  defineProperty(items, 'skip', object.skip);
  defineProperty(items, 'total', object.total);
  return items;
};

function Query() {}

Query.prototype.toQueryString = function () {
  return qs.stringify(this);
};

Query.parse = (object) => _.extend(new Query(), stringifyArrayValues(object));

function Space() {}

Space.parse = (object) => _.extend(new Space(), object);

function Sys() {}

Sys.parse = (object) =>
  _.extend(
    new Sys(),
    _.pick(object, ['id', 'revision', 'type', 'locale']),
    compacto({
      contentType: object.contentType && Link.parse(object.contentType),
      createdAt: object.createdAt && new Date(object.createdAt),
      linkType: object.linkType,
      updatedAt: object.updatedAt && new Date(object.updatedAt),
      space: object.space && Link.parse(object.space),
    })
  );

function Link() {}

Link.parse = (object) =>
  _.extend(new Link(), {
    sys: Sys.parse(object.sys),
  });

function defineProperty(obj, key, value) {
  if (_.isFunction(Object.defineProperty)) {
    Object.defineProperty(obj, key, { enumerable: false, value: value });
  } else {
    obj[key] = value;
  }
}

function exists(value) {
  /* jshint eqnull:true */
  return value != null;
}

function truthy(value) {
  return value !== false && exists(value);
}

function compacto(object) {
  return _.reduce(
    object,
    (compacted, value, key) => {
      if (truthy(value)) compacted[key] = value;
      return compacted;
    },
    {}
  );
}

function enforcep(object, property) {
  if (!exists(object[property])) {
    throw new TypeError('Expected property ' + property);
  }
}

function isParseableResource(object) {
  return (
    _.isObject(object) &&
    _.isObject(object.sys) &&
    'type' in object.sys &&
    object.sys.type in parseableResourceTypes
  );
}

function parseResource(resource) {
  const Type = parseableResourceTypes[resource.sys.type];
  return Type.parse(resource);
}

function stringifyArrayValues(object) {
  return _.reduce(
    object,
    (object, value, key) => {
      object[key] = _.isArray(value) ? value.join(',') : value;
      return object;
    },
    {}
  );
}

function walkMutate(input, pred, mutator) {
  if (pred(input)) {
    return mutator(input);
  }

  if (_.isArray(input) || _.isObject(input)) {
    _.each(input, (item, key) => {
      input[key] = walkMutate(item, pred, mutator);
    });
    return input;
  }

  return input;
}

function resolveResponse(response) {
  walkMutate(response, isLink, (link) => getLink(response, link) || link);
  return response.items || [];
}

function isLink(object) {
  return _.get(object, 'sys.type') === 'Link';
}

function getLink(response, link) {
  const type = link.sys.linkType;
  const id = link.sys.id;
  const pred = (resource) => resource.sys.type === type && resource.sys.id === id;
  return (
    _.find(response.items, pred) || (response.includes && _.find(response.includes[type], pred))
  );
}
