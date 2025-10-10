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
echo 'Starting Ollama server in background...' && \
ollama serve & \
SERVER_PID=$! && \
echo 'Waiting for server to become ready...' && \
until ollama list >/dev/null 2>&1; do sleep 1; done && \
echo 'Pulling model $MODEL...' && \
ollama pull $MODEL && \
echo 'Model ready ✅' && \
echo 'Switching to Ollama server as main process...' && \
kill $SERVER_PID && \
exec ollama serve"]