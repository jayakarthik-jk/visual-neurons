import Matrix from "../lib/Matrix";
import Layer from "./Layer";
import NetworkVisualizer, {
  VisualizerOptions,
} from "../visualization/Visualizer";

export interface NetworkOptions {
  learningRate?: number;
  visualize?: boolean;
  visualizerRoot?: HTMLElement;
  visualizerOptions?: VisualizerOptions;
}

class NeuralNetwork {
  layers: Layer[];
  learningRate: number = 0.1;
  visualizer?: NetworkVisualizer;
  constructor(public layerMeta: number[], options: NetworkOptions = {}) {
    this.layers = new Array(layerMeta.length - 1);

    if (options.learningRate) {
      this.learningRate = options.learningRate;
    }

    for (let i = 0; i < layerMeta.length - 1; i++) {
      this.layers[i] = new Layer(layerMeta[i], layerMeta[i + 1], i);
    }
    if (options.visualize) {
      const visualizerRoot = options.visualizerRoot || document.body;
      this.visualizer = new NetworkVisualizer(
        visualizerRoot,
        this,
        options.visualizerOptions
      );
      for (const layer of this.layers) {
        layer.visualizer = this.visualizer;
      }
    }
  }

  static async #feedForward(network: NeuralNetwork, inputs: Matrix) {
    let outputs = inputs;

    for (let i = 0; i < network.layers.length; i++) {
      outputs = await Layer.feedForward(network.layers[i], outputs);
    }
    return outputs;
  }

  static async #backPropagate(network: NeuralNetwork, targets: Matrix) {
    let layerOutputs = network.layers[network.layers.length - 1].outputs;
    let error = targets.subtract(layerOutputs);
    for (let i = network.layers.length - 1; i >= 0; i--) {
      error = await Layer.backPropagate(
        network.layers[i],
        error,
        network.learningRate
      );
    }
    return error;
  }

  static guess(network: NeuralNetwork, inputs: Matrix) {
    return NeuralNetwork.#feedForward(network, inputs);
  }

  static async train(network: NeuralNetwork, inputs: Matrix, targets: Matrix) {
    await NeuralNetwork.#feedForward(network, inputs);
    return NeuralNetwork.#backPropagate(network, targets);
  }

  static serialize(network: NeuralNetwork) {
    return JSON.stringify(network);
  }

  static deserialize(data: string) {
    return JSON.parse(data);
  }
}

export default NeuralNetwork;
