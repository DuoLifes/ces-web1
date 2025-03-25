/* eslint-disable @typescript-eslint/no-unused-expressions */
import { mix, setProperty } from '@/utils'
import { defineStore } from 'pinia'

// 1. 定义严格类型接口[5](@ref)
interface ThemeState {
  primary: string
  success: string
  warning: string
  danger: string
  info: string
  headerBgColor: string
  headerTextColor: string
}

export const useThemeStore = defineStore('theme', {
  // 2. 显式声明状态类型[1,5](@ref)
  state: (): ThemeState => ({
    primary: '',
    success: '',
    warning: '',
    danger: '',
    info: '',
    headerBgColor: '#242f42',
    headerTextColor: '#fff',
  }),

  actions: {
    initTheme() {
      // 3. 类型安全遍历（限定合法键名）
      ;(['primary', 'success', 'warning', 'danger', 'info'] as const).forEach((type) => {
        const color = localStorage.getItem(`theme-${type}`) || ''
        color && this.setPropertyColor(color, type)
      })

      const headerBgColor = localStorage.getItem('header-bg-color')
      headerBgColor && this.setHeaderBgColor(headerBgColor)

      const headerTextColor = localStorage.getItem('header-text-color')
      headerTextColor && this.setHeaderTextColor(headerTextColor)
    },

    resetTheme() {
      ;(['primary', 'success', 'warning', 'danger', 'info'] as const).forEach((type) => {
        this.setPropertyColor('', type)
      })
    },

    // 4. 双重类型约束 + 类型断言[5](@ref)
    setPropertyColor(color: string, type: keyof ThemeState = 'primary') {
      // 安全断言：this 类型 + 属性类型
      ;(this as unknown as ThemeState)[type] = color
      setProperty(`--el-color-${type}`, color)
      localStorage.setItem(`theme-${type}`, color)
      this.setThemeLight(type)
    },

    setThemeLight(type: keyof ThemeState = 'primary') {
      // 5. 动态访问时强制类型断言
      const baseColor = (this as unknown as ThemeState)[type] as string

      ;[3, 5, 7, 8, 9].forEach((v) => {
        setProperty(`--el-color-${type}-light-${v}`, mix('#ffffff', baseColor, v / 10))
      })
      setProperty(`--el-color-${type}-dark-2`, mix('#ffffff', baseColor, 0.2))
    },

    setHeaderBgColor(color: string) {
      this.headerBgColor = color
      setProperty('--header-bg-color', color)
      localStorage.setItem('header-bg-color', color)
    },

    setHeaderTextColor(color: string) {
      this.headerTextColor = color
      setProperty('--header-text-color', color)
      localStorage.setItem('header-text-color', color)
    },
  },
})
