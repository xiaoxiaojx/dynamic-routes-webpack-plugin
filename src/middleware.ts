import * as fs from 'fs'
import * as Express from 'express'
import * as Webpack from 'webpack'
import DynamicRoutesWebpackPlugin, {
  DynamicRoutesWebpackPluginOptions,
  Operator
} from './plugin'
import { isPushState, getReqPath, findRoutePath } from './helpers'

interface Server {
  invalidate: (callback: () => void) => void
}

function applyDynamicRoutesWebpackPlugin(
  compiler: Webpack.Compiler,
  options: DynamicRoutesWebpackPluginOptions
): Operator {
  const plugin = new DynamicRoutesWebpackPlugin(options)
  plugin.apply(compiler)
  return plugin.getApi()
}

function applyOtherWebpackPlugin(compiler: Webpack.Compiler): void {
  const definePlugin = new Webpack.DefinePlugin({
    DISABLE_DYNAMIC_ROUTES_WEBPACK_PLUGIN: JSON.stringify(false)
  })
  definePlugin.apply(compiler)
}

export default function createMiddleware(
  compiler: Webpack.Compiler,
  server: Server,
  options: DynamicRoutesWebpackPluginOptions
): Express.Handler {
  const { addRoute, getRoutesMap } = applyDynamicRoutesWebpackPlugin(
    compiler,
    options
  )
  applyOtherWebpackPlugin(compiler)

  return (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction
  ) => {
    const reqPath = getReqPath(req.url)
    const routePath = findRoutePath(getRoutesMap(), reqPath)
    let isAddRoute = false
    if (routePath) {
      isAddRoute = addRoute(routePath)
    }
    if (isAddRoute) {
      fs.utimesSync(options.routes, new Date(), new Date())
      server.invalidate(() => {
        console.log(`Start compile ${routePath}`)
      })
    }
    if (isPushState(req.url)) {
      return res.type('application/json').send({
        data: isAddRoute
      })
    }
    next()
  }
}
