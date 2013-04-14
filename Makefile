REPORTER = spec

install:
	cp -r @./* -t /usr/share
	cp /usr/share/writedown/writedown.desktop -t /usr/share/applications/

.PHONY: install