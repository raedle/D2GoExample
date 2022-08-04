import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  LayoutRectangle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  Canvas,
  CanvasRenderingContext2D,
  Image,
  Module,
  ModelResultMetrics,
  Tensor,
  media,
  torch,
  torchvision,
} from 'react-native-pytorch-core';
import Measurement from './Measurement';
import useModel from './useModel';

// Alias for torchvision transforms
const T = torchvision.transforms;

// Doesn't work
const MODEL =
  'https://github.com/raedle/test-some/releases/download/v0.0.2.0/d2go_optimized.ptl';

// Helper type to store left, top, right, bottom bounds
type Rect = [number, number, number, number];

type BoundingBox = {
  // The detected object label
  label: string;
  // The confidence score
  score: number;
  // The object bounds
  rect: Rect;
};

const CLASSES = [
  '',
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'airplane',
  'bus',
  'train',
  'truck',
  'boat',
  'traffic light',
  'fire hydrant',
  'street sign',
  'stop sign',
  'parking meter',
  'bench',
  'bird',
  'cat',
  'dog',
  'horse',
  'sheep',
  'cow',
  'elephant',
  'bear',
  'zebra',
  'giraffe',
  'hat',
  'backpack',
  'umbrella',
  'shoe',
  'eye glasses',
  'handbag',
  'tie',
  'suitcase',
  'frisbee',
  'skis',
  'snowboard',
  'sports ball',
  'kite',
  'baseball bat',
  'baseball glove',
  'skateboard',
  'surfboard',
  'tennis racket',
  'bottle',
  'plate',
  'wine glass',
  'cup',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'sandwich',
  'orange',
  'broccoli',
  'carrot',
  'hot dog',
  'pizza',
  'donut',
  'cake',
  'chair',
  'couch',
  'potted plant',
  'bed',
  'mirror',
  'dining table',
  'window',
  'desk',
  'toilet',
  'door',
  'tv',
  'laptop',
  'mouse',
  'remote',
  'keyboard',
  'cell phone',
  'microwave',
  'oven',
  'toaster',
  'sink',
  'refrigerator',
  'blender',
  'book',
  'clock',
  'vase',
  'scissors',
  'teddy bear',
  'hair drier',
  'toothbrush',
  'hair brush',
];

const packFn = async (image: Image): Promise<Tensor> => {
  // Get image width and height
  const width = image.getWidth();
  const height = image.getHeight();

  // Convert image to blob, which is a byte representation of the image
  // in the format height (H), width (W), and channels (C), or HWC for short
  const blob = media.toBlob(image);

  // Get a tensor from image the blob and also define in what format
  // the image blob is.
  let tensor = torch.fromBlob(blob, [height, width, 3]);

  // Rearrange the tensor shape to be [CHW]
  tensor = tensor.permute([2, 0, 1]);

  // Divide the tensor values by 255 to get values between [0, 1]
  tensor = tensor.div(255);

  // Normalize the tensor image with mean and standard deviation
  const normalize = T.normalize([0, 0, 0], [1, 1, 1]);
  tensor = normalize(tensor);

  // Unsqueeze adds 1 leading dimension to the tensor
  // return tensor.unsqueeze(0);
  return tensor;
};

const inferenceFn = async (
  model: Module,
  tensor: Tensor
): Promise<{ [key: string]: Tensor } | null> => {
  // console.log('inference');
  try {
    const result = await model.forward<
      any,
      [Tensor, [{ [key: string]: Tensor }]]
    >([tensor]);
    return result[1][0];
  } catch (error) {
    console.error(error);
  }
  return null;
};

