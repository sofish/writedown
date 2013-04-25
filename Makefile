REPORTER = spec

install:
	mkdir /usr/share/writedown
	cp -r @./* -t /usr/share/writedown
	cp /usr/share/writedown/writedown.desktop -t /usr/share/applications/

.PHONY: install