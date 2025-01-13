############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2020        #
############################
# Frontend build
FROM nginx:alpine

LABEL maintainer "EliasDH"
LABEL version "1.0"
LABEL description "This is the EliasDH website."
LABEL org.opencontainers.image.description "This is the EliasDH website."

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY ./assets /usr/share/nginx/html/assets
COPY ./index.html /usr/share/nginx/html/index.html
COPY ./manifest.json /usr/share/nginx/html/manifest.json
COPY ./robots.txt /usr/share/nginx/html/robots.txt
COPY ./sitemap.xml /usr/share/nginx/html/sitemap.xml

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]