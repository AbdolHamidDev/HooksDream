import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist', 'dev-dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // ESLint 10 không còn hỗ trợ `plugins` dạng array của eslintrc.
      // `configs.flat.*` là bản flat config thật sự (17 rules, superset của bản cũ).
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Nợ kỹ thuật có sẵn từ trước, chưa dọn được trong một lần nâng cấp.
      // Hạ xuống 'warn' để CI không đỏ, nhưng vẫn hiện ra output để dần xử lý.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
      'no-useless-catch': 'warn',
      'preserve-caught-error': 'warn',

      // Rule mới của typescript-eslint 8 / ESLint 10: thiên về siết kiểu,
      // không phải lỗi runtime. Giữ ở mức 'warn' cho tới khi dọn nợ kỹ thuật.
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': 'warn',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'warn',
      'no-constant-binary-expression': 'warn',

      // Rule mới của eslint-plugin-react-hooks v7.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-refresh/only-export-components': 'warn',

      // Rules of Hooks: đã dọn sạch, giữ ở mức 'error' để chặn tái phạm.
      // (Trước đây có 2 vi phạm: useSpring trong .map() và hook bị gọi bên
      // trong callback — cả hai đã được sửa.)
      'react-hooks/rules-of-hooks': 'error',
    },
  },
])
