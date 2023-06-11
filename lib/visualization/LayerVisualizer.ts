import * as THREE from "three";
import Layer from "../core/Layer";
import NetworkVisualizer from "./Visualizer";

export interface LayerVisualizerOptions {
  duration?: number;
  feedForwardDuration?: number;
  backPropagationDuration?: number;
}
export interface LayerVisualizerProps {
  xOffset: number;
  max: number;
  gap: number;
  duration?: number;
  feedForwardDuration?: number;
  backPropagationDuration?: number;
}

type Node = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;

export class LayerVisualizer {
  inputNodes: Node[] = [];
  outputNodes: Node[] = [];
  lines: THREE.Line[][] = [];
  index: number;
  feedForwardDuration: number = 1;
  backPropagationDuration: number = 1;
  duration: number;
  constructor(
    public layer: Layer,
    public visualizer: NetworkVisualizer,
    {
      max,
      xOffset,
      gap,
      duration,
      feedForwardDuration,
      backPropagationDuration,
    }: LayerVisualizerProps = {
      xOffset: 0,
      max: 0,
      gap: 1,
    }
  ) {
    // input layer
    this.index = this.layer.layerIndex;
    this.duration = duration || 1;
    if (feedForwardDuration) {
      this.feedForwardDuration =
        feedForwardDuration > 1
          ? 1
          : feedForwardDuration < 0
          ? 0
          : feedForwardDuration;
    }
    if (backPropagationDuration) {
      this.backPropagationDuration =
        backPropagationDuration > 1
          ? 1
          : backPropagationDuration < 0
          ? 0
          : backPropagationDuration;
    }

    this.drawLayer(
      layer.inputCount,
      max,
      xOffset,
      this.inputNodes,
      this.visualizer.columns
    );

    // output layer
    this.drawLayer(
      layer.outputCount,
      max,
      xOffset + gap,
      this.outputNodes,
      this.visualizer.columns
    );

    // connect the nodes
    this.drawLines();
  }

  #map(
    n: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
  ) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  }

  async backPropagateVisualization() {
    for (let i = 0; i < this.layer.outputCount; i++) {
      for (let j = 0; j < this.layer.inputCount; j++) {
        const line = this.lines[i][j];
        const weight = this.layer.weights.data[i][j];
        if (line.material instanceof THREE.Material) {
          const node2 = this.inputNodes[j];
          const node1 = this.outputNodes[i];

          const dotGeometry = new THREE.CircleGeometry(0.05, 1);
          const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.copy(node1.position);
          this.visualizer.scene.add(dot);

          const edgeLength = node1.position.distanceTo(node2.position);
          const edgeDirection = new THREE.Vector3()
            .subVectors(node2.position, node1.position)
            .normalize();

          while (dot.position.distanceTo(node1.position) < edgeLength) {
            dot.position.addScaledVector(
              edgeDirection,
              this.backPropagationDuration
            );
            await new Promise((resolve) => setTimeout(resolve, this.duration));
          }
          this.visualizer.scene.remove(dot);

          const mappedWeight = this.#map(weight, -1, 1, 0, 1);

          // @ts-ignore
          line.material.color.setHex(0xff6666);
          line.material.opacity = mappedWeight;
          node2.material.opacity = mappedWeight;
          await new Promise((resolve) => setTimeout(resolve, this.duration));
        }
      }
    }

    for (let i = 0; i < this.layer.outputCount; i++) {
      for (let j = 0; j < this.layer.inputCount; j++) {
        const line = this.lines[i][j];
        if (line.material instanceof THREE.Material) {
          line.material.opacity = 0.1;
          // @ts-ignore
          line.material.color.setHex(0xffffff);
        }
      }
    }
  }

  async feedForwardVisualization() {
    for (let i = 0; i < this.layer.outputCount; i++) {
      for (let j = 0; j < this.layer.inputCount; j++) {
        const line = this.lines[i][j];
        const weight = this.layer.weights.data[i][j];
        if (line.material instanceof THREE.Material) {
          const node1 = this.inputNodes[j];
          const node2 = this.outputNodes[i];

          const dotGeometry = new THREE.CircleGeometry(0.05, 1);
          const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.copy(node1.position);
          this.visualizer.scene.add(dot);

          const edgeLength = node1.position.distanceTo(node2.position);
          const edgeDirection = new THREE.Vector3()
            .subVectors(node2.position, node1.position)
            .normalize();

          while (dot.position.distanceTo(node1.position) < edgeLength) {
            dot.position.addScaledVector(
              edgeDirection,
              this.feedForwardDuration
            );
            await new Promise((resolve) => setTimeout(resolve, this.duration));
          }
          this.visualizer.scene.remove(dot);

          const mappedWeight = this.#map(weight, -1, 1, 0, 1);

          // @ts-ignore
          line.material.color.setHex(0x336699);
          node2.material.opacity = mappedWeight;
          line.material.opacity = mappedWeight;

          await new Promise((resolve) => setTimeout(resolve, this.duration));
        }
      }
    }

    for (let i = 0; i < this.layer.outputCount; i++) {
      for (let j = 0; j < this.layer.inputCount; j++) {
        const line = this.lines[i][j];
        if (line.material instanceof THREE.Material) {
          line.material.opacity = 0.1;
          // @ts-ignore
          line.material.color.setHex(0xffffff);
        }
      }
    }
  }

  drawLayer(
    nodeCount: number,
    maxNodeAcrossLayers: number,
    offsetX: number,
    nodes: Node[],
    gridColumns: number = 4
  ) {
    const maxRow = maxNodeAcrossLayers / gridColumns;
    const maxCol = gridColumns;

    const totalRow = Math.ceil(nodeCount / gridColumns);
    const totalCol = Math.min(nodeCount, gridColumns);

    const spacingY = maxRow > 1 ? maxNodeAcrossLayers / (maxRow - 1) : 0;
    const spacingZ = maxCol > 1 ? maxNodeAcrossLayers / (maxCol - 1) : 0;

    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / gridColumns);
      const col = i % gridColumns;
      // find number of nodes in this column

      const nodeGeo = new THREE.SphereGeometry(
        this.visualizer.nodeSize,
        16,
        16
      );
      const nodeMat = new THREE.MeshBasicMaterial({
        color: this.visualizer.nodeColor,
        wireframe: this.visualizer.nodeWireframe,
        transparent: true,
        opacity: 0.1,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);

      const offsetY = (maxRow - totalRow) * spacingY * 0.5 + row * spacingY;
      const offsetZ = (maxCol - totalCol) * spacingZ * 0.5 + col * spacingZ;

      node.position.set(offsetX, offsetY, offsetZ);
      this.visualizer.scene.add(node);
      nodes.push(node);
    }
  }

  drawLines() {
    for (let i = 0; i < this.layer.outputCount; i++) {
      const output = this.outputNodes[i];
      const row: THREE.Line[] = [];
      for (let j = 0; j < this.layer.inputCount; j++) {
        const input = this.inputNodes[j];
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          input.position,
          output.position,
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: this.visualizer.nodeColor,
          opacity: 0.1,
          transparent: true,
        });

        const line = new THREE.Line(lineGeo, lineMat);
        this.visualizer.scene.add(line);
        row.push(line);
      }
      this.lines.push(row);
    }
  }
}

export default LayerVisualizer;
