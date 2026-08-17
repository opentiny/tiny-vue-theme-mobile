/**
 * 打包 src 目录到 dist 目录
 */

const gulp = require('gulp')
const less = require('gulp-less')
const cssmin = require('gulp-clean-css')
const prefixer = require('gulp-autoprefixer')
const fg = require('fast-glob')
const fs = require('node:fs')
const path = require('path')

const source = '../src'
const dist = '../dist'

function resolveVueTheme(importPath) {
  const candidates = [
    '@opentiny/vue-theme/' + importPath,
    '@opentiny/vue-theme/' + importPath.replace(/\.css$/, '.less')
  ]
  for (const c of candidates) {
    try {
      return require.resolve(c, {
        paths: [
          path.resolve(__dirname, '../'),
          path.resolve(__dirname, '../../')
        ]
      })
    } catch (e) {
      continue
    }
  }
  return null
}

// 将所有组件下的index.less合并到src下的index.less
const fileList = fg.sync('../src/*/index.less')
const importStr = fileList
  .map((filePath) => filePath.replace('../src/', './'))
  .map((p) => `@import '${p}';`)
  .join('\n')
const note = fs.readFileSync('../src/index.less', { encoding: 'utf-8' }).match(/(^\/\*\*.+?\*\/)/s)[0]
fs.writeFileSync('../src/index.less', `${note}\n\n${importStr}`)

// Less PreProcessor：在 less 解析每个文件前，把 @opentiny/vue-theme/xxx 替换为绝对路径
const VueThemeResolver = {
  install: function(less, pluginManager) {
    pluginManager.addPreProcessor({
      process: function(src, extra) {
        return src.replace(
          /@import\s+["']@opentiny\/vue-theme\/([^"']+)["']/g,
          function(match, importPath) {
            const resolved = resolveVueTheme(importPath)
            if (resolved) {
              return '@import "' + resolved.replace(/\\/g, '/') + '"'
            }
            console.warn('Warning: Cannot resolve @opentiny/vue-theme/' + importPath)
            return match
          }
        )
      }
    })
  }
}

gulp.task('compile', () => {
  return gulp
    .src([`${source}/**/index.less`, `${source}/index.less`])
    .pipe(
      less({
        plugins: [VueThemeResolver]
      })
    )
    .pipe(
      prefixer({
        overrideBrowserslist: ['last 1 version', '> 1%', 'not ie <= 8'],
        cascade: true,
        remove: true
      })
    )
    .pipe(cssmin())
    .pipe(gulp.dest(dist))
})

gulp.task('copycssvar', () => {
  return gulp.src([`${source}/**/*.js`, `${source}/index.js`], { allowEmpty: true }).pipe(gulp.dest(`${dist}`))
})

gulp.task('copysvgs', () => {
  return gulp.src([`${source}/svgs/**`]).pipe(gulp.dest(`${dist}/svgs`))
})

gulp.task('copyimage', () => {
  return gulp.src([`${source}/images/**`]).pipe(gulp.dest(`${dist}/images`))
})

gulp.task('build', gulp.series('compile', 'copycssvar', 'copysvgs', 'copyimage'))
