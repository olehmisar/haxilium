const path = require('path')

module.exports = {
    entry: './src-ts/index.ts',
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.dev.js',
        // TODO: re-enable
        // libraryTarget: 'umd',
    }
}
