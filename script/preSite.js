import shell from 'shelljs'

const mode = process.argv[2] || 'dev'

shell.rm('-rf', 'sites')

// 复制@opentiny/vue-docs包到本地
shell.cp('-R', 'node_modules/@opentiny/vue-docs', 'sites')

// 删除一些不需要的依赖
const pkg = JSON.parse(shell.cat('sites/package.json'))
delete pkg.devDependencies['@opentiny-internal/unplugin-virtual-template']
shell.ShellString(JSON.stringify(pkg, null, 2)).to('sites/package.json')

// 修改sites/vite.config.js
const file = 'sites/vite.config.ts'
// eslint-disable-next-line no-template-curly-in-string
let configJs = shell.cat(file).replace('./demos/${env.VITE_APP_MODE}', '../packages/demos')
// 本地开发需要添加alias
if (mode === 'dev') {
  configJs = configJs.replace('alias: {', "alias: {\n        '@mobile-root': path.resolve('../packages/mobile'),")
}
const newConfigJs = configJs
  .split('\n')
  .filter((row) => !row.includes('virtualTemplatePlugin'))
  .filter((row) => !row.includes('getAlias'))
  .filter((row) => !row.includes('getOptimizeDeps'))
  .filter((row) => !row.includes('@opentiny/vue-renderless/types'))
  .filter((row) => !row.includes('@opentiny/vue-vite-import'))
  .map((row) => (row.includes('importPlugin([') ? '/*' + row : row))
  .filter((row) => !row.includes('vite-plugin-dynamic-import'))
  .map((row) => (row.includes('dynamicImportPlugin()') ? row + '*/' : row))
  .join('\n')

shell.ShellString(newConfigJs).to(file)

const mobileVersion = '1.0.3'
const themeVersion = '1.0.3'
// const mobileVersion = '1.0.0-alpha.10'
// const themeVersion = '1.0.0-alpha.10'

if (mode === 'alpha') {
  const rootPkg = JSON.parse(shell.cat('package.json'))
  rootPkg.devDependencies['@opentiny/vue-mobile'] = mobileVersion
  rootPkg.devDependencies['@opentiny/vue-theme-mobile'] = themeVersion
  shell.ShellString(JSON.stringify(rootPkg, null, 2)).to('package.json')
  shell.exec('node ./script/releaseAlpha.js')
} else if (mode === 'prod') {
  const rootPkg = JSON.parse(shell.cat('package.json'))
  rootPkg.devDependencies['@opentiny/vue-mobile'] = mobileVersion
  rootPkg.devDependencies['@opentiny/vue-theme-mobile'] = themeVersion
  shell.ShellString(JSON.stringify(rootPkg, null, 2)).to('package.json')
}

shell.exec('pnpm i --no-frozen-lockfile')
