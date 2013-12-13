#/bin/bash

host=http://127.0.0.1
port=8112

while :
do
  case "$1" in
    -p | --port)
      port=$2
      shift 2
      ;;
    -h | --host)
      host=$2
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

spec_name=""
if [ $# -gt 0 ] ; then
  spec_name="/?spec=$*"
fi

echo "Running phantomjs on $host:$port"

curl -I $host:$port> /dev/null 2>&1
if [ $? -gt 0 ] ; then
  echo "ERROR: Couldn't reach the server. Did you start \`rake jasmine JASMINE_PORT=<port_number>\` ?"
  echo "Run $0 with a port number as a parameter"
  exit 1
fi


if [ -f "$(which phantomjs)" ] ; then
  # greps ignore some phantomjs QT warnings
  phantomjs run-jasmine.js "$host:$port$spec_name" 2>&1|grep -v CoreText|grep -v userSpaceScaleFactor
else
  echo "ERROR: You need to install phantomjs"
  exit 1
fi
