FROM node:alpine

RUN set -eux; \
  apk add --no-cache \
    bash \
    tini \
    openssh-client \
    chromium

ENV CHROME_BIN /usr/bin/chromium-browser
COPY docker-entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh"]
