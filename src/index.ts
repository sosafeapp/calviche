#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import path from 'path';
import { execSync as execCommand } from 'child_process';
import TreeModel from 'tree-model';

type PackageNode = { packagePath: string };
enum DependencyType {
  Normal = 'dependencies',
  Development = 'devDependencies',
}

const treeModel = new TreeModel();

function buildDependenciesTree(packageNode: TreeModel.Node<PackageNode>): void {
  const packagePath = packageNode.model.packagePath;
  const packageJson = require(packagePath);

  // Gets all local dependencies
  const localDependencies: Record<string, string> = getLocalDependencies(
    packageJson,
    DependencyType.Normal,
  );
  const localDevDependencies: Record<string, string> = getLocalDependencies(
    packageJson,
    DependencyType.Development,
  );

  const localDepsPaths = getDependenciesAbsolutePaths(
    packagePath,
    localDependencies,
  );
  const localDevDepsPaths = getDependenciesAbsolutePaths(
    packagePath,
    localDevDependencies,
  );

  addDepsAsChildren(packageNode, localDepsPaths);
  addDepsAsChildren(packageNode, localDevDepsPaths);

  if (packageNode.hasChildren()) {
    for (const x of packageNode.children) {
      buildDependenciesTree(x);
    }
  }
}

function getLocalDependencies(
  packageJson: Record<string, any>,
  dependenciesType: DependencyType,
): Record<string, string> {
  const localDependencies: Record<string, string> = {};

  for (const dependencyName in packageJson[dependenciesType]) {
    if (
      packageJson && packageJson[dependenciesType] && packageJson[dependenciesType][dependencyName] &&
      packageJson[dependenciesType][dependencyName].includes('file:')
    ) {
      localDependencies[dependencyName] =
        packageJson[dependenciesType][dependencyName];
    }
  }

  return localDependencies;
}

function getDependenciesAbsolutePaths(
  packagePath: string,
  dependencies: Record<string, string>,
): string[] {
  return Object.values(dependencies).map(x => {
    return path.join(
      packagePath.replace('package.json', ''),
      x.replace('file:', ''),
      'package.json',
    );
  });
}

function addDepsAsChildren(
  packageNode: TreeModel.Node<PackageNode>,
  depsPaths: string[],
): void {
  for (const x of depsPaths) {
    packageNode.addChild(
      treeModel.parse({
        packagePath: x,
      }),
    );
  }
}

function executeDependenciesTree(
  rootPackageNode: TreeModel.Node<PackageNode>,
): void {
  // "The first and the second element are ignored
  // since from the third element begins the command to execute.
  // See: this: https://nodejs.org/docs/latest/api/process.html#process_process_argv
  const command = process.argv.slice(2).join(' ');
  console.log('Command to execute:', command);
  const dependenciesExecuted: string[] = [];

  rootPackageNode.walk({ strategy: 'post' }, node => {
    const packagePath = node.model.packagePath;

    if (dependenciesExecuted.includes(packagePath)) {
      // Continue with the next one
      return true;
    }

    const commandWorkingDirectory = packagePath.replace('package.json', '');
    console.log('Executing command in', commandWorkingDirectory);

    const execResult = execCommand(command, {
      cwd: commandWorkingDirectory,
      stdio: [0, 1, 2],
    });

    console.log('Execution result:', execResult);
    dependenciesExecuted.push(packagePath);
    return true;
  });
}

const tree = treeModel.parse({
  packagePath: path.join(process.cwd(), 'package.json'),
});

console.log('Building dependencies tree.');
buildDependenciesTree(tree);
console.log('Dependencies tree built.');
console.log('To execute command in dependencies tree.');
executeDependenciesTree(tree);
console.log('Command executed in dependencies tree. ');

/* eslint-enable @typescript-eslint/no-var-requires */
