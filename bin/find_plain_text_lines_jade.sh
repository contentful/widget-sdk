#!/bin/bash
#
# Looks up for any plain text lines in jade templates that might not be properly prefixed
# (or that could be blocks of text in jade block tags)
# See http://jade-lang.com/reference/plain-text/ for more info
#
# Tiago Rodrigues
#
for i in `find ./src/javascripts/ -name "*.jade"` ; do
  res=`gawk -f filter.awk $i`
  if [ "$res" != "" ] ; then
    echo $i
    gawk -f filter.awk $i
    echo "\n"
  fi
done
