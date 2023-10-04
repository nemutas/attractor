import * as THREE from 'three'
import { three } from './core/Three'
import { gui } from './Gui'

export class Canvas {
  private readonly SIZE = 1000
  private group = new THREE.Group()

  private fps = document.querySelector<HTMLElement>('.fps')!
  private counter = 0

  constructor(canvas: HTMLCanvasElement) {
    this.init(canvas)
    this.createPointsGroup()
    three.animation(this.anime)
  }

  private init(canvas: HTMLCanvasElement) {
    three.setup(canvas)

    three.scene.background = new THREE.Color('#000')

    three.camera.position.set(-0.989, 0.347, -2.342)
    three.controls.enableDamping = true

    const axesHelper = new THREE.AxesHelper()
    axesHelper.visible = false
    three.scene.add(axesHelper)
    gui.add(axesHelper, 'visible').name('axes helper')
  }

  private createPointsGroup() {
    three.scene.add(this.group)
    this.group.position.z = -0.7

    const material = new THREE.PointsMaterial({
      color: '#fff',
      opacity: 0.02,
      transparent: true,
      size: 2,
      sizeAttenuation: false,
      depthTest: false,
      depthWrite: false,
    })

    for (let i = 0; i < 500; i++) {
      this.group.add(this.createPoints(material))
    }

    gui.addColor(material, 'color')
    gui.add(material, 'opacity', 0.01, 0.1, 0.001)
  }

  private createPoints(material: THREE.PointsMaterial, convergency = 1) {
    const geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(this.SIZE * 3)
    positions[0] = Math.random() * 2 - 1
    positions[1] = Math.random() * 2 - 1
    positions[2] = Math.random() + 0.5

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const mesh = new THREE.Points(geometry, material)
    mesh.userData.convergency = convergency
    return mesh
  }

  private quasi_periodic_attractor(x: number, y: number, z: number) {
    const [a, b, c, d, e, f] = [0.95, 0.7, 0.6, 3.5, 0.25, 0.1]
    // const [a, b, c, d, e, f] = [1, 0.7, 0.6, 3.5, 0.25, 0]
    const dx = (z - b) * x - d * y
    const dy = d * x + (z - b) * y
    const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x
    return [dx, dy, dz]
  }

  // private strange_attractor(x: number, y: number, z: number) {
  //   const [s, r, b] = [10, 28, 8 / 3]
  //   const dx = -s * x + s * y
  //   const dy = -x * z + r * x - y
  //   const dz = x * y - b * z
  //   return [dx, dy, dz]
  // }

  private calc() {
    for (let points of this.group.children) {
      const p = points as THREE.Points

      const pos = p.geometry.attributes.position.array
      const prevIdx = (this.counter - 1) % this.SIZE
      const idx = this.counter % this.SIZE

      const px = pos[prevIdx * 3 + 0]
      const py = pos[prevIdx * 3 + 1]
      const pz = pos[prevIdx * 3 + 2]
      const [dx, dy, dz] = this.quasi_periodic_attractor(px, py, pz)

      let x = px + dx * 0.01 * p.userData.convergency
      let y = py + dy * 0.01 * p.userData.convergency
      let z = pz + dz * 0.01 * p.userData.convergency

      if (Math.hypot(x - px, y - py, z - pz) < 0.0001) {
        x = Math.random()
        y = Math.random()
        z = Math.random()
      }

      pos[idx * 3 + 0] = x
      pos[idx * 3 + 1] = y
      pos[idx * 3 + 2] = z

      p.geometry.attributes.position.needsUpdate = true
    }
  }

  private anime = () => {
    this.counter++
    if (this.counter % 10 === 0) {
      this.fps.innerText = (1 / three.time.delta).toFixed(0)
    }

    this.calc()

    three.controls.update()
    three.render()
  }

  dispose() {
    three.dispose()
  }
}
