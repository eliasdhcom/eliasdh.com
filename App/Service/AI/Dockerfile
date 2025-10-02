############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
# AI build
FROM python:3.11-slim

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the AI image for the app."
LABEL org.opencontainers.image.description="This is the AI image for the app."

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]