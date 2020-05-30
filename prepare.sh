#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

cd src
rm -rf node_modules/
npm install
npm update kubevious-helpers kubevious-kubik websocket-subscription-server