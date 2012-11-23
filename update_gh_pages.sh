#!/usr/bin/env bash

echo
echo "Updating GitHub pages..."
if git checkout gh-pages -q; then
    git merge master
    git checkout master -q
fi

