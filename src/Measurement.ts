import {ModelResultMetrics} from 'react-native-pytorch-core';

const marks = ['inference', 'pack', 'unpack'] as const;

type Mark = typeof marks[number];

type Measures = {[key in Mark]: number};

const measures: Measures = {
  inference: 0,
  pack: 0,
  unpack: 0,
};

export default {
  mark(mark: Mark) {
    // @ts-ignore: Cannot find name 'performance'.ts(2304)
    measures[mark] = performance.now();
  },
  measure(mark: Mark) {
    // @ts-ignore: Cannot find name 'performance'.ts(2304)
    measures[mark] = performance.now() - measures[mark];
  },
  getMetrics(): ModelResultMetrics {
    const packTime = Math.floor(measures.pack);
    const inferenceTime = Math.floor(measures.inference);
    const unpackTime = Math.floor(measures.unpack);

    // Clear previous marks
    for (const mark of marks) {
      measures[mark] = 0;
    }

    return {
      inferenceTime: inferenceTime,
      packTime: packTime,
      totalTime: packTime + inferenceTime + unpackTime,
      unpackTime: unpackTime,
    };
  },
};
