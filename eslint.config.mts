import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import prettierPlugin from 'eslint-plugin-prettier'
import pluginReact from 'eslint-plugin-react'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  // Ignores globales
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '.vercel/**',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts',
      'public/sw.js',
      'src/Shared/Hooks/useOfflineVideos.ts', // Ignorar este hook específico para evitar conflictos con el Service Worker
      'src/Shared/Lib/cache-manager.ts', // Ignorar esta clase específica para evitar conflictos con el Service Worker
      '**/*.css' // Ignorar archivos CSS ya que Tailwind usa sintaxis especial
    ]
  },

  // Configuración base para JavaScript
  js.configs.recommended,

  // Configuración para archivos TypeScript y React
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      react: pluginReact,
      '@next/next': nextPlugin,
      prettier: prettierPlugin
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // Configuración de TypeScript
  ...tseslint.configs.recommended,

  // Configuración de React
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],

  // Reglas personalizadas
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Next.js rules
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-title-in-document-head': 'error',
      '@next/next/no-unwanted-polyfillio': 'error',
      '@next/next/no-before-interactive-script-outside-document': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-script-component-in-head': 'error',
      '@next/next/no-styled-jsx-in-document': 'error',
      '@next/next/no-duplicate-head': 'error',
      '@next/next/no-page-custom-font': 'error',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],

      // Prettier integration
      'prettier/prettier': 'error'
    }
  }
])
