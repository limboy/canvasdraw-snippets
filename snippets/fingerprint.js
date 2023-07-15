// just for code completion, will be removed when rendering
import { Canvas, Ellipse, Circle, Path, Polygon, Rect, TextItem } from 'yaoocanvas'

/**
 * @typedef {Object} Noise
 * @property {(x: number, y: number) => number} simplex2
 * @property {(x: number, y: number, z: number) => number} simplex3
 * @property {(x: number, y: number) => number} perlin2
 * @property {(x: number, y: number, z: number) => number} perlin3
 * @property {(val: number) => voide} seed
 */

/**
 * 
 * @param {Canvas} canvas 
 * @param {{query:string, frame:string}} payload 
 * @param {{get:(string) => string, set:(string, string)}} store 
 * @param {{noise:Noise}} util 
 */
function draw(canvas, payload, store, util) {
  canvas.fillColor = "#1484D6"
  canvas.width = Math.max(canvas.width, 800);
  canvas.height = Math.max(canvas.height, 800);

  const [centerX, centerY] = [canvas.width / 2, canvas.height / 2];

  const circleCount = 32;
  const circleGap = 10;
  const minCircleRadius = 10;
  const circleColors = ["#FFFFFF", "#FFFF00"];
  const circleWeights = [3, 6];

  for (let i = 0; i < circleCount; i++) {
    const circle = new Circle(centerX, centerY, minCircleRadius + i * circleGap);
    circle.strokeColor = circleColors[i % circleColors.length];
    circle.strokeWeight = circleWeights[i % circleWeights.length];
    circle.strokeDash = [100 + Math.random() * 100, 8 + Math.random() * 5];
    canvas.addChild(circle);
  }

  const cutPadding = 3;
  const largestCircleRadius = minCircleRadius + (circleCount - 1) * circleGap;
  const rectToCut = new Rect(centerX - largestCircleRadius - cutPadding, centerY - largestCircleRadius - cutPadding, largestCircleRadius + cutPadding, (largestCircleRadius + cutPadding) * 2);
  canvas.cutRectToPosition(rectToCut.x, rectToCut.y, rectToCut.width, rectToCut.height, centerX - largestCircleRadius - cutPadding, centerY - largestCircleRadius / 2 - cutPadding);

  const squareOffset = largestCircleRadius * 0.75 / Math.sqrt(2);
  canvas.getImageData(centerX - squareOffset, centerY - largestCircleRadius / 4, squareOffset * 2, squareOffset * 2, (imageData) => {
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.ctx.putImageData(imageData, (centerX - squareOffset) * devicePixelRatio, (centerY - squareOffset) * devicePixelRatio);
  });

}
