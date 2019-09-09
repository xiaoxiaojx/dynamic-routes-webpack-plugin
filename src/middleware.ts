import * as Express from 'express'
import * as Webpack from 'webpack'
import DynamicRoutesWebpackPlugin, {
  IDynamicRoutesWebpackPlugin,
  Operator
} from './plugin'
import { isPushState, getReqPath, findRoutePath } from './helpers'

interface Server {
  invalidate: (callback: () => void) => void
}

interface ReportRouteResp {
  data: boolean
}

function mockPluginOperator(): Operator {
  return {
    getRoutesMap: () => ({}),
    addRoute: () => false
  }
}

function getPluginOperator(compiler: Webpack.Compiler): Operator {
  const plugin: IDynamicRoutesWebpackPlugin = Reflect.get(compiler, DynamicRoutesWebpackPlugin.COMPILER_KEY)
  if (plugin) {
    return plugin.getOperator()
  }
  return mockPluginOperator()
}

export default function createMiddleware(
  compiler: Webpack.Compiler,
  server: Server
): Express.Handler {
  const { addRoute, getRoutesMap } = getPluginOperator(compiler)

  return (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction
  ) => {
    const reqPath = getReqPath(req.url)
    const routePath = findRoutePath(getRoutesMap(), reqPath)
    let addNewRouteResult = false

    if (routePath) {
      addNewRouteResult = addRoute(routePath)
    }

    if (addNewRouteResult) {
      server.invalidate(() => {
        console.log(`Start compile ${routePath}`)
      })
    }

    if (isPushState(req.url)) {
      const resp: ReportRouteResp = {
        data: addNewRouteResult
      }
      return res.type('application/json').send(resp)
    }

    next()
  }
}