const unpackFn = async (output: {
  [key: string]: Tensor;
}): Promise<BoundingBox[]> => {
  const boxes = output['boxes'];
  const scores = output['scores'];
  // long or int64 not supported atm, so lowering to int32
  const labels = output['labels'].to({ dtype: torch.int32 });

  const threshold = 0.5;

  const results: BoundingBox[] = [];
  const length = scores.shape[0];
  // console.log('length', length);
  for (let i = 0; i < length; i++) {
    const score = scores[i].item();
    if (score < threshold) {
      continue;
    }

    const box: BoundingBox = {
      label: CLASSES[labels[i].item()],
      score: scores[i].item(),
      rect: [
        boxes[i][0].item(),
        boxes[i][1].item(),
        boxes[i][2].item(),
        boxes[i][3].item(),
      ],
    };

    results.push(box);
  }

  return results;
};

export default function App() {
  const { isReady, model } = useModel(MODEL);
  const context2DRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const layoutRef = React.useRef<LayoutRectangle | null>(null);
  const cameraRef = React.useRef<Camera | null>(null);
  const [metrics, setMetrics] = React.useState<ModelResultMetrics | null>(null);
  const handleImage = React.useCallback(
    async function handleImage(image: Image) {
      if (model == null) {
        Alert.alert('Model', 'Model not loaded');
        return;
      }

      const ctx = context2DRef.current;
      if (ctx == null) {
        Alert.alert('Canvas', 'The canvas is not initialized');
        return;
      }

      const layout = layoutRef.current;
      if (layout == null) {
        Alert.alert('Layout', 'The layout is not initialized');
        return;
      }

      Measurement.mark('pack');
      const inputs = await packFn(image);
      Measurement.measure('pack');

      Measurement.mark('inference');
      const output = await inferenceFn(model, inputs);
      Measurement.measure('inference');

      if (output == null) {
        Alert.alert('Inference', 'Inference not successful');
        return;
      }

      Measurement.mark('unpack');
      const results = await unpackFn(output);
      Measurement.measure('unpack');

      setMetrics(Measurement.getMetrics());

      // Draw image scaled by a factor or 2.5
      const width = image.getWidth();
      const height = image.getHeight();

      const sx = layout.width / image.getWidth();
      const sy = layout.height / image.getHeight();
      const scale = Math.min(sx, sy);

      ctx.drawImage(image, 0, 0, width * scale, height * scale);

      // Draw bounding boxes and label on top of image, also scaled
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'red';
      ctx.font = '16px sans-serif';
      ctx.lineWidth = 3;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        ctx.beginPath();
        const rect = result.rect;
        const left = rect[0] * scale;
        const top = rect[1] * scale;
        const right = rect[2] * scale;
        const bottom = rect[3] * scale;
        ctx.rect(left, top, right - left, bottom - top);
        ctx.stroke();

        const label = result.label;
        ctx.fillText(label, left, top);
      }

      // Paint canvas and wait for completion
      await ctx.invalidate();

      // Release image from memory
      await image.release();
    },
    [context2DRef, layoutRef, setMetrics, model]
  );

  function handleFlipCamera() {
    const camera = cameraRef.current;
    if (camera != null) {
      camera.flip();
    }
  }

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading D2Go Model (4.07 MB)</Text>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <Camera ref={cameraRef} style={styles.camera} onFrame={handleImage} />
      <View style={styles.canvas}>
        <Canvas
          style={StyleSheet.absoluteFill}
          onContext2D={(ctx) => {
            context2DRef.current = ctx;
          }}
          onLayout={(event) => {
            layoutRef.current = event.nativeEvent.layout;
          }}
        />
      </View>
      {metrics != null && (
        <View>
          <Text style={styles.metrics}>Total time: {metrics.totalTime}</Text>
          <Text style={styles.metrics}>Pack time: {metrics.packTime}</Text>
          <Text style={styles.metrics}>
            Inference time: {metrics.inferenceTime}
          </Text>
          <Text style={styles.metrics}>Unpack time: {metrics.unpackTime}</Text>
        </View>
      )}
      <Button title="Flip Camera" onPress={handleFlipCamera} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 50,
  },
  camera: {
    display: 'none',
    height: '50%',
    width: '100%',
  },
  canvas: {
    backgroundColor: 'black',
    flex: 1,
  },
  metrics: {
    color: 'white',
  },
  loading: {
    alignItems: 'center',
    backgroundColor: 'black',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
