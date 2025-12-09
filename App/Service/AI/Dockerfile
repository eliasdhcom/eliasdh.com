############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
FROM ollama/ollama:latest

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the Service AI image for the app."
LABEL org.opencontainers.image.description="This is the Service AI image for the app."

ENV MODEL=llama3
EXPOSE 11434

ENTRYPOINT ["/bin/sh", "-c", "\
ollama serve & \
SERVER_PID=$! && \
until ollama list >/dev/null 2>&1; do sleep 1; done && \
ollama pull $MODEL && \
kill $SERVER_PID && \
exec ollama serve"]