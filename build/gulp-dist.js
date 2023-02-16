/**
 * 打包 theme 目录到 dist 目录
 */

const gulp = require('gulp')
const less = require('gulp-less')
const cssmin = require('gulp-clean-css')
const prefixer = require('gulp-autoprefixer')

const source = '../src'
const dist = '../dist'

gulp.task('compile', () => {
  gulp
    .src([`${source}/**/index.less`, `${source}/index.less`])
    .pipe(less())
    .pipe(
      prefixer({
        borwsers: ['last 1 version', '> 1%', 'not ie <= 8'],
        cascade: true,
        remove: true
      })
    )
    .pipe(cssmin())
    .pipe(gulp.dest(dist))
})

gulp.task('copycssvar', () => {
  gulp
    .src([`${source}/**/*.js`, `${source}/index.js`])
    .pipe(gulp.dest(`${dist}`))
})

gulp.task('copysvgs', () => {
  gulp.src([`${source}/svgs/**`]).pipe(gulp.dest(`${dist}/svgs`))
})

gulp.task('copyimage', () => {
  gulp.src([`${source}/images/**`]).pipe(gulp.dest(`${dist}/images`))
})

gulp.task('build', ['compile', 'copycssvar', 'copysvgs', 'copyimage'])
