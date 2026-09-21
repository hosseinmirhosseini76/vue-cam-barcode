const STYLE_ID = 'dz-barcode-scanner-css'

const CSS = `.dz-scan{position:relative;overflow:hidden;background:#000;aspect-ratio:3/4;width:100%;max-width:28rem;margin:0 auto;border-radius:1rem}
.dz-scan__video{width:100%;height:100%;object-fit:cover}
.dz-scan__mask{position:absolute;inset:0;pointer-events:none;background:radial-gradient(transparent 36%,rgb(0 0 0 / .45) 37%)}
.dz-scan__frame{position:absolute;inset:22%;border:2px solid #22c55e;border-radius:.75rem;box-shadow:0 0 0 2px rgb(255 255 255 / .25)}
.dz-scan__torch,.dz-scan__error,.dz-scan__done,.dz-scan__count{position:absolute;z-index:1}
.dz-scan__torch,.dz-scan__error,.dz-scan__done{left:50%;transform:translateX(-50%)}
.dz-scan__torch{bottom:.85rem;border:0;border-radius:999px;padding:.45rem .9rem;background:rgb(255 255 255 / .92);color:#111;font:600 .8rem/1.2 system-ui,sans-serif}
.dz-scan--multiple .dz-scan__torch{top:.75rem;bottom:auto;left:.75rem;transform:none}
.dz-scan__count{top:.75rem;right:.75rem;border-radius:999px;padding:.35rem .7rem;background:rgb(34 197 94 / .95);color:#052e16;font:700 .8rem/1 system-ui,sans-serif}
.dz-scan__done{bottom:.85rem;border:0;border-radius:999px;padding:.55rem 1.1rem;background:#22c55e;color:#052e16;font:700 .85rem/1.2 system-ui,sans-serif}
.dz-scan__error{bottom:.85rem;width:90%;margin:0;color:#fff;text-align:center;font:600 .8rem/1.35 system-ui,sans-serif;text-shadow:0 1px 2px #000}
.dz-scan--multiple .dz-scan__error{bottom:3.2rem}`

export function injectScannerCss(): void {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = CSS
}
