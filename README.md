![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍README🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
3. [🚀Docker](#🚀docker)
4. [🔗Links](#🔗links)

---

## 🖖Introduction

I kindly request your thorough examination and absorption of the comprehensive documentation incorporated within the confines of this repository. Your diligent review of the diverse materials provided herein will undoubtedly enhance your understanding of the intricacies and nuances associated with the contents therein.

Please also see following documents:
- [LICENSE](LICENSE.md)
- [SECURITY](SECURITY.md)
- [CONTRIBUTING](CONTRIBUTING.md)

## 🚀Docker

- Pull the latest image and run the container
```bash
sudo docker pull ghcr.io/eliasdh-com/eliasdhcom-frontend:latest
sudo docker run --name eliasdhcom-frontend-container -p 8080:8080 -d ghcr.io/eliasdh-com/eliasdhcom-frontend:latest
```

- Check the logs
```bash
sudo docker logs eliasdhcom-frontend-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop eliasdhcom-frontend-container
sudo docker rm eliasdhcom-frontend-container
sudo docker rmi ghcr.io/eliasdh-com/eliasdhcom-frontend:latest
```

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com