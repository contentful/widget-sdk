const JSON_MIME_TYPE = 'application/json';

module.exports = sendRequest;

function sendRequest(context, options, fetch, forceGet) {
  return fetch(options.url, {
    method: forceGet ? 'GET' : options.method,
    body:
      findContentType(options.headers) === JSON_MIME_TYPE
        ? JSON.stringify(options.body)
        : options.body,
    headers: processRequestHeaders(context, options.headers)
  });
}

// Walk all the headers and render annotations with
// corresponding values in the application context
function processRequestHeaders(context, headers) {
  return Object.keys(headers).reduce((acc, key) => {
    return { ...acc, [key]: formatText(headers[key], context) };
  }, {});
}

// Execute annotation replacement on given text by matching
// values in the corresponding data structure.
function formatText(text, context) {
  return String(text).replace(/\{?{([^{}]+)}}?/g, replaceAnnotations(context));
}

// Returns a function that gets called for each annotation in the text.
// Replaces if there is a matching value, ignores if not.
function replaceAnnotations(context) {
  return (tag, name) => {
    // Allow escaping with double curly brackets: {{ }}
    if (tag.startsWith('{{') && tag.endsWith('}}')) {
      return '{' + name + '}';
    }

    // Ignore if there is no corresponding data for matched annotation
    // e.g: "Hello {name}" <= {}
    if (!context.hasOwnProperty(name)) {
      return tag;
    }

    return context[name];
  };
}

// Find the content type header by falling back to different typing styles
function findContentType(headers) {
  if (!headers) return;

  return headers['Content-Type'] || headers['Content-type'] || headers['content-type'];
}
