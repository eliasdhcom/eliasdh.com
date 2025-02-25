#################################
# @author K10s Open Source Team #
# @since 01/01/2025             #
#################################
# Frontend build
FROM nginx:alpine

LABEL maintainer "EliasDH"
LABEL version "1.0"
LABEL description "This is the EliasDH website."
LABEL org.opencontainers.image.description "This is the EliasDH website."

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY ./dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]