var xcode = require('xcode');
var fs = require('fs');
var path = require('path');

const filterFilesFromDir = function (startPath, filter, rec, multiple) {
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

module.exports = ctx => {
    return new Promise((resolve, reject) => {
        const xcodeProjPath = filterFilesFromDir('platforms/ios', '.xcodeproj', false);
        const projectPath = xcodeProjPath + '/project.pbxproj';
        const myProj = xcode.project(projectPath);
        console.log("Fetching build script removeArchitectures.sh ...");

        fs.readFile(process.cwd() + "/plugins/cordova-plugin-build-filter/hooks/ios/removeArchitectures.sh", "utf8", function (err, contents) {
            if (err) {
                return reject(err);
            }

            console.log("Adding build script to Xcode project file ...");

            let options = {shellPath: '/bin/sh', shellScript: contents};

            myProj.parseSync();
            myProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Remove not required architecures (Script)', myProj.getFirstTarget().uuid, options);
            fs.writeFileSync(projectPath, myProj.writeSync());
            return resolve("Added build script to Xcode project file");
        });

    }).then(message => {
        console.log(`${message}`);
    }).catch(message => {
        console.warn(`${message}`);
    });
};