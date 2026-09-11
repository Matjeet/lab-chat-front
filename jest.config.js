const nextJest = require('next/jest');

// Carga la config de Next (SWC, alias de jsconfig, manejo de CSS Modules y
// assets estáticos) para que los tests usen exactamente las mismas reglas
// de transformación que el build.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',

  // Matchers de @testing-library/jest-dom.
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Tests dentro de src/ (componentes) y app/ (rutas).
  testMatch: [
    '<rootDir>/src/**/*.(test|spec).(js|jsx)',
    '<rootDir>/app/**/*.(test|spec).(js|jsx)',
  ],

  // Alias "@/..." -> "src/..." también en los tests.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'app/**/*.{js,jsx}',
    '!src/**/index.js',
    '!**/*.config.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
};

module.exports = createJestConfig(config);
