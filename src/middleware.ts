import * as Express from 'express'
import * as Webpack from 'webpack'
import DynamicRoutesWebpackPlugin, {
  Operator
} from './plugin'
import { getReqRoutePath, findRoutePath } from './helpers'

interface Server {
  invalidate: (callback: () => void) => void
}

interface RecompileHooks {
  before: () => void
  after: () => void
}

function mockPluginOperator(): Operator {
  return {
    getRoutesMap: () => ({}),
    addRoute: () => false
  }
}

function getPluginOperator(compiler: Webpack.Compiler): Operator {
  return DynamicRoutesWebpackPlugin.getOperatorFromCompiler(compiler) || mockPluginOperator()
}

function triggerDevServerRecompile(server: Server, hooks: RecompileHooks): void {
  hooks.before()
  server.invalidate(hooks.after)
}

export default function createMiddleware(
  compiler: Webpack.Compiler,
  server: Server
): Express.Handler {
  const pluginOperator: Operator = getPluginOperator(compiler)

  return (
    req: Express.Request,
    _res: Express.Response,
    next: Express.NextFunction
  ) => {
    const reqRoutePath = getReqRoutePath(req.url)
    const routePath = findRoutePath(pluginOperator.getRoutesMap(), reqRoutePath)
    let isSucceedForAddRoute = false

    if (routePath) {
      isSucceedForAddRoute = pluginOperator.addRoute(routePath)
    }

    if (isSucceedForAddRoute) {
      triggerDevServerRecompile(
        server,
        {
          before: () => console.log(`Start compiling ${routePath} ...`),
          after: () => console.log(`Compiled ${routePath} successfully!`)
        }
      )
    }

    next()
  }
}
