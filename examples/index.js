window.onload = function () {
  const div = document.querySelector('div')
  const input = document.querySelector('input')
  const select = document.querySelector('select')
  const start = document.querySelector('button')

  let fn = null
  // 获取所有的过渡函数
  const keys = Object.keys(ef)
  // 初始化选项
  keys.forEach(item => {
    const option = document.createElement('option')
    option.value = item
    option.innerText = item
    select.options.add(option)
  })

  function translate(value) {
    div.style.transform = `translate3d(${value}px,0,0)`
  }

  // 定时器
  function runTimeout(callback, timeout) {
    let id = null
    let now = performance.now()
    function run(timestamp) {
      let count = timestamp - now
      if (count > timeout) {
        count = timeout
      }

      callback({
        time: count,
        progress: count / timeout
      })

      if (count < timeout) {
        id = requestAnimationFrame(run)
      }
    }

    id = requestAnimationFrame(run)
    return function cancel() {
      cancelAnimationFrame(id)
    }
  }


  let cancel
  start.addEventListener('click', () => {
    // 清除定时器
    cancel?.()

    // 获取过渡函数
    fn = ef[select.value]

    /**
     * 贝塞尔函数返回一个函数
     * 参数 p1x p1y p2x p2y
     * 数据来源是input，四个数值使用逗号分割
     */
    if (select.value === 'cubicBezier') {
      fn = ef[select.value](...input.value.split(','))
    }

    if (typeof fn === 'function') {
      cancel = runTimeout(({ progress }) => {
        // 运动位置为500px
        const x = fn(progress) * 500
        translate(x)
      }, 1000)
    }
  })

}
