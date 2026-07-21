![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍DOCKER🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🚀Docker](#🚀docker)
    - [🚀Frontend](#🚀frontend)
    - [🚀Backend](#🚀backend)

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