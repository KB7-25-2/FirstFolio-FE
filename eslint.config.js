import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'e2e/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.{js,vue}', '**/*.{test,spec}.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
]
