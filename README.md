## DynamicRoutesWebpackPlugin
> In a single page, there is a large number of dynamically loaded routes that are slow to package a solution. The runtime specifies the routes that need to be packaged, and other routes are not analyzed. Try to reduce the single build of source code if the package time is still not ideal after the dll is built before the third party package.

[中文简体 - README](https://github.com/xiaoxiaojx/dynamic-routes-webpack-plugin/blob/master/README-zh_CN.md)

## Install
```
$ yarn add dynamic-routes-webpack-plugin -D
```

## Flow
![image](https://t16img.yangkeduo.com/mms_static/2019-08-04/5b46671d-b190-4782-8be4-5f83176f348a.png)

## Usage

### step1
```
// webpack.config.dev.js
{
  entry: [
    'dynamic-routes-webpack-plugin/lib/client.js',
    'your/app/index.js'
  ],
  plugins: [
    new DynamicRoutesWebpackPlugin({
      routes: paths.routes
    })
  ]
}
```

### step2
> Introduced in the webpack-dev-server hook, enter the local test address directly in the browser, the middleware listens to change dynamic compilation
```
// webpackDevServer.config.js
before(app, server, compiler) {
    app.use(DynamicRoutesMiddleware(compiler, server))
}
```

## Options

### DynamicRoutesWebpackPluginOptions
```
interface DynamicRoutesWebpackPluginOptions {
  /**
   * @description The absolute path of the routing file, by analyzing the contents of the file to get the routesMap
   * @example "/xxx/src/routes/index.js"
   */
  routes: string
  /**
   * @description Key is path, value is the path of the corresponding component, if not provided, the routing file is not analyzed.
   * @example { "/home": "../components/Page/Home", ... }
   */
  routesMap?: NormalObject
  /**
   * @description The dynamic routing path that needs to be rendered for the first time. The default is empty.
   * @example ["/home"]
   */
  current?: Current
  /**
   * @description The processing function when traversing a routing file, the default require("./traverse") can be provided when the scene cannot be overwritten.
   * @example function onTraverse(path: NodePath<t.ObjectExpression>, record: (key: string, value: string) => void) {}
   */
  onTraverse?: typeof onTraverse
  /**
   * @description By default the plugin only runs on process.env.NODE_ENV === 'development' && compiler.options.mode === 'development'
   * @example true
   */
  forceDev?: boolean
}
```

## Expansion
> The most important thing about plugins is that the most complicated scenario is to parse the routes file and get the routesMap object. The current default traverse has certain business limitations and can be customized.

## Compile time comparison
![image](https://t16img.yangkeduo.com/mms_static/2019-07-30/b120b42a-7f59-4260-adec-53b3ceb2aec0.jpg)
