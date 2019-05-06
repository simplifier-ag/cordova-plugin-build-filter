var xcode = require('xcode');
var fs = require('fs');
var path = require('path');

module.exports = function (ctx) {
    var deferral = undefined;
    var cordovaVersion = ctx.opts.cordova.version.split(".");

    var filterFilesFromDir = function (startPath, filter, rec, multiple) {
        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }

        var files = fs.readdirSync(startPath);
        var resultFiles = [];
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory() && rec) {
                filterFilesFromDir(filename, filter); //recurse
            }

            if (filename.indexOf(filter) >= 0) {
                if (multiple) {
                    resultFiles.push(filename);
                } else {
                    return filename;
                }
            }
        }

        if (multiple) {
            return resultFiles;
        }
    };

    const xcodeProjPath = filterFilesFromDir('platforms/ios', '.xcodeproj', false);
    const projectPath = xcodeProjPath + '/project.pbxproj';
    const myProj = xcode.project(projectPath);
    console.log("Fetching build script removeArchitectures.sh ...");

    var addingScript = function(successCallback, errorCallback) {
        fs.readFile(process.cwd() + "/plugins/cordova-plugin-build-filter/hooks/ios/removeArchitectures.sh", "utf8", function(err, contents){
            if (err) {
                console.error(err);

                return errorCallback(err);
                //return deferral.reject(err);
            }

            console.log("Adding build script to Xcode project file ...");

            var options = {shellPath: '/bin/sh', shellScript: contents};

            myProj.parse(function (err) {
                if(err){
                    console.error(err);
                    return errorCallback(err);
                    //return deferral.reject(err);
                }

                myProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Remove not required architecures (Script)', myProj.getFirstTarget().uuid, options);
                fs.writeFileSync(projectPath, myProj.writeSync());
                console.log("Added build script to Xcode project file");
                return successCallback();
                //return deferral.resolve();
            });
        });
    };

    if(Number(cordovaVersion[0]) <= 8) {
        deferral = ctx.requireCordovaModule('q').defer();
        addingScript(function() {
            return deferral.resolve();
        }, function (error) {
            return deferral.reject(error)
        });
        return deferral.promise;
    } else {
        return new Promise(function (resolve, reject) {
           addingScript(function () {
               resolve();
           }, function (error) {
              reject(error);
           });
        });
    }
};

