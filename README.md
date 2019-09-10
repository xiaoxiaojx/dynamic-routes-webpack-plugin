## DynamicRoutesWebpackPlugin
> 在单页面, 有着大量的动态加载的路由打包缓慢的一个解决方案, 运行时指定当前需要打包的路由, 其他路由不会去分析。在 dll 前置构建第三方包后打包时间依然不理想的情况下尝试减少源代码的单次构建量。

## 安装
```
$ yarn add dynamic-routes-webpack-plugin -D
```

## 流程
![image](https://t16img.yangkeduo.com/mms_static/2019-08-04/5b46671d-b190-4782-8be4-5f83176f348a.png)

## 用法

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
> 在 webpack-dev-server 勾子中引入, 直接在浏览器中输入本地测试地址, 中间件监听到去变化动态编译
```
// webpackDevServer.config.js
before(app, server, compiler) {
    app.use(DynamicRoutesMiddleware(compiler, server))
}
```

## 其他

### DynamicRoutesWebpackPlugin
> 单独使用
```
new DynamicRoutesWebpackPlugin({
    /**
    *   路由文件的路径
    */
    routes: paths.routes
})
```

### DynamicRoutesWebpackPluginOptions
```
interface DynamicRoutesWebpackPluginOptions {
  /**
   * @description 路由文件的绝对路径, 通过解析该文件内容得到 routesMap
   * @example "/xxx/src/routes/index.js"
   */
  routes: string
  /**
   * @description key为path, value为对应组件的path, 如果提供则不用去分析路由文件
   * @example { "/home": "../components/Page/Home", ... }
   */
  routesMap?: NormalObject
  /**
   * @description 首次需要渲染的动态路由路径, 默认为空
   * @example ["/home"]
   */
  current?: Current
  /**
   * @description 对一个路由文件进行遍历时的处理函数, 默认的 require("./traverse") 场景覆盖不了时可提供
   * @example function onTraverse(path: NodePath<t.ObjectExpression>, record: (key: string, value: string) => void) {}
   */
  onTraverse?: typeof onTraverse
  /**
   * @description 默认情况下插件只运行在 process.env.NODE_ENV === 'development' && compiler.options.mode === 'development'
   * @example true
   */
  forceDev?: boolean
}
```

## 扩展
> 插件最重要也是场景最复杂的在于解析 routes 文件拿到 routesMap 对象, 当前默认的 traverse 具有一定的业务局限性, 可以编写自定义 options.onTraverse

## 编译时间对比
![image](https://t16img.yangkeduo.com/mms_static/2019-07-30/b120b42a-7f59-4260-adec-53b3ceb2aec0.jpg)
