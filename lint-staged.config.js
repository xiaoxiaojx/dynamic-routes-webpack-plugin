const lintTS = ['prettier --write', 'tslint --fix', 'git add']
const onlyPrettier = ['prettier --write', 'git add']

module.exports = {
  'src/**/*.ts': lintTS,
  'test/**/*.js': onlyPrettier
}
