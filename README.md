# updatejs [![Build Status](https://travis-ci.org/cope/updatejs.svg?branch=master)](https://travis-ci.org/cope/updatejs)

[![Join the chat at https://gitter.im/cope/updatejs](https://badges.gitter.im/cope/updatejs.svg)](https://gitter.im/cope/updatejs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Shortcut for running npm and bower install/update/prune calls.

The script will check for package.json and bower.json before running install/update/prune calls.

The script will recursively search for the location of bower.json in order to handle special "client" folders.

## Install:
    npm i -g updatejs

## Options:
    -h, --help       output usage information
    -V, --version    output the version number

    -n, --npm        Perform *only* npm calls
    -b, --bower      Perform *only* bower calls

    -i, --install    Perform *only* install calls
    -u, --update     Perform *only* update calls
    -p, --prune      Perform *only* prune calls

    -r, --recursive  Perform calls recursively in all subfolders
                     WARNING: The more projects you have, the longer it will take.
    
    -P, --parallel   Perform npm and bower calls in parallel, not consecutively
                     WARNING: The output will happen in real time, all mixed up.
    -f, --buffered   Buffered output for the parallel execution
                     WARNING: The output will happen only at the end:
                     - once for all npm calls, and once for all bower calls.

    <no params>      Same as using -nbiup:
                     Performs all npm and bower install/update/prune calls
 
## Usage:
    > update
    For npm, currently in: C:\GIT\yourproject
    Running npm install...
    - npm install done.
    Running npm update...
    - npm update done.
    Running npm prune...
    - npm prune done.
    For bower, currently in: C:\GIT\yourproject
    Running bower install...
    - bower install done.
    Running bower update...
    - bower update done.
    Running bower prune...
    - bower prune done.
    Done.

### Additional examples: Only install
    > update -i
    For npm, currently in: C:\GIT\yourproject
    Running npm install...
    - npm install done.
    For bower, currently in: C:\GIT\yourproject
    Running bower install...
    - bower install done.
    Done.

### Additional examples: Only npm install
    > update -ni
    For npm, currently in: C:\GIT\yourproject
    Running npm install...
    - npm install done.
    Done.
