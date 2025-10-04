![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍DOCKER🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🚀Docker](#🚀docker)
    - [🚀Frontend](#🚀frontend)
    - [🚀Backend](#🚀backend)
    - [🚀Services](#🚀services)
      - [🚀AI](#🚀ai)

## 🚀Docker

### 🚀Frontend
- Pull the latest image and run the container
```bash
sudo docker pull ghcr.io/eliasdhcom/eliasdhcom-frontend:latest
sudo docker run --name eliasdhcom-frontend-container -p 8080:8080 -d ghcr.io/eliasdhcom/eliasdhcom-frontend:latest
```

- Check the logs
```bash
sudo docker logs eliasdhcom-frontend-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop eliasdhcom-frontend-container
sudo docker rm eliasdhcom-frontend-container
sudo docker rmi ghcr.io/eliasdhcom/eliasdhcom-frontend:latest
```

### 🚀Backend
```bash
sudo docker pull ghcr.io/eliasdhcom/eliasdhcom-backend:latest
sudo docker run --name eliasdhcom-backend-container -p 3000:3000 -d ghcr.io/eliasdhcom/eliasdhcom-backend:latest
```

- Check the logs
```bash
sudo docker logs eliasdhcom-backend-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop eliasdhcom-backend-container
sudo docker rm eliasdhcom-backend-container
sudo docker rmi ghcr.io/eliasdhcom/eliasdhcom-backend:latest
```

### 🚀Services

#### 🚀AI
```bash
sudo docker pull ghcr.io/eliasdhcom/eliasdhcom-ai-service:latest
sudo docker run --name eliasdhcom-ai-service-container -p 3001:3001 -d ghcr.io/eliasdhcom/eliasdhcom-ai-service:latest
```

- Check the logs
```bash
sudo docker logs eliasdhcom-ai-service-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop eliasdhcom-ai-service-container
sudo docker rm eliasdhcom-ai-service-container
sudo docker rmi ghcr.io/eliasdhcom/eliasdhcom-ai-service:latest
```