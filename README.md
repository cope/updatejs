# updatejs

Shortcut for running npm and bower install/update/prune calls.

#### Install:
    npm i -g updatejs

#### Usage:
    > update
    Running npm install...
    Running npm update...
    Running npm prune...
    Running bower install...
    Running bower update...
    Running bower prune...
    Done.

##### Options:
    -h, --help        output usage information
    -V, --version     output the version number
    
    -n, --npm         Perform *only* npm install/update/prune calls
    -b, --bower       Perform *only* bower install/update/prune calls
    
    -nb, <no params>  Perform both npm and bower install/update/prune calls

