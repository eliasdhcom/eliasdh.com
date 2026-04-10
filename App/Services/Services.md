![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍README🤍💙

## 1. Services
### 1.1. Watcher
> This script periodically checks all Kubernetes deployments within a specified namespace and compares the currently running container image tags with the latest available tags in GitHub Container Registry (GHCR) via the GitHub API; when a mismatch is detected, it automatically triggers a kubectl rollout restart for the affected deployment to pull and deploy the newest image, providing a lightweight and simple automated synchronization mechanism without the need for full GitOps solutions such as Flux CD.