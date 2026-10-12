#!/usr/bin/env sh
# Compiles the backend with javac and starts the server on port 8080.
set -e
cd "$(dirname "$0")"
rm -rf out
javac -encoding UTF-8 -d out $(find src -name '*.java')
java -cp out searchengine.Main documents
