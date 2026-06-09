module.exports = {
    apps: [
        {
            name: 'jtk-api',
            script: 'dist/apps/api/main.js',
            cwd: __dirname,
            instances: 1,
            env: { NODE_ENV: 'production', API_PORT: 3001 },
        },
        {
            name: 'jtk-web',
            script: 'node_modules/next/dist/bin/next',
            args: 'start apps/web -p 3000',
            cwd: __dirname,
            instances: 1,
            env: { NODE_ENV: 'production' },
        },
    ],
};
