#!/usr/bin/env bash

echo "Compiling JS..."
JS=./js/tag-it.js
MINIFIED_OUTPUT=./js/tag-it.min.js
curl --progress-bar -f -d compilation_level=SIMPLE_OPTIMIZATIONS -d output_format=text -d output_info=compiled_code --data-urlencode "js_code@${JS}" https://closure-compiler.appspot.com/compile -o $MINIFIED_OUTPUT

echo
echo "Updating GitHub pages..."
git stash -q
if git checkout gh-pages -q; then
    git merge master
    git checkout master -q
fi
git stash pop -q

