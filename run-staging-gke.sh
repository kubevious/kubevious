#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

export NODE_ENV=production
export GKE_CREDENTIALS_PATH=credentials.json
export GKE_REGION=us-west1-c
export GKE_K8S_CLUSTER=gprod-uswest1c
# export DEBUG=express:*
#  --max_old_space_size=2048
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
node src/mock/index-gke