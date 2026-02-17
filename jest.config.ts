
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        'libs/**/*.(t|j)s',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!libs/**/*.module.ts',
        '!libs/**/index.ts',
        '!src/app/organizations/organizations.module.ts', // example filter
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
};
