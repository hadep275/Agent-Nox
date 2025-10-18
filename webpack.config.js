const path = require("path");

/**
 * 🦊 Nox Webpack Configuration
 * Enterprise-grade build system for VS Code extension
 */
module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return [
    // Extension Bundle (Node.js environment)
    {
      name: "extension",
      target: "node",
      mode: isProduction ? "production" : "development",
      entry: "./extension.js",
      output: {
        path: path.resolve(__dirname, "out"),
        filename: "extension.js",
        libraryTarget: "commonjs2",
        clean: false, // Don't clean, we have multiple bundles
      },
      externals: {
        vscode: "commonjs vscode", // VS Code API is external
      },
      resolve: {
        extensions: [".ts", ".js"],
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  configFile: "tsconfig.json",
                },
              },
            ],
          },
        ],
      },
      devtool: isProduction ? "source-map" : "eval-source-map",
      optimization: {
        minimize: isProduction,
      },
    },

    // Webview Bundle (Browser environment)
    {
      name: "webview",
      target: "web",
      mode: isProduction ? "production" : "development",
      entry: "./src/webview/index.ts",
      output: {
        path: path.resolve(__dirname, "out/webview"),
        filename: "webview.js",
        clean: false,
      },
      resolve: {
        extensions: [".ts", ".js", ".css"],
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  configFile: "tsconfig.json",
                },
              },
            ],
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      devtool: isProduction ? "source-map" : "eval-source-map",
      optimization: {
        minimize: isProduction,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              filename: "vendors.js",
            },
          },
        },
      },
    },

    // Dashboard Panel Bundle (Browser environment)
    {
      name: "dashboard",
      target: "web",
      mode: isProduction ? "production" : "development",
      entry: "./src/webview/dashboardPanel.js",
      output: {
        path: path.resolve(__dirname, "out/webview"),
        filename: "dashboardPanel.js",
        clean: false,
      },
      resolve: {
        extensions: [".js", ".css"],
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      devtool: isProduction ? "source-map" : "eval-source-map",
      optimization: {
        minimize: isProduction,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "dashboardVendors",
              chunks: "all",
              filename: "dashboardVendors.js",
            },
          },
        },
      },
    },
  ];
};
