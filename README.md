# Hublot

This is the repository for the Hublot project.

## Install Docker and Docker Compose

You will need to have Docker and Docker Compose installed on your machine. If they are already installed, you can skip this part.
Otherwise, you can install them referring to [https://docs.docker.com/engine/installation/](https://docs.docker.com/engine/installation/ "Install Docker"), and to [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/ "Install Docker Compose").

## Get all the docker images

### Kaldi-gstreamer

You have two options:

* Run `git clone https://ci.linagora.com/linagora/lgs/labs/docker-kaldi-gstreamer-server.git`
In the docker-kaldi-gstreamer-server directory, run `docker build -t linagora/kaldi-gstreamer .`

* Or you can directly build the docker image running:
`docker build -t linagora/kaldi-gstreamer https://ci.linagora.com/linagora/lgs/labs/docker-kaldi-gstreamer-server.git`

### Recommender

* Clone the project:
`git clone https://ci.linagora.com/linagora/lgs/labs/openpaas-summary.git`

Don't forget to **add the config.properties file** in the openpaas-summary directory, and then you can build the docker image (being in the openpaas-summary directory):
`docker build -t linagora/recommender .`

### Selenium

If you want, you can pull the selenium image from Docker Hub: run `docker pull selenium/standalone-chrome`
This image will be pulled the first time you run `docker-compose up`, if you don't pull it now.

## Clone Hublot

Run `git clone https://ci.linagora.com/linagora/lgs/labs/hublot.git`
You can build the docker image of Hublot running `docker build -t linagora/hublot .` in the hublot directory, but if you don't do it, the image will be built the first time you run `docker-compose up`.

Note that if you have an old docker image tagged `linagora/hublot` on your machine, the image will never be built when you run `docker-compose up`, and the old image will be used. In order to have the latest version of the image, you must build it now. Every time you change some code in hublot, you will need to build the image, because docker compose will use `linagora/hublot` image if it exists. If you want the image to be built every time you run `docker-compose up`, remove the `image: linagora/hublot` line in docker-compose.yml

## Environment variables

Three environment variables are defined in the .env file:
* NB_WORKERS is the number of workers of the kaldi gstreamer server
* MODELS_PATH is the path of the directory containing the models used by kaldi
* YAML is the path of the yaml file describing the model that you want to use

There are different ways to set environment variables:
* You can modify the values of these environment variables in the .env file.

* If you don't want to edit the .env file, you can define environment variables in your shell (with the same names as above). The values of the variables defined in your shell will overwrite those defined in the .env file. You must know that if you define environment variables in your shell, their values set in the .env file will no longer be taken into consideration.

* The simpliest way to change values of environment variables without editing the .env file, and without setting permanent environment variables in your shell is to specify it when you run `docker-compose up`. For example, you can run:
`MODELS_PATH=/your/path/to/models YAML=/opt/models/gmm_hmm5.yaml docker-compose up`

## Fix the models issue before running Hublot

The MODELS\_PATH environment variable is by default set to `./models/`, and it should be set to a directory containing the yaml files describing the models. You can either create the models directory in hublot and put your models inside it, or you can set the MODELS_PATH value to the right directory in your machine, using one of the three options listed in the precedent section.

## Run Hublot

Be sure that you are in the hublot directory, and run `docker-compose up`. You can set environment variables in the same command line, as explained above.


