const { entry, output, rules, plugins } = require('./webpack.base.config');

const config =  {
    mode: 'development',
    devtool: 'inline-source-map',
    entry,
    output,
    module: {
        rules,
    },
    plugins,
    resolve: {
        alias: {
            vue: 'vue/dist/vue.js',
        },
    },
};

module.exports = config;
