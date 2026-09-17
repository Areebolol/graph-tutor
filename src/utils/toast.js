let toastListeners = []

function showToast(message, type, duration) {
  const payload = { id: Date.now() + Math.random(), message, type, duration }
  toastListeners.forEach((l) => l(payload))
}

export const toast = {
  success: (message, duration = 3000) => showToast(message, 'success', duration),
  error: (message, duration = 5000) => showToast(message, 'error', duration),
  warning: (message, duration = 4000) => showToast(message, 'warning', duration),
  info: (message, duration = 3000) => showToast(message, 'info', duration),
  // 兼容 React 版 toast('msg') 调用
  __call: (message) => showToast(String(message), 'info', 3000),
  subscribe: (listener) => {
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  },
}

// 支持 toast('xxx') 写法
export default function toastFn(message, type = 'info') {
  if (typeof message === 'string' && arguments.length === 1) {
    showToast(message, 'info', 3000)
    return
  }
  showToast(message, type, 3000)
}

Object.assign(toastFn, toast)
