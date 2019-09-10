const fs = require('fs')
const path = require('path')
const onTraverse =  require('../src/traverse').default
const createParser =  require('../src/parser').default
const {
  getProperty,
  toArray,
  isObject,
  isPushState,
  getReqRoutePath,
  normalizeRoutePath,
  findRoutePath,
  DYNAMIC_REQ_PATH
} = require('../src/helpers')

const routesJs = path.join(__dirname, './__source__/routes.js')
const Jsparser = createParser(path.extname(routesJs))
const routesTs = path.join(__dirname, './__source__/routes.ts')
const Tsparser = createParser(path.extname(routesTs))

test('createParser test - .ts', () => {
  expect(createParser('.ts').name).toBe('TsParser')
})

test('createParser test - .tsx', () => {
  expect(createParser('.tsx').name).toBe('TsParser')
})

test('createParser test - .js', () => {
  expect(createParser('.js').name).toBe('JsParser')
})

test('createParser test - .jsx', () => {
  expect(createParser('.jsx').name).toBe('JsParser')
})

test('createParser test - null', () => {
  expect(createParser('.css')).toBeNull()
})

test('JsParser test', done => {
  Jsparser.traverse(fs.readFileSync(routesJs, 'utf-8'), onTraverse)
    .then(routesMap => {
      expect(routesMap).toMatchSnapshot()
      done()
    })
})

test('TsParser test', done => {
  Tsparser.traverse(fs.readFileSync(routesTs, 'utf-8'), onTraverse)
    .then(routesMap => {
      expect(routesMap).toMatchSnapshot()
      done()
    })
})

test('getProperty test', () => {
  expect(getProperty(
    {
      data: {
        userInfo: {
          id: 1,
          name: 'xiaoming'
        }
      }
    }
    , ['data', 'userInfo', 'name'])).toBe('xiaoming')
})

test('toArray test - 1', () => {
  expect(Array.isArray(toArray('xiaoming'))).toBeTruthy()
})

test('toArray test - 2', () => {
  expect(Array.isArray(toArray(['xiaoming']))).toBeTruthy()
})

test('isObject test - 1', () => {
  expect(isObject({})).toBeTruthy()
})

test('isObject test - 2', () => {
  expect(isObject(null)).toBeFalsy()
})

test('DYNAMIC_REQ_PATH test', () => {
  expect(DYNAMIC_REQ_PATH).toMatchSnapshot()
})

test('isPushState test - 1', () => {
  expect(isPushState('https://xxx.com/__dynamic_routes__')).toBeTruthy()
})

test('isPushState test - 2', () => {
  expect(isPushState('https://xxx.com')).toBeFalsy()
})

test('getReqRoutePath test - 1', () => {
  expect(getReqRoutePath('https://xxx.com/__dynamic_routes__?url=https://yyy.com')).toBe('https://yyy.com')
})

test('getReqRoutePath test - 2', () => {
  expect(getReqRoutePath('https://xxx.com/api?url=https://yyy.com')).toBe('https://xxx.com/api')
})

test('normalizeRoutePath test - 1', () => {
  expect(normalizeRoutePath('api')).toBe('/api/')
})

test('normalizeRoutePath test - 2', () => {
  expect(normalizeRoutePath('/api')).toBe('/api/')
})

test('normalizeRoutePath test - 3', () => {
  expect(normalizeRoutePath('api/')).toBe('/api/')
})

test('normalizeRoutePath test - 4', () => {
  expect(normalizeRoutePath('/api/')).toBe('/api/')
})

test('findRoutePath test - 1', () => {
  expect(findRoutePath({}, '/')).toBeUndefined()
})

test('findRoutePath test - 2', () => {
  expect(findRoutePath({})).toBeUndefined()
})

test('findRoutePath test - 3', () => {
  expect(findRoutePath({
    '/home': '/components/home/index.js'
  }, '/home')).toBe('/home')
})