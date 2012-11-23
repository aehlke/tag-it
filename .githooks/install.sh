#!/bin/sh
cd "$(dirname "$0")"
cd ../.git/hooks
ln -s ../../.githooks/pre-commit .
ln -s ../../.githooks/post-commit .

