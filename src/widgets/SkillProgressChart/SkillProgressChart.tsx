/**
 * SkillProgressChart Widget
 * Timeline visualization of improvement across vocal skills
 * Tracks progress over time with trend indicators
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './SkillProgressChart.module.css';

interface SkillDataPoint {
  date: Date;
  pitchAccuracy: number; // 0-100
  breathControl: number; // 0-100
  vibratoControl: number; // 0-100
  rangeExpansion: number; // 0-100
  tonalQuality: number; // 0-100
}

interface SkillProgressChartProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

const SKILLS = [
  { key: 'pitchAccuracy', label: 'Pitch Accuracy', color: '#3b82f6' },
  { key: 'breathControl', label: 'Breath Control', color: '#22c55e' },
  { key: 'vibratoControl', label: 'Vibrato Control', color: '#8b5cf6' },
  { key: 'rangeExpansion', label: 'Range Expansion', color: '#f59e0b' },
  { key: 'tonalQuality', label: 'Tonal Quality', color: '#ec4899' },
];

export function SkillProgressChart({ timeRange = '30d' }: SkillProgressChartProps) {
  const [data, setData] = useState<SkillDataPoint[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate sample data
  useEffect(() => {
    const generateData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const dataPoints: SkillDataPoint[] = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        dataPoints.push({
          date,
          pitchAccuracy: 50 + Math.random() * 20 + (days - i) * 0.3,
          breathControl: 45 + Math.random() * 25 + (days - i) * 0.25,
          vibratoControl: 40 + Math.random() * 20 + (days - i) * 0.2,
          rangeExpansion: 35 + Math.random() * 30 + (days - i) * 0.15,
          tonalQuality: 55 + Math.random() * 15 + (days - i) * 0.25,
        });
      }

      setData(dataPoints);
    };

    generateData();
  }, [timeRange]);

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 25}%`, padding - 10, y + 4);
    }

    // Draw skills
    const skillsToDraw = showAllSkills
      ? SKILLS
      : selectedSkill
      ? SKILLS.filter((s) => s.key === selectedSkill)
      : SKILLS;

    skillsToDraw.forEach((skill) => {
      ctx.strokeStyle = skill.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const value = (point as any)[skill.key];
        const y = padding + chartHeight - (value / 100) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const value = (point as any)[skill.key];
        const y = padding + chartHeight - (value / 100) * chartHeight;

        ctx.fillStyle = skill.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // X-axis labels
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const labelCount = 5;
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((data.length - 1) * (i / (labelCount - 1)));
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const date = data[index].date;
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(label, x, height - padding + 20);
    }
  }, [data, selectedSkill, showAllSkills]);

  const calculateTrend = (skillKey: string) => {
    if (data.length < 2) return 0;

    const recent = (data[data.length - 1] as any)[skillKey];
    const past = (data[0] as any)[skillKey];
    return recent - past;
  };

  const formatTrend = (trend: number) => {
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Skill Progress</h3>
        <button
          onClick={() => setShowAllSkills(!showAllSkills)}
          className={styles.toggleButton}
          title={showAllSkills ? 'Show individual skill' : 'Show all skills'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={styles.chartContainer}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.legend}>
        {SKILLS.map((skill) => {
          const trend = calculateTrend(skill.key);
          const isSelected = selectedSkill === skill.key;

          return (
            <button
              key={skill.key}
              onClick={() => {
                setShowAllSkills(false);
                setSelectedSkill(isSelected ? null : skill.key);
              }}
              className={`${styles.legendItem} ${isSelected ? styles.legendItemActive : ''}`}
            >
              <div className={styles.legendColor} style={{ background: skill.color }} />
              <div className={styles.legendContent}>
                <span className={styles.legendLabel}>{skill.label}</span>
                <span
                  className={`${styles.legendTrend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}
                >
                  {trend >= 0 ? '↑' : '↓'} {formatTrend(trend)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {data.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Time Range</span>
            <span className={styles.summaryValue}>
              {timeRange === '7d'
                ? 'Last 7 Days'
                : timeRange === '30d'
                ? 'Last 30 Days'
                : timeRange === '90d'
                ? 'Last 90 Days'
                : 'Last Year'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Data Points</span>
            <span className={styles.summaryValue}>{data.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
