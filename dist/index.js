#!/usr/bin/env node
"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const tree_model_1 = __importDefault(require("tree-model"));
var DependencyType;
(function (DependencyType) {
    DependencyType["Normal"] = "dependencies";
    DependencyType["Development"] = "devDependencies";
})(DependencyType || (DependencyType = {}));
const treeModel = new tree_model_1.default();
function buildDependenciesTree(packageNode) {
    const packagePath = packageNode.model.packagePath;
    const packageJson = require(packagePath);
    // Gets all local dependencies
    const localDependencies = getLocalDependencies(packageJson, DependencyType.Normal);
    const localDevDependencies = getLocalDependencies(packageJson, DependencyType.Development);
    const localDepsPaths = getDependenciesAbsolutePaths(packagePath, localDependencies);
    const localDevDepsPaths = getDependenciesAbsolutePaths(packagePath, localDevDependencies);
    addDepsAsChildren(packageNode, localDepsPaths);
    addDepsAsChildren(packageNode, localDevDepsPaths);
    if (packageNode.hasChildren()) {
        for (const x of packageNode.children) {
            buildDependenciesTree(x);
        }
    }
}
function getLocalDependencies(packageJson, dependenciesType) {
    const localDependencies = {};
    for (const dependencyName in packageJson[dependenciesType]) {
        if (packageJson && packageJson[dependenciesType] && packageJson[dependenciesType][dependencyName] &&
            packageJson[dependenciesType][dependencyName].includes('file:')) {
            localDependencies[dependencyName] =
                packageJson[dependenciesType][dependencyName];
        }
    }
    return localDependencies;
}
function getDependenciesAbsolutePaths(packagePath, dependencies) {
    return Object.values(dependencies).map(x => {
        return path_1.default.join(packagePath.replace('package.json', ''), x.replace('file:', ''), 'package.json');
    });
}
function addDepsAsChildren(packageNode, depsPaths) {
    for (const x of depsPaths) {
        packageNode.addChild(treeModel.parse({
            packagePath: x,
        }));
    }
}
function executeDependenciesTree(rootPackageNode) {
    // "The first and the second element are ignored
    // since from the third element begins the command to execute.
    // See: this: https://nodejs.org/docs/latest/api/process.html#process_process_argv
    const command = process.argv.slice(2).join(' ');
    console.log('Command to execute:', command);
    const dependenciesExecuted = [];
    rootPackageNode.walk({ strategy: 'post' }, node => {
        const packagePath = node.model.packagePath;
        if (dependenciesExecuted.includes(packagePath)) {
            // Continue with the next one
            return true;
        }
        const commandWorkingDirectory = packagePath.replace('package.json', '');
        console.log('Executing command in', commandWorkingDirectory);
        const execResult = (0, child_process_1.execSync)(command, {
            cwd: commandWorkingDirectory,
            stdio: [0, 1, 2],
        });
        console.log('Execution result:', execResult);
        dependenciesExecuted.push(packagePath);
        return true;
    });
}
const tree = treeModel.parse({
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