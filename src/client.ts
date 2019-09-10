type FunctionObject = Record<string, (...args: Array<any>) => any>

function reportRouteChange(url: string): void {
  if (typeof fetch === 'function') {
    fetch(`/__dynamic_routes__?url=${url}`)
  }
}

function proxyMethod<T extends FunctionObject, K extends keyof T>(obj: T, property: K, handler: T[K]): void {
  const originFn: T[K] = obj[property]
  const nextFn: T[K] = ((...args: any[]) => {
    originFn.apply(obj, args)
    handler.apply(null, args)
  }) as T[K]

  obj[property] = nextFn
}

function proxyHistory(handler: typeof history.pushState): void {
  if (typeof history === 'object') {
    proxyMethod(history as any, 'pushState', handler)
  }
}

function handler(
  _data: any,
  _title: string,
  url?: string | null | undefined
): void {
  if (url) {
    reportRouteChange(url)
  }
}

proxyHistory(handler)
