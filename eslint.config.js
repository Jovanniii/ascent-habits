import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Le moteur reste pur : aucune dépendance à l'interface, au stockage, aux thèmes
    // ni aux API du navigateur. C'est ce qui permet de le tester et de changer d'habillage.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^react(-dom)?(/.*)?$',
              message: 'Le moteur ne doit pas dépendre de React.',
            },
            {
              regex: '(^|/)(ui|storage|themes)(/|$)',
              message: "Le moteur ne doit dépendre ni de l'interface, ni du stockage, ni des thèmes.",
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Le moteur ne doit pas utiliser les API du navigateur.' },
        { name: 'document', message: 'Le moteur ne doit pas utiliser les API du navigateur.' },
        { name: 'localStorage', message: 'Le stockage passe par src/storage.' },
        { name: 'navigator', message: 'Le moteur ne doit pas utiliser les API du navigateur.' },
      ],
    },
  },
  {
    // Les thèmes habillent les données : ils ne dépendent ni de l'interface ni du stockage.
    files: ['src/themes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(ui|storage)(/|$)',
              message: "Un thème ne dépend ni de l'interface ni du stockage.",
            },
          ],
        },
      ],
    },
  },
  {
    // Un dossier de thème n'importe jamais le registre (import circulaire au chargement).
    files: ['src/themes/*/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(ui|storage)(/|$)',
              message: "Un thème ne dépend ni de l'interface ni du stockage.",
            },
            {
              // '..', '../', '../index.ts', '../../registry.ts', '/src/themes/index.ts'…
              regex: '^(\\.\\.?/?|(\\.\\./)+|(\\.\\./)+(index|registry)(\\.ts)?|.*themes/(index|registry)(\\.ts)?)$',
              message: "Un thème n'importe que ../types.ts, ../progress.ts et le moteur.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: 'ImportExpression', message: 'Pas d’import dynamique dans un thème (registre et cycles).' },
      ],
    },
  },
  {
    // L'interface ne connaît aucun thème en particulier : elle passe par le point d'entrée.
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: 'themes/(?!index\\.ts$)',
              message: "L'interface importe les thèmes uniquement via src/themes/index.ts.",
            },
          ],
        },
      ],
    },
  },
])
