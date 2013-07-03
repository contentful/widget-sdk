#/bin/bash

curl -I http://127.0.0.1:8888 > /dev/null 2>&1
if [ $? -gt 0 ] ; then
  echo "ERROR: Couldn't reach the server. Did you start \`rake jasmine\` ?"
  exit 1
fi

if [ -f "$(which phantomjs)" ] ; then
  phantomjs run-jasmine.js http://127.0.0.1:8888
else
  echo "ERROR: You need to install phantomjs"
  exit 1
fi
