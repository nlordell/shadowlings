FROM docker.io/library/node:18

# v0.7.0
ARG TAG=26e4f4c

RUN git clone https://github.com/eth-infinitism/bundler /src/bundler
WORKDIR /src/bundler
RUN git checkout ${TAG}
RUN git submodule init && git submodule update

COPY bundler/bundler.diff /src
RUN cat /src/bundler.diff | git apply

RUN yarn && yarn preprocess
ENTRYPOINT ["yarn", "bundler"]
CMD []
