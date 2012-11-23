#!/usr/bin/env bash

# Minify our JS.
JS=./js/tag-it.js
MINIFIED_OUTPUT=./js/tag-it.min.js
curl -f -d compilation_level=SIMPLE_OPTIMIZATIONS -d output_format=text -d output_info=compiled_code --data-urlencode "js_code@${JS}" https://closure-compiler.appspot.com/compile -o $MINIFIED_OUTPUT

