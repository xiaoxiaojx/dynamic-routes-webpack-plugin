import * as Webpack from 'webpack'
import * as fs from 'fs'
import * as path from 'path'
import { getProperty, toArray, isObject } from './helpers'
import createParser, { Parser } from './parser'
import onTraverse from './traverse'
import { NormalObject } from '../types/custom'

export interface DynamicRoutesWebpackPluginOptions {
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
   * @example function onTraverse(path, record) {}
   */
  onTraverse?: typeof onTraverse
  /**
   * @description 默认情况下插件只运行在 process.env.NODE_ENV === 'development' && compiler.options.mode === 'development'
   * @example true
   */
  forceDev?: boolean
}
export interface Operator {
  getRoutesMap: () => NormalObject
  addRoute: (route: string) => boolean
}

export type Current = Array<string> | string

export type IDynamicRoutesWebpackPlugin = Webpack.Plugin & {
  getOperator: OpenApi
}

type OpenApi = () => Operator

class DynamicRoutesWebpackPlugin implements IDynamicRoutesWebpackPlugin {
  private readonly options: DynamicRoutesWebpackPluginOptions
  private readonly parser: Parser | null
  private routesMap: NormalObject = {}
  private routesModuleNeedRebuild: boolean = false

  constructor(options: DynamicRoutesWebpackPluginOptions) {
    DynamicRoutesWebpackPlugin.validateOptions(options)
    this.options = DynamicRoutesWebpackPlugin.normalizeOptions(options)
    this.parser = createParser(path.extname(options.routes as string))
    this.initRoutesMap()
  }

  public apply(compiler: Webpack.Compiler): void {
    this.checkIsDevelopment(compiler)
    this.connectCompiler(compiler)

    compiler.hooks.compilation.tap(
      DynamicRoutesWebpackPlugin.name,
      (compilation, { normalModuleFactory }) => {
        const skipNotNeedProcessedImport = (parser: NormalObject, parserOptions: NormalObject) => {
          if (parserOptions.import !== undefined && !parserOptions.import)
            return

          /** @type {SyncBailHook<expression>} */
          parser.hooks.importCall.tap(
            {
              name: DynamicRoutesWebpackPlugin.name,
              before: 'ImportParserPlugin'
            },
            (expr: NormalObject) => {
              if (this.isIgnoreAllImport()) {
                return true
              }
              if (
                this.isRoutesImport(
                  getProperty(parser, ['state', 'current', 'request'])
                ) &&
                this.isIgnoreImport(
                  getProperty(expr, ['arguments', '0', 'value'])
                )
              ) {
                return true
              }
            }
          )
        }

        const proxyRoutesModuleNeedRebuild = (module: Webpack.compilation.Module) => {
          if (this.isRoutesModule(module)) {
            const originNeedRebuild = Reflect.get(module, 'needRebuild')
            const needRebuild = (...args: any) => {
              const result = this.routesModuleNeedRebuild
              const originResult = typeof originNeedRebuild === 'function' && originNeedRebuild.apply(module, args)

              this.routesModuleNeedRebuild = false
              return result || originResult
            }
            Reflect.set(module, 'needRebuild', needRebuild)
          }
        }

        /** @type {SyncHook<parser, parserOptions>} */
        normalModuleFactory.hooks.parser
          .for('javascript/auto')
          .tap(DynamicRoutesWebpackPlugin.name, skipNotNeedProcessedImport)
        normalModuleFactory.hooks.parser
          .for('javascript/dynamic')
          .tap(DynamicRoutesWebpackPlugin.name, skipNotNeedProcessedImport)
        normalModuleFactory.hooks.parser
          .for('javascript/esm')
          .tap(DynamicRoutesWebpackPlugin.name, skipNotNeedProcessedImport)

        /** @type {SyncHook<Module>} */
        compilation.hooks.succeedModule.tap(DynamicRoutesWebpackPlugin.name, proxyRoutesModuleNeedRebuild)
      }
    )
  }

  public getOperator: OpenApi = () => {
    return {
      getRoutesMap: () => this.routesMap,
      addRoute: this.addRoute.bind(this)
    }
  }

  private addRoute(route: string): boolean {
    const { current } = this.options
    if (current!.includes(route) || !route) {
      return false
    }
    this.routesModuleNeedRebuild = true
    this.options.current = [...(current as Array<string>), route]
    return true
  }

  private isIgnoreAllImport(): boolean {
    return this.options.current!.length === 0
  }

  private isIgnoreImport(currentArg: string): boolean {
    const { current } = this.options
    const ignoreImport = Object.keys(this.routesMap)
      .filter(key => (current as Array<string>).some(c => key.startsWith(c)))
      .map(key => this.routesMap[key])
    return !ignoreImport.includes(currentArg)
  }

  private isRoutesImport(request: string): boolean {
    const { routes } = this.options
    return request.endsWith(routes as string)
  }

  private isRoutesModule(module: Webpack.compilation.Module): boolean {
    return getProperty(module, ['userRequest']) === this.options.routes
  }

  private async initRoutesMap(): Promise<void> {
    if (this.options.routesMap) {
      this.routesMap = { ...this.options.routesMap }
    } else if (this.parser) {
      this.routesMap = await Reflect.get(this.parser, 'traverse')(
        fs.readFileSync(this.options.routes as string, 'utf-8'),
        this.options.onTraverse
      )
    } else {
      throw new Error(`
        Cannot parse the file ${this.options.routes},
        you can provide options.routesMap
      `)
    }
  }

  private checkIsDevelopment(compiler: Webpack.Compiler): void {
    const env = process.env.NODE_ENV
    const mode = compiler.options.mode
    if (!this.options.forceDev) {
      return
    }
    if (env !== 'development' || mode !== 'development') {
      throw new Error(
        `
          It looks like you want to use it in the production environment.
          current process.env.NODE_ENV ${env},
          webpack.config.mode ${mode},
          you can provide options.forceDev = false
        `
      )
    }
  }

  private connectCompiler(compiler: Webpack.Compiler): void {
    if (!Reflect.get(compiler, DynamicRoutesWebpackPlugin.COMPILER_KEY)) {
      Reflect.set(compiler, DynamicRoutesWebpackPlugin.COMPILER_KEY, this)
    }
  }

  static COMPILER_KEY: string = '__dynamic_routes_plugin__'

  static normalizeOptions(
    options: DynamicRoutesWebpackPluginOptions
  ): DynamicRoutesWebpackPluginOptions {
    return {
      onTraverse,
      forceDev: true,
      ...options,
      current: toArray(options.current || []).filter(Boolean)
    }
  }

  static validateOptions(options: DynamicRoutesWebpackPluginOptions): void {
    const { routes, routesMap } = options
    if (!routes || !fs.existsSync(routes)) {
      throw new Error(`
                File ${routes} does not exist.
            `)
    }
    if (routesMap && !isObject(routesMap)) {
      throw new Error(`
                Options.routesMap must be object.
            `)
    }
  }
}

export default DynamicRoutesWebpackPlugin
