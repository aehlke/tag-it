JS=./js/tag-it.js
MINIFIED_OUTPUT=./js/tag-it.min.js

build:
	@echo
	@echo "Compiling JS..."
	@curl --progress-bar -f -d compilation_level=SIMPLE_OPTIMIZATIONS -d output_format=text -d output_info=compiled_code --data-urlencode "js_code@${JS}" https://closure-compiler.appspot.com/compile -o ${MINIFIED_OUTPUT}

gh-pages:
	@echo "Updating GitHub pages..."
	@if git checkout gh-pages -q; then \
		git merge master -Xtheirs && \
		git checkout master -q; \
	fi

.PHONY: gh-pages

