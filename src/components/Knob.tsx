/**
 * Knob - Rotary Control Component
 *
 * Professional knob control for audio parameters
 * - Mouse drag interaction (vertical drag)
 * - Scroll wheel support
 * - Double-click to reset
 * - Value display with units
 * - Pro Tools aesthetic
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './Knob.module.css';

export interface KnobProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Default value (for reset) */
  defaultValue?: number;
  /** Label */
  label?: string;
  /** Unit (e.g., 'dB', 'Hz', 'ms', '%') */
  unit?: string;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Size in pixels */
  size?: number;
  /** Color theme */
  color?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Change callback */
  onChange: (value: number) => void;
}

export function Knob({
  value,
  min,
  max,
  step = 0.1,
  defaultValue,
  label,
  unit = '',
  formatValue,
  size = 60,
  color = '#00e5ff',
  disabled = false,
  onChange,
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Normalized value (0-1)
  const normalizedValue = (value - min) / (max - min);

  // Rotation angle (-135° to +135° = 270° total range)
  const minAngle = -135;
  const maxAngle = 135;
  const angle = minAngle + normalizedValue * (maxAngle - minAngle);

  /**
   * Format display value
   */
  const displayValue = formatValue
    ? formatValue(value)
    : `${value.toFixed(step < 1 ? 1 : 0)}${unit}`;

  /**
   * Handle mouse down - start dragging
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // Double-click to reset
      if (e.detail === 2 && defaultValue !== undefined) {
        onChange(defaultValue);
        return;
      }

      setIsDragging(true);
      setDragStartY(e.clientY);
      setDragStartValue(value);
      e.preventDefault();
    },
    [disabled, defaultValue, value, onChange]
  );

  /**
   * Handle mouse move - update value
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate delta (pixels)
      const deltaY = dragStartY - e.clientY; // Inverted (up = increase)

      // Sensitivity: 100px = full range
      const sensitivity = 100;
      const deltaValue = (deltaY / sensitivity) * (max - min);

      // Calculate new value
      let newValue = dragStartValue + deltaValue;

      // Clamp to range
      newValue = Math.max(min, Math.min(max, newValue));

      // Snap to step
      newValue = Math.round(newValue / step) * step;

      // Update if changed
      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [isDragging, dragStartY, dragStartValue, min, max, step, value, onChange]
  );

  /**
   * Handle mouse up - stop dragging
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle wheel - scroll to adjust
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;

      e.preventDefault();
      const delta = -e.deltaY;
      const wheelStep = step * (e.shiftKey ? 10 : 1); // Shift = 10x faster
      let newValue = value + (delta > 0 ? wheelStep : -wheelStep);

      // Clamp to range
      newValue = Math.max(min, Math.min(max, newValue));

      // Snap to step
      newValue = Math.round(newValue / step) * step;

      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [disabled, value, min, max, step, onChange]
  );

  /**
   * Set up global mouse listeners for dragging
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={styles.container}>
      {/* Label */}
      {label && <div className={styles.label}>{label}</div>}

      {/* Knob */}
      <div
        ref={knobRef}
        className={`${styles.knob} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        style={{
          width: size,
          height: size,
          cursor: disabled ? 'not-allowed' : 'ns-resize',
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={styles.svg}
        >
          {/* Track (background arc) */}
          <path
            d="M 15 85 A 40 40 0 1 1 85 85"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Value arc */}
          <path
            d="M 15 85 A 40 40 0 1 1 85 85"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${normalizedValue * 189} 189`}
            style={{
              filter: `drop-shadow(0 0 4px ${color}66)`,
              transition: isDragging ? 'none' : 'stroke-dasharray 0.1s',
            }}
          />

          {/* Center dot */}
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="rgba(0, 0, 0, 0.5)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        </svg>

        {/* Pointer indicator */}
        <div
          className={styles.pointer}
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s',
          }}
        >
          <div
            className={styles.pointerLine}
            style={{
              background: color,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Value display */}
      <div
        className={styles.value}
        style={{
          color: isDragging ? color : '#fff',
        }}
      >
        {displayValue}
      </div>

      {/* Instructions hint (on hover) */}
      {!disabled && (
        <div className={styles.hint}>
          Drag ↕ | Scroll | 2×Click Reset
        </div>
      )}
    </div>
  );
}
