# Cordova Plugin Build Filter
Filters iOS simulator frameworks from your project.

## Installing

```
$ cordova install https://github.com/simplifier-ag/cordova-plugin-build-filter
```

## Usage

Plugin installs a script via after_prepare hook. The script removes architectures for simulators (e. g. x86 libs).
