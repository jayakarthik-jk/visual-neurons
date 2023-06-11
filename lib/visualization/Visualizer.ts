import NeuralNetwork from "../core/NeuralNetwork";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import LayerVisualizer, { LayerVisualizerOptions } from "./LayerVisualizer";

export interface VisualizerOptions {
  viewWidth?: number;
  viewHeight?: number;
  nodeSize?: number;
  nodeColor?: number;
  nodeWireframe?: boolean;
  gridHelper?: boolean;
  axesHelper?: boolean;
  layerOptions?: LayerVisualizerOptions;
}

class NetworkVisualizer {
  viewWidth: number;
  viewHeight: number;
  nodeSize: number;
  nodeColor: number;
  nodeWireframe: boolean;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbitControl: OrbitControls;
  gridHelper?: THREE.GridHelper;
  axesHelper?: THREE.AxesHelper;
  enableGridHelper: boolean;
  enableAxesHelper: boolean;
  layers: LayerVisualizer[] = [];
  gap: number = 1;
  columns: number = 1;
  rows: number = 1;
  constructor(
    public root: HTMLElement,
    public network: NeuralNetwork,
    {
      viewWidth = window.innerWidth,
      viewHeight = window.innerHeight,
      nodeSize = 0.1,
      nodeColor = 0xffffff,
      nodeWireframe = false,
      gridHelper = false,
      axesHelper = false,
      layerOptions = {},
    }: VisualizerOptions = {}
  ) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.nodeSize = nodeSize;
    this.nodeColor = nodeColor;
    this.nodeWireframe = nodeWireframe;
    this.enableGridHelper = gridHelper;
    this.enableAxesHelper = axesHelper;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.viewWidth, this.viewHeight);
    this.root.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.viewWidth / this.viewHeight,
      0.1,
      1000
    );
    this.camera.position.set(4, 4, 4);

    this.orbitControl = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControl.update();
    if (this.enableGridHelper) {
      this.gridHelper = new THREE.GridHelper(5);
      this.scene.add(this.gridHelper);
    }
    if (this.enableAxesHelper) {
      this.axesHelper = new THREE.AxesHelper(5);
      this.scene.add(this.axesHelper);
    }
    this.#initialize(layerOptions);
    this.#setCameraPosition();
    this.renderer.setAnimationLoop(this.draw);
  }

  #initialize(options?: LayerVisualizerOptions) {
    const max = Math.max(...this.network.layerMeta);
    this.gap = Math.max(...this.network.layerMeta, 1) / 2;
    this.columns = this.#matrixRepresentation(
      Math.max(...this.network.layerMeta)
    );
    this.rows = Math.max(...this.network.layerMeta) / this.columns;

    for (let i = 0; i < this.network.layers.length; i++) {
      const layer = new LayerVisualizer(this.network.layers[i], this, {
        xOffset: i * this.gap,
        max,
        gap: this.gap,
        ...options,
      });
      this.layers.push(layer);
    }
  }

  #matrixRepresentation(n: number) {
    let sqrt = Math.floor(Math.sqrt(n));
    while (n % sqrt !== 0) {
      sqrt--;
    }
    return sqrt;
  }

  #setCameraPosition() {
    const minX = 0;
    const maxX = (this.network.layerMeta.length - 1) * this.gap;
    const minY = 0;
    const maxY = (this.rows - 1) * this.gap;
    const minZ = 0;
    const maxZ = (this.columns - 1) * this.gap;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const radius = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    this.camera.position.set(centerX, centerY, centerZ + radius * 2); // Adjust the multiplier as needed
    this.camera.lookAt(centerX, centerY, centerZ);
    this.orbitControl.update();
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera);
  };

  async feedForwardVisualization(layerIndex: number) {
    for (let i = 0; i < this.layers.length; i++) {
      const layerVisualizer = this.layers[i];
      if (layerIndex === layerVisualizer.index) {
        await layerVisualizer.feedForwardVisualization();
      }
    }
  }
  async backPropagateVisualization(layerIndex: number) {
    for (let i = 0; i < this.layers.length; i++) {
      const layerVisualizer = this.layers[i];
      if (layerIndex === layerVisualizer.index) {
        await layerVisualizer.backPropagateVisualization();
      }
    }
  }
}

export default NetworkVisualizer;
