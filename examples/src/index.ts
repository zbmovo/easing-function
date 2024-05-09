import * as ef from "../../src";
import "./index.css";

const div = document.querySelector("div")!;
const input = document.querySelector("input")!;
const select = document.querySelector("select")!;
const start = document.querySelector("button")!;
const canvas = document.querySelector("canvas")!;

const dpr = window.devicePixelRatio;
const ctx = canvas.getContext("2d")!;

const [width, height] = [900, 600];
canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = width + "px";
canvas.style.height = height + "px";

ctx.scale(dpr, dpr);

type ValueOf<T> = {
  [K in keyof T]: T[K];
}[keyof T];

let fn:
  | ValueOf<Omit<typeof ef, "cubicBezier">>
  | ReturnType<(typeof ef)["cubicBezier"]>;

// 获取所有的过渡函数
const keys = Object.keys(ef);
// 初始化选项
keys.forEach((item) => {
  const option = document.createElement("option");
  option.value = item;
  option.innerText = item;
  select.options.add(option);
});

function translate(value: number) {
  div.style.transform = `translate3d(${value}px,0,0)`;
}

type Callback = (options: { time: number; progress: number }) => void;
// 定时器
function runTimeout(callback: Callback, timeout: number) {
  let id: number;
  let now = performance.now();
  function run(timestamp: number) {
    let count = timestamp - now;
    if (count > timeout) {
      count = timeout;
    }

    callback({
      time: count,
      progress: count / timeout,
    });

    if (count < timeout) {
      id = requestAnimationFrame(run);
    }
  }

  id = requestAnimationFrame(run);
  return () => cancelAnimationFrame(id);
}

let cancel: ReturnType<typeof runTimeout>;

start.addEventListener("click", () => {
  // 清除定时器
  cancel?.();

  const key = select.value as keyof typeof ef;

  /**
   * 贝塞尔函数返回一个函数
   * 参数 p1x p1y p2x p2y
   * 数据来源是input，四个数值使用逗号分割
   */
  if (key === "cubicBezier") {
    const params = input.value.split(",") as unknown as [
      number,
      number,
      number,
      number
    ];

    fn = ef[key](...params);
  } else {
    fn = ef[key];
  }

  if (typeof fn === "function") {
    // 下方是异步调用，会导致 ctx.restore 被提前调用，引发后续绘制异常
    // 此处是为了每次调用之前 restore 上次存储的绘制环境
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const sin = Math.sin(Math.PI / -2);
    const cos = Math.cos(Math.PI / -2);
    ctx.transform(cos, sin, -sin, cos, 300, 450);

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, 300, 300);
    ctx.closePath();
    ctx.restore();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.moveTo(0, 0);

    cancel = runTimeout(({ progress }) => {
      const x = fn(progress);
      translate(x * 700);
      const [dx, dy] = [x * 300, progress * 300];

      ctx.lineTo(dx, dy);
      ctx.stroke();
    }, 1000);
  }
});
