#!/bin/bash

npm run build
git add docs
git commit -m "chore: build"
git push origin master