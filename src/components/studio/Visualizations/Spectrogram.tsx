import { useEffect, useRef, useState } from 'react';

interface SpectrogramProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  colorScheme?: 'hot' | 'cool' | 'rainbow' | 'grayscale';
  minFrequency?: number;
  maxFrequency?: number;
}

export function Spectrogram({
  analyser,
  width = 800,
  height = 256,
  colorScheme = 'hot'
}: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [frequencyLabels, setFrequencyLabels] = useState<Array<{ freq: number; y: number }>>([]);

  // Color mapping functions
  const getColor = (value: number, scheme: string): [number, number, number] => {
    // value is 0-255

    switch (scheme) {
      case 'hot': {
        // Black -> Red -> Yellow -> White
        if (value < 85) {
          return [value * 3, 0, 0];
        } else if (value < 170) {
          return [255, (value - 85) * 3, 0];
        } else {
          return [255, 255, (value - 170) * 3];
        }
      }

      case 'cool': {
        // Black -> Blue -> Cyan -> White
        if (value < 85) {
          return [0, 0, value * 3];
        } else if (value < 170) {
          return [0, (value - 85) * 3, 255];
        } else {
          return [(value - 170) * 3, 255, 255];
        }
      }

      case 'rainbow': {
        // Spectral colors
        const hue = (240 - (value / 255) * 240) / 360; // Blue to red
        const rgb = hslToRgb(hue, 1, value / 510);
        return rgb;
      }

      case 'grayscale': {
        return [value, value, value];
      }

      default:
        return [value, value, value];
    }
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  useEffect(() => {
    // Calculate frequency labels
    const labels = [
      { freq: 8000, y: 0 },
      { freq: 4000, y: height * 0.25 },
      { freq: 2000, y: height * 0.5 },
      { freq: 1000, y: height * 0.625 },
      { freq: 500, y: height * 0.75 },
      { freq: 250, y: height * 0.875 },
      { freq: 0, y: height }
    ];
    setFrequencyLabels(labels);
  }, [analyser, height]);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Create scrolling image data
    let imageData = ctx.createImageData(width, height);

    // Initialize with black
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 0;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }

    const animate = () => {
      if (!ctx || !analyser) return;

      analyser.getByteFrequencyData(dataArray);

      // Create new image data
      const newImageData = ctx.createImageData(width, height);

      // Shift existing data left by 1 pixel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - 1; x++) {
          const oldIndex = (y * width + x + 1) * 4;
          const newIndex = (y * width + x) * 4;

          newImageData.data[newIndex] = imageData.data[oldIndex];
          newImageData.data[newIndex + 1] = imageData.data[oldIndex + 1];
          newImageData.data[newIndex + 2] = imageData.data[oldIndex + 2];
          newImageData.data[newIndex + 3] = 255;
        }
      }

      // Add new column from frequency data (flip vertical)
      for (let y = 0; y < height; y++) {
        // Map y position to frequency bin (inverted - high freq at top)
        const dataIndex = Math.floor(((height - y) / height) * bufferLength);
        const value = dataArray[dataIndex] || 0;

        const [r, g, b] = getColor(value, colorScheme);

        const index = (y * width + (width - 1)) * 4;
        newImageData.data[index] = r;
        newImageData.data[index + 1] = g;
        newImageData.data[index + 2] = b;
        newImageData.data[index + 3] = 255;
      }

      imageData = newImageData;
      ctx.putImageData(imageData, 0, 0);

      // Draw frequency labels with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      frequencyLabels.forEach(label => {
        ctx.fillRect(0, label.y - 10, 60, 14);
      });

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      frequencyLabels.forEach(label => {
        const text = label.freq >= 1000 ? `${label.freq / 1000}kHz` : `${label.freq}Hz`;
        ctx.fillText(text, 5, label.y);
      });

      // Draw time markers at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(width - 80, height - 20, 75, 15);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('← Time', width - 75, height - 8);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, colorScheme, frequencyLabels]);

  return (
    <div className="spectrogram">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="spectrogram-canvas"
      />
      <div className="spectrogram-controls">
        <label>
          Color Scheme:
          <select
            value={colorScheme}
            onChange={() => {
              // This would need to be controlled via props in real usage
            }}
          >
            <option value="hot">Hot (Black-Red-Yellow-White)</option>
            <option value="cool">Cool (Black-Blue-Cyan-White)</option>
            <option value="rainbow">Rainbow</option>
            <option value="grayscale">Grayscale</option>
          </select>
        </label>
      </div>
    </div>
  );
}
