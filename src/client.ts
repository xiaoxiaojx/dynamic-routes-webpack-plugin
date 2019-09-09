interface ReportRouteResp {
  data: boolean
}

function reportRouteChange(url: string): Promise<ReportRouteResp> {
  if (typeof fetch === 'function') {
    return fetch(`/__dynamic_routes__?url=${url}`)
      .then(res => res.json())
  }
  return Promise.resolve({data: false})
}

function proxyHistory(handler: typeof history.pushState): void {
  if (typeof history !== 'object') {
    return
  }
  const originPushState = history.pushState

  function nextPushState(
    data: any,
    title: string,
    url?: string | null | undefined
  ) {
    originPushState.call(history, data, title, url)
    handler(data, title, url)
  }

  history.pushState = nextPushState
}

function handler(
  _data: any,
  _title: string,
  url?: string | null | undefined
): void {
  if (url && typeof location === 'object') {
    reportRouteChange(url)
      .then(res => {
        if (res && res.data) {
          location.reload()
        }
      })
  }
}

proxyHistory(handler)
