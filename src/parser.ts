import * as acorn from 'acorn'
import dynamicImport from 'acorn-dynamic-import'
import traverse from 'babel-traverse'
import { NormalObject } from '../types/custom'
import defaultTraverse from './traverse'

const dynamicParser = acorn.Parser.extend(dynamicImport)

const defaultParserOptions: acorn.Options & { plugins: NormalObject } = {
  ranges: true,
  locations: true,
  ecmaVersion: 2019,
  sourceType: 'module',
  onComment: () => {},
  plugins: {
    dynamicImport: true
  }
}

export abstract class Parser {
  static traverse(
    code: string,
    onTraverse: typeof defaultTraverse
  ): Promise<NormalObject> {
    return Promise.resolve({})
  }
  static includeFiles: Array<string>
}

class JsParser extends Parser {
  static traverse(
    code: string,
    onTraverse: typeof defaultTraverse
  ): Promise<NormalObject> {
    const routesMap: NormalObject = {}
    const record = (key: string, value: string) => {
      routesMap[key] = value
    }
    return new Promise(resolve => {
      traverse(JsParser.parse(code) as any, {
        ObjectExpression(path) {
          onTraverse(path, record)
        },
        exit() {
          resolve(routesMap)
        }
      })
    })
  }

  static parse(code: string, options?: Partial<acorn.Options>): acorn.Node {
    const type = options ? options.sourceType : 'module'
    const parserOptions = Object.assign(
      Object.create(null),
      defaultParserOptions,
      options
    )

    let ast
    let error
    let threw = false
    try {
      ast = dynamicParser.parse(code, parserOptions)
    } catch (e) {
      error = e
      threw = true
    }

    if (threw && type === 'module') {
      parserOptions.sourceType = 'script'
      if (Array.isArray(parserOptions.onComment)) {
        parserOptions.onComment.length = 0
      }
      try {
        ast = dynamicParser.parse(code, parserOptions)
        threw = false
      } catch (e) {
        threw = true
      }
    }

    if (threw) {
      throw error
    }

    return ast as acorn.Node
  }

  static includeFiles: Array<string> = ['.js', '.jsx']
}

class TsParser extends Parser {
  static traverse(
    code: string,
    onTraverse: typeof defaultTraverse
  ): Promise<NormalObject> {
    return JsParser.traverse(TsParser.transpile(code), onTraverse)
  }

  static transpile(code: string): string {
    const ts = require('typescript')
    const result = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ES2015, target: 'ES2015' }
    })
    return result.outputText
  }

  static includeFiles: Array<string> = ['.ts', '.tsx']
}

export default function createParser(extname: string): Parser | null {
  if (JsParser.includeFiles.includes(extname)) {
    return JsParser
  } else if (TsParser.includeFiles.includes(extname)) {
    return TsParser
  }
  return null
}
