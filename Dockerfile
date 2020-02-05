FROM node:10.18-buster

ENV PORT=8080
EXPOSE ${PORT}

# install libpostal
RUN apt-get update
RUN echo 'APT::Acquire::Retries "20";' >> /etc/apt/apt.conf
RUN apt-get install -y --no-install-recommends git curl make libsnappy-dev autoconf automake libtool python pkg-config

RUN mkdir -p /mnt/data

RUN git clone --single-branch https://github.com/vesameskanen/libpostal \
  && cd libpostal \
  && ./bootstrap.sh \
  && ./configure --datadir=/mnt/data \
  && make -j4 \
  && make install \
  && ldconfig

# Where the app is built and run inside the docker fs
ENV WORK=/opt/pelias/api

# Used indirectly for saving yarn logs etc.
ENV HOME=/opt/pelias/api

WORKDIR ${WORK}
ADD . ${WORK}

# Build and set permissions for arbitrary non-root user
RUN yarn install && chmod -R a+rwX .

ADD pelias.json.docker pelias.json

CMD yarn start
