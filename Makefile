JS=./js/tag-it.js
MINIFIED_OUTPUT=./js/tag-it.min.js

build:
	@echo
	@echo "Compiling JS..."
	@npm run build

gh-pages:
	@echo "Updating GitHub pages..."
	@if git checkout gh-pages -q; then \
		git merge master -Xtheirs && \
		git checkout master -q; \
	fi

.PHONY: gh-pages

