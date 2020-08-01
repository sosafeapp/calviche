#!/usr/bin/env node
"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var child_process_1 = require("child_process");
var tree_model_1 = __importDefault(require("tree-model"));
var DependencyType;
(function (DependencyType) {
    DependencyType["Normal"] = "dependencies";
    DependencyType["Development"] = "devDependencies";
})(DependencyType || (DependencyType = {}));
var treeModel = new tree_model_1.default();
function buildDependenciesTree(packageNode) {
    var packagePath = packageNode.model.packagePath;
    var packageJson = require(packagePath);
    // Gets all local dependencies
    var localDependencies = getLocalDependencies(packageJson, DependencyType.Normal);
    var localDevDependencies = getLocalDependencies(packageJson, DependencyType.Development);
    var localDepsPaths = getDependenciesAbsolutePaths(packagePath, localDependencies);
    var localDevDepsPaths = getDependenciesAbsolutePaths(packagePath, localDevDependencies);
    addDepsAsChildren(packageNode, localDepsPaths);
    addDepsAsChildren(packageNode, localDevDepsPaths);
    if (packageNode.hasChildren()) {
        for (var _i = 0, _a = packageNode.children; _i < _a.length; _i++) {
            var x = _a[_i];
            buildDependenciesTree(x);
        }
    }
}
function getLocalDependencies(packageJson, dependenciesType) {
    var localDependencies = {};
    for (var dependencyName in packageJson[dependenciesType]) {
        if (packageJson && packageJson[dependenciesType] && packageJson[dependenciesType][dependencyName] &&
            packageJson[dependenciesType][dependencyName].includes('file:')) {
            localDependencies[dependencyName] =
                packageJson[dependenciesType][dependencyName];
        }
    }
    return localDependencies;
}
function getDependenciesAbsolutePaths(packagePath, dependencies) {
    return Object.values(dependencies).map(function (x) {
        return path_1.default.join(packagePath.replace('package.json', ''), x.replace('file:', ''), 'package.json');
    });
}
function addDepsAsChildren(packageNode, depsPaths) {
    for (var _i = 0, depsPaths_1 = depsPaths; _i < depsPaths_1.length; _i++) {
        var x = depsPaths_1[_i];
        packageNode.addChild(treeModel.parse({
            packagePath: x,
        }));
    }
}
function executeDependenciesTree(rootPackageNode) {
    // "The first and the second element are ignored
    // since from the third element begins the command to execute.
    // See: this: https://nodejs.org/docs/latest/api/process.html#process_process_argv
    var command = process.argv.slice(2).join(' ');
    console.log('Command to execute:', command);
    var dependenciesExecuted = [];
    rootPackageNode.walk({ strategy: 'post' }, function (node) {
        var packagePath = node.model.packagePath;
        if (dependenciesExecuted.includes(packagePath)) {
            // Continue with the next one
            return true;
        }
        var commandWorkingDirectory = packagePath.replace('package.json', '');
        console.log('Executing command in', commandWorkingDirectory);
        var execResult = child_process_1.execSync(command, {
            cwd: commandWorkingDirectory,
            stdio: [0, 1, 2],
        });
        console.log('Execution result:', execResult);
        dependenciesExecuted.push(packagePath);
        return true;
    });
}
var tree = treeModel.parse({
    packagePath: path_1.default.join(process.cwd(), 'package.json'),
});
console.log('Building dependencies tree.');
buildDependenciesTree(tree);
console.log('Dependencies tree built.');
console.log('To execute command in dependencies tree.');
executeDependenciesTree(tree);
console.log('Command executed in dependencies tree. ');
/* eslint-enable @typescript-eslint/no-var-requires */
//# sourceMappingURL=index.js.map