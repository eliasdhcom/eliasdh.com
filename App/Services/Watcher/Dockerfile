############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
FROM alpine:3.19

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the service watcher image for the app."
LABEL org.opencontainers.image.description="This is the service watcher image for the app."

RUN apk add --no-cache curl jq kubectl

WORKDIR /app
COPY check.sh .
RUN chmod +x check.sh

CMD ["./check.sh"]