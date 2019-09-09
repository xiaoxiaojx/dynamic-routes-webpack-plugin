import { NormalObject } from '../types/custom'

export function getProperty(obj: NormalObject, names: Array<string>) {
  if (!obj) return
  names = names.slice()
  for (let i = 0; i < names.length - 1; i++) {
    obj = obj[names[i]]
    if (typeof obj !== 'object' || !obj) return
  }
  return obj[names.pop() as string]
}

export function toArray(items: string | Array<string>): Array<string> {
  return Array.isArray(items) ? items : [items]
}

export function isObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export const DYNAMIC_REQ_PATH: string = '__dynamic_routes__'

export function isPushState(url: string): boolean {
  return url.includes(DYNAMIC_REQ_PATH)
}

export function getReqPath(url: string): string {
  if (isPushState(url)) {
    return url.split('url=')[1]
  }
  return url.split('?')[0]
}

export function normalizeRoutePath(url: string): string {
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  if (!url.endsWith('/')) {
    url = url + '/'
  }
  return url
}

export function findRoutePath(
  routesMap: NormalObject,
  url: string
): string | undefined {
  if (!url || url === '/') {
    return undefined
  }
  return Object.keys(routesMap).find(key =>
    normalizeRoutePath(url).endsWith(normalizeRoutePath(key))
  )
}
