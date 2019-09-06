import * as t from 'babel-types'
import { NodePath } from 'babel-traverse'
import { getProperty } from './helpers'
import { NormalObject } from '../types/custom'

const IMPORT_NAME: string = 'Import'
const PATH_NAME: string = 'path'

/**
 * import('./home')
 */
const NORMAL_IMPORT_NAME_KEYS: Array<string> = [
  'value',
  'body',
  'callee',
  'type'
]
const NORMAL_IMPORT_PATH_KEYS: Array<string> = [
  'value',
  'body',
  'arguments',
  '0',
  'value'
]

/**
 * import('./home').catch(console.error)
 */
const PROMISE_IMPORT_NAME_KEYS: Array<string> = [
  'value',
  'body',
  'callee',
  'object',
  'callee',
  'type'
]
const PROMISE_IMPORT_PATH_KEYS: Array<string> = [
  'value',
  'body',
  'callee',
  'object',
  'arguments',
  '0',
  'value'
]

function hasImportCallExpression(propertie: NormalObject): boolean {
  return (
    getProperty(propertie, NORMAL_IMPORT_NAME_KEYS) === IMPORT_NAME ||
    getProperty(propertie, PROMISE_IMPORT_NAME_KEYS) === IMPORT_NAME
  )
}

function hasPathKeyIdentifier(propertie: NormalObject): boolean {
  return getProperty(propertie, ['key', 'name']) === PATH_NAME
}

function isRouteConfigObject(path: NodePath<t.ObjectExpression>): boolean {
  const properties = getProperty(path, ['node', 'properties'])
  return (
    properties &&
    properties.some(hasImportCallExpression) &&
    properties.some(hasPathKeyIdentifier)
  )
}

function getRoutePath(path: NodePath<t.ObjectExpression>): string {
  const properties = getProperty(path, ['node', 'properties'])
  const target = properties && properties.find(hasPathKeyIdentifier)
  return target && getProperty(target, ['value', 'value'])
}

function getLoadImportPath(path: NodePath<t.ObjectExpression>): string {
  const properties = getProperty(path, ['node', 'properties'])
  const target = properties && properties.find(hasImportCallExpression)
  return (
    target &&
    (getProperty(target, NORMAL_IMPORT_PATH_KEYS) ||
      getProperty(target, PROMISE_IMPORT_PATH_KEYS))
  )
}

/**
 * @description 默认的遍历函数只能解析如下的路由代码, 如果是复杂的路由对象, 类似使用 loadable 不能解析, 详见 /__tests__/__source__
 * const routes = [{
 *  name: "主页",
 *  path: "/home",
 *  load: () => import("../components/Page/Home")
 * },
 * ...
 * ],
 * export default routes;
 */
export default function onTraverse(
  path: NodePath<t.ObjectExpression>,
  record: (key: string, value: string) => void
): void {
  if (isRouteConfigObject(path)) {
    const key = getRoutePath(path)
    const value = getLoadImportPath(path)
    record(key, value)
  }
}
