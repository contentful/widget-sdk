#/bin/bash

host=http://127.0.0.1

if [ "$1" != "" ] ; then
  port=$1
else
  port=8112
fi

echo "Running phantomjs on $host:$port"

curl -I $host:$port> /dev/null 2>&1
if [ $? -gt 0 ] ; then
  echo "ERROR: Couldn't reach the server. Did you start \`rake jasmine JASMINE_PORT=<port_number>\` ?"
  echo "Run $0 with a port number as a parameter"
  exit 1
fi

if [ -f "$(which phantomjs)" ] ; then
  phantomjs run-jasmine.js $host:$port
else
  echo "ERROR: You need to install phantomjs"
  exit 1
fi
