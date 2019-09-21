class ElGrafico extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = `
<style>
:host {
  display: grid;
  border: 1px solid red;
  grid-template-areas:
    "title  title  title"
    "axis-y data   data"
    "axis-y data   data"
    ".      axis-x axis-x";
  grid-template-rows: auto 1fr 1fr auto;
  grid-template-columns: auto 1fr 1fr auto;
  grid-gap: 2em;
  height: 500px;
  width: 600px;
}

::slotted(el-title) {
  display: block;
  text-align: center;
  grid-area: title;
}
::slotted(el-axis[slot=x]) {
  display: flex;
  justify-content: center;
  grid-area: axis-x;
  border: 1px solid yellow;
}
::slotted(el-axis[slot=y]) {
  grid-area: axis-y;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid green;
  width: 1em;
  word-wrap: break-word;
}
::slotted(el-data) {
  display: block;
  grid-area: data;
  border: 1px solid blue;
  box-sizing: border-box;
}

</style>
  <slot id="x" name="x"></slot>
  <slot id="y" name="y"></slot>
  <slot></slot>
`
  }
}

customElements.define('el-grafico', ElGrafico)

class ElAxis extends HTMLElement {
  constructor() {
    super()
  }
  connectedCallback() {
    let mutObs = new MutationObserver(mutations => {
      console.log(mutations)
      mutations.forEach(mutation => {
        if (mutation.type == "attributes") {
          Array.prototype.forEach.call(this.parentNode.querySelectorAll('el-data'), el => {
            el.makeSVG()
          })
        }
      })
    })
    mutObs.observe(this, {
      attributes: true,
      attributeOldValue: true,
    })

  }
}
customElements.define('el-axis', ElAxis)

class ElData extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = `
<style>
:host {
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  width: 100%;
  height: 100%;
  stroke: currentColor;
  fill: none;
  fill-opacity: 0.5;
}
::slotted(label) {
  display: none;
  border: 1px solid red;
}
::slotted(legend) {
  display: none;
  border: 1px solid pink;
}
::slotted(el-node) {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 100;
}
:host svg {
  width: 100%;
  height: 100%;
}
</style>
<slot id="label" name="label"></slot>
<slot id="legend" name="legend"></slot>
<slot></slot>
`
    shadow.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
  }
  connectedCallback() {
    let mutObs = new MutationObserver(mutations => {
      console.log(mutations)
      mutations.forEach(mutation => {
        this.makeSVG()
      })
    })
    mutObs.observe(this, {
      attributes: true,
      characterData: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      childList: true,
    })
    this.makeSVG()
  }
  makeSVG() {
    // Sync our containment info.
    this.xAxis = this.parentNode.querySelector("el-axis[slot=x]")
    this.yAxis = this.parentNode.querySelector("el-axis[slot=y]")
    this.xMin = Number(this.xAxis.getAttribute('min'))
    this.xMax = Number(this.xAxis.getAttribute('max'))
    this.yMin = Number(this.yAxis.getAttribute('min'))
    this.yMax = Number(this.yAxis.getAttribute('max'))

    // Get our constants.
    const svg = this.shadowRoot.querySelector('svg')
    let nodes = Array.from(this.querySelectorAll('el-node'))
    // Sort our nodes by x value.
    Array.prototype.sort.call(nodes, (a,b) => {
      return Number(a.getAttribute('x')) - Number(b.getAttribute('x'))
    })
    // Clear our SVG.
    svg.innerHTML = ''
    // Create our nodes.
    let minX = 0
    let maxX = this.xMax - this.xMin
    let minY = 0
    let maxY = this.yMax - this.yMin
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('preserveAspectRatio', 'none')
    let d = `0,100`
    let lastX, lastY = 0
    nodes.forEach(node => {
      let x = (Number(node.getAttribute('x')) - this.xMin) / maxX * 100
      let y = 100 - (Number(node.getAttribute('y')) - this.yMin) / maxY * 100
/*      let point = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      point.setAttribute('points', this.getShapePoints(x,y))
      point.setAttribute('fill', 'currentColor')
      point.setAttribute('vector-effect', 'non-scaling-stroke')
      svg.appendChild(point)*/
      d += ` ${x},${y}`
      node.style.left = x+'%'
      node.style.top = y+'%'
      lastX = x
      lastY = y
    })
    d += ` 100,${lastY} 100,100`
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    path.setAttribute('points', d)
    path.setAttribute('vector-effect', 'non-scaling-stroke')
    svg.appendChild(path)
  }
  getShapePoints(x, y) {
    let points = ''
    let s = 3
    for (let i = 0; i < 360; i+=20) {
      points += `${x+Math.cos(i)*s},${y+Math.sin(i)*s} `
    }
    return points
  }
}

customElements.define('el-data', ElData)