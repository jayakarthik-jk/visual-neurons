import "./style.css";

import "./style.css";

import NeuralNetwork, { Matrix } from "../lib";

const visualizerRoot = document.getElementById("app");

if (!visualizerRoot) {
  throw new Error("Root element not found");
}

const network = new NeuralNetwork([2, 5, 1], {
  visualize: true,
  visualizerRoot,
  visualizerOptions: {
    nodeSize: 0.2,
    layerOptions: {
      feedForwardDuration: 0.1,
      backPropagationDuration: 0.1,
    },
  },
});

const datas = [
  {
    inputs: [0, 0],
    targets: [0],
  },
  {
    inputs: [0, 1],
    targets: [1],
  },
  {
    inputs: [1, 0],
    targets: [1],
  },
  {
    inputs: [1, 1],
    targets: [0],
  },
];

async function main() {
  // training process
  for (let i = 0; i < 10000; i++) {
    const data = datas[Math.floor(Math.random() * datas.length)];
    await NeuralNetwork.train(
      network,
      Matrix.fromArray(data.inputs),
      Matrix.fromArray(data.targets)
    );
  }
  for (const data of datas) {
    const output = await NeuralNetwork.guess(
      network,
      Matrix.fromArray(data.inputs)
    );
    console.log(output.toArray());
  }
}

main();
