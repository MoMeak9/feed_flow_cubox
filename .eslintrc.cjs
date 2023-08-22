module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        indent: 0,
        'prettier/prettier': [
            'warn',
            {
                endOfLine: 'auto',
                singleQuote: true,
                tabWidth: 4,
            },
        ],
        'no-trailing-spaces': ['error', { skipBlankLines: true }],
        'vue/multi-word-component-names': 'off',
        'prefer-rest-params': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
    },
};
