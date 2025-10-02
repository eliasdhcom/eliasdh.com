############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
# AI build
FROM ollama/ollama:latest

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the AI image for the app."
LABEL org.opencontainers.image.description="This is the AI image for the app."

# Pre-pull het model tijdens de build: start server in background, wacht, pull, en stop
RUN ollama serve & \
    sleep 10 && \
    ollama pull llama3 && \
    pkill ollama

# Exposeer de API poort
EXPOSE 11434

# Health check voor Kubernetes readiness/liveness probes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/tags || exit 1

# Start Ollama server
CMD ["ollama", "serve"]