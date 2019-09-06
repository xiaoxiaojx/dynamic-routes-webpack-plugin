declare var DISABLE_DYNAMIC_ROUTES_WEBPACK_PLUGIN: boolean

function proxyHistory(handle: typeof history.pushState): void {
  if (typeof history !== 'object') {
    return
  }
  const prePushState = history.pushState

  function nextPushState(
    data: any,
    title: string,
    url?: string | null | undefined
  ) {
    prePushState.call(history, data, title, url)
    handle(data, title, url)
  }

  history.pushState = nextPushState
}

function handle(
  data: any,
  title: string,
  url?: string | null | undefined
): void {
  if (url && typeof location === 'object' && typeof fetch === 'function') {
    fetch(`/__dynamic_routes_?url=${url}`)
      .then(res => res.json())
      .then(res => {
        if (res && res.data) {
          location.reload()
        }
      })
  }
}

if (
  typeof DISABLE_DYNAMIC_ROUTES_WEBPACK_PLUGIN !== 'undefined' &&
  DISABLE_DYNAMIC_ROUTES_WEBPACK_PLUGIN === false
) {
  proxyHistory(handle)
}
