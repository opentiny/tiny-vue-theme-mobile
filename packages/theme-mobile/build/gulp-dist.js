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
    '@opentiny/vue-theme/' + importPath.replace(/\.css$/, '.less'),
    '@opentiny/vue-theme/' + importPath
  ]
  for (const c of candidates) {
    try {
      const resolved = require.resolve(c, {
        paths: [
          path.resolve(__dirname, '../'),
          path.resolve(__dirname, '../../')
        ]
      })
      if (fs.existsSync(resolved)) {
        return resolved.replace(/\\/g, '/')
      }
    } catch (e) {
      continue
    }
  }
  return null
}

const VueThemeResolver = {
  install: function(less, pluginManager) {
    pluginManager.addPreProcessor({
      process: function(src, extra) {
        return src.replace(
          /@import\s+["']@opentiny\/vue-theme\/([^"']+)["']/g,
          function(match, importPath) {
            const resolved = resolveVueTheme(importPath)
            if (resolved) {
              // 关键修复：如果是 .css 文件，直接内联内容，彻底绕过 less 的路径解析
              // pnpm store 路径中的 + 号会被 less URL 解码成空格，导致绝对路径失效
              if (resolved.endsWith('.css')) {
                try {
                  return fs.readFileSync(resolved, 'utf-8')
                } catch (e) {
                  console.warn('Warning: Cannot read ' + resolved, e.message)
                  return match
                }
              }
              return '@import "' + resolved + '"'
            }
            console.warn('Warning: Cannot resolve @opentiny/vue-theme/' + importPath)
            return match
          }
        )
      }
    })
  }
}

function mergeIndexLess() {
  const indexLessPath = path.resolve(__dirname, '../src/index.less')

  if (!fs.existsSync(indexLessPath)) {
    throw new Error(`index.less not found at ${indexLessPath}`)
  }

  const fileList = fg.sync(path.resolve(__dirname, '../src/*/index.less'))
  const importStr = fileList
    .map((filePath) => path.relative(path.dirname(indexLessPath), filePath))
    .map((p) => `@import './${p.replace(/\\/g, '/')}';`)
    .join('\n')

  const content = fs.readFileSync(indexLessPath, { encoding: 'utf-8' })
  const match = content.match(/(^\/\*\*.+?\*\/)/s)

  let note = ''
  if (match) {
    note = match[0]
  } else {
    console.warn('Warning: No JSDoc comment block found at top of index.less')
  }

  const output = `${note}\n\n${importStr}`.trim() + '\n'
  fs.writeFileSync(indexLessPath, output)
}

gulp.task('compile', () => {
  mergeIndexLess()

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