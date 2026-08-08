import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // I decoratori di NestJS e TypeORM lasciano i campi senza inizializzatore:
      // sono valorizzati dal framework, non dal costruttore.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]);
