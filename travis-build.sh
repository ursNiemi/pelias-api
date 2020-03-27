#!/bin/bash
# Set these environment variables
#DOCKER_USER=
#DOCKER_AUTH=

set -e

ORG=${ORG:-hsldevcom}
DOCKER_TAG=${TRAVIS_COMMIT:-latest}
DOCKER_IMAGE=$ORG/pelias-api
DOCKER_IMAGE_COMMIT=$DOCKER_IMAGE:$DOCKER_TAG
DOCKER_IMAGE_LATEST=$DOCKER_IMAGE:latest
DOCKER_IMAGE_PROD=$DOCKER_IMAGE:prod
API=pelias-api

if [ -z $TRAVIS_TAG ]; then
    # Build image
    echo "Building pelias-api"
    docker build --tag="$DOCKER_IMAGE_COMMIT" .
    docker run --name $API -p 3100:8080 --rm $DOCKER_IMAGE_COMMIT &
    sleep 20
    HOST=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' $API)
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$HOST:8080/v1)
    docker stop $API

    if [ $STATUS_CODE = 200 ]; then
        echo "Image runs OK"
    else
        echo "Could not launch pelias api image"
        # exit with an error
        exit 1
    fi
fi

if [ "${TRAVIS_PULL_REQUEST}" == "false" ]; then
    docker login -u $DOCKER_USER -p $DOCKER_AUTH
    if [ "$TRAVIS_TAG" ];then
        echo "processing release $TRAVIS_TAG"
        docker pull $DOCKER_IMAGE_COMMIT
        docker tag $DOCKER_IMAGE_COMMIT $DOCKER_IMAGE_PROD
        docker push $DOCKER_IMAGE_PROD
    else
        echo "Pushing latest image"
        docker push $DOCKER_IMAGE_COMMIT
        docker tag $DOCKER_IMAGE_COMMIT $DOCKER_IMAGE_LATEST
        docker push $DOCKER_IMAGE_LATEST
    fi
fi


echo Build completed
