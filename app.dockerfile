FROM node:20.18.0-alpine

ARG NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3001
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /home/perplexica

# Copier d'abord package.json et yarn.lock
COPY ui/package.json ui/yarn.lock ./

# Installer les dépendances
RUN yarn install

# Copier le reste des fichiers
COPY ui/ ./

RUN yarn build

CMD ["yarn", "start"]