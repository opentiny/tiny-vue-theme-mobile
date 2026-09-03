import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const replaceThemeLessPlugin = (): Plugin => ({
  name: 'replace-theme-less',
  enforce: 'pre',
  transform(code, id) {
    if (
      typeof code === 'string' &&
      code.includes('@opentiny/vue-theme-mobile') &&
      code.includes('.less')
    ) {
      return {
        code: code.replace(
          /@opentiny\/vue-theme-mobile\/([^'"]+)\.less/g,
          '@opentiny/vue-theme-mobile/$1.css'
        ),
        map: null
      }
    }
  }
})

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts(),
    replaceThemeLessPlugin()
  ],
  build: {
    lib: {
      entry: './index.ts'
    },
    rollupOptions: {
      external: [
        /@opentiny\/vue/,
        'vue',
        'xss',
        /@better-scroll/
      ],
      input: ['index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          preserveModules: true
        }
      ]
    }
  },
  resolve: {
    alias: [
      {
        find: /(.*@opentiny\/vue-theme-mobile\/.+)\.less$/,
        replacement: '$1.css'
      },
      {
        find: '@mobile-root',
        replacement: path.resolve(__dirname, '')
      }
    ]
  }
})