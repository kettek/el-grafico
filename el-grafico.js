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

  stroke: currentColor;
  fill: none;
  fill-opacity: 0.5;

  --x-axis-major-stroke: currentColor;
  --x-axis-major-stroke-width: 1px;
  --x-axis-major-stroke-opacity: 0.2;
  --x-axis-minor-stroke: currentColor;
  --x-axis-minor-stroke-width: 1px;
  --x-axis-minor-stroke-opacity: 0.1;
  --y-axis-major-stroke: currentColor;
  --y-axis-major-stroke-width: 1px;
  --y-axis-major-stroke-opacity: 0.2;
  --y-axis-minor-stroke: currentColor;
  --y-axis-minor-stroke-width: 1px;
  --y-axis-minor-stroke-opacity: 0.1;
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

:host svg {
  grid-area: data;
  width: 100%;
  height: 100%;
  fill: none;
}
:host #axis-x line.major {
  stroke: var(--x-axis-major-stroke);
  stroke-width: var(--x-axis-major-stroke-width);
  stroke-opacity: var(--x-axis-major-stroke-opacity);
}
:host #axis-x line.minor {
  stroke: var(--x-axis-minor-stroke);
  stroke-width: var(--x-axis-minor-stroke-width);
  stroke-opacity: var(--x-axis-minor-stroke-opacity);
}
:host #axis-y line.major {
  stroke: var(--y-axis-major-stroke);
  stroke-width: var(--y-axis-major-stroke-width);
  stroke-opacity: var(--y-axis-major-stroke-opacity);
}
:host #axis-y line.minor {
  stroke: var(--y-axis-minor-stroke);
  stroke-width: var(--y-axis-minor-stroke-width);
  stroke-opacity: var(--y-axis-minor-stroke-opacity);
}
</style>
  <slot id="x" name="x"></slot>
  <slot id="y" name="y"></slot>
  <slot></slot>
`
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('preserveAspectRatio', 'none')

    let g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.id = 'axis-x'
    svg.appendChild(g)
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.id = 'axis-y'
    svg.appendChild(g)

    shadow.appendChild(svg)
  }
}

customElements.define('el-grafico', ElGrafico)

class ElAxis extends HTMLElement {
  constructor() {
    super()
  }
  connectedCallback() {
    let mutObs = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type == "attributes") {
          Array.prototype.forEach.call(this.parentNode.querySelectorAll('el-data'), el => {
            el.makeSVG()
          })
        }
      })
      this.makeLines()
    })
    mutObs.observe(this, {
      attributes: true,
      attributeOldValue: true,
    })
    this.makeLines()
  }
  makeLines() {
    if (this.getAttribute('slot') == 'y') {
      this.makeYLines()
    } else {
      this.makeXLines()
    }
  }
  makeXLines() {
    let g = this.parentNode.shadowRoot.querySelector('g#axis-x')
    if (this.hasAttribute('style')) g.setAttribute('style', this.getAttribute('style'))
    // Clear our lines.
    g.innerHTML = ''
    // Get our ranges and steps.
    let xMin = Number(this.getAttribute('min'))
    let xMax = Number(this.getAttribute('max'))
    // Build our lines.
    if (this.hasAttribute('minor')) {
      let xMinor = Number(this.getAttribute('minor'))
      for (let i = 0; i < xMax-xMin; i += xMinor) {
        let x = i/(xMax-xMin) * 100
        this.makeLine(g, 'minor', x, 0, x, 100)
      }
    }
    if (this.hasAttribute('major')) {
      let xMajor = Number(this.getAttribute('major'))
      for (let i = 0; i < xMax-xMin; i += xMajor) {
        let x = i/(xMax-xMin) * 100
        this.makeLine(g, 'major', x, 0, x, 100)
      }
    }
  }
  makeYLines() {
    let g = this.parentNode.shadowRoot.querySelector('g#axis-y')
    if (this.hasAttribute('style')) g.setAttribute('style', this.getAttribute('style'))
    // Clear our lines.
    g.innerHTML = ''
    // Get our ranges and steps.
    let yMin = Number(this.getAttribute('min'))
    let yMax = Number(this.getAttribute('max'))
    // Build our lines.
    if (this.hasAttribute('minor')) {
      let yMinor = Number(this.getAttribute('minor'))
      for (let i = 0; i < yMax-yMin; i += yMinor) {
        let y = i/(yMax-yMin) * 100
        this.makeLine(g, 'minor', 0, y, 100, y)
      }
    }
    if (this.hasAttribute('major')) {
      let yMajor = Number(this.getAttribute('major'))
      for (let i = 0; i < yMax-yMin; i += yMajor) {
        let y = i/(yMax-yMin) * 100
        this.makeLine(g, 'major', 0, y, 100, y)
      }
    }
  }
  makeLine(g, c, x1, y1, x2, y2) {
      let line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('class', c)
      line.setAttribute('x1', x1)
      line.setAttribute('y1', y1)
      line.setAttribute('x2', x2)
      line.setAttribute('y2', y2)
      line.setAttribute('vector-effect', 'non-scaling-stroke')
      g.appendChild(line)
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
:host {
  stroke: currentColor;
  fill: none;
  fill-opacity: 0.5;
}
</style>
<slot id="label" name="label"></slot>
<slot id="legend" name="legend"></slot>
<slot></slot>
`
  }
  connectedCallback() {
    let mutObs = new MutationObserver(mutations => {
      this.makeSVG()
    })
    mutObs.observe(this, {
      attributes: true,
      characterData: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    })
    if (!this.graph) {
      let svg = this.parentNode.shadowRoot.querySelector('svg')
      let g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.class = 'graph'
      svg.appendChild(g)
      this.graph = g
    }
    this.makeSVG()
  }
  makeSVG() {
    this.graph.setAttribute('style', this.getAttribute('style'))
    switch(this.parentNode.getAttribute('type')) {
      case 'line-graph':
      default:
        this.makeLineGraph()
    }
  }
  makeLineGraph() {
    // Sync our containment info.
    this.xAxis = this.parentNode.querySelector("el-axis[slot=x]")
    this.yAxis = this.parentNode.querySelector("el-axis[slot=y]")
    this.xMajor = Number(this.xAxis.getAttribute('major'))
    this.xMinor = Number(this.xAxis.getAttribute('minor'))
    this.xMin = Number(this.xAxis.getAttribute('min'))
    this.xMax = Number(this.xAxis.getAttribute('max'))
    this.yMin = Number(this.yAxis.getAttribute('min'))
    this.yMax = Number(this.yAxis.getAttribute('max'))
    this.yMajor = Number(this.yAxis.getAttribute('major'))
    this.yMinor = Number(this.yAxis.getAttribute('minor'))

    // Get our constants.
    const svg = this.parentNode.shadowRoot.querySelector('svg')
    let minX = 0
    let maxX = this.xMax - this.xMin
    let minY = 0
    let maxY = this.yMax - this.yMin
    // Clear our SVG.
    this.graph.innerHTML = ''
    // Create our nodes.
    let nodes = Array.from(this.querySelectorAll('el-node'))
    // Sort our nodes by x value.
    Array.prototype.sort.call(nodes, (a,b) => {
      return Number(a.getAttribute('x')) - Number(b.getAttribute('x'))
    })
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
    this.graph.appendChild(path)
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