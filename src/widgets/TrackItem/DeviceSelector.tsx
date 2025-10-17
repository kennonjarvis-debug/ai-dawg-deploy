'use client';

import { FC, useState, useEffect } from 'react';
import { Mic, Speaker } from 'lucide-react';
import { AudioDevice, getAllAudioDevices, onDeviceChange as subscribeToDeviceChanges } from '@/src/utils/audioDevices';
import styles from './DeviceSelector.module.css';

interface DeviceSelectorProps {
  type: 'input' | 'output';
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string) => void;
}

export const DeviceSelector: FC<DeviceSelectorProps> = ({
  type,
  selectedDeviceId,
  onDeviceChange,
}) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load devices
  const loadDevices = async () => {
    const { inputs, outputs } = await getAllAudioDevices();
    setDevices(type === 'input' ? inputs : outputs);
  };

  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const cleanup = subscribeToDeviceChanges(() => {
      loadDevices();
    });

    return cleanup;
  }, [type]);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const Icon = type === 'input' ? Mic : Speaker;

  return (
    <div className={styles.deviceSelector}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={`${type === 'input' ? 'Input' : 'Output'} Device`}
      >
        <Icon className={styles.icon} />
        <span className={styles.label}>
          {selectedDevice?.label || `Default ${type === 'input' ? 'Input' : 'Output'}`}
        </span>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.menu}>
            <div className={styles.menuHeader}>
              {type === 'input' ? 'Input' : 'Output'} Device
            </div>
            {devices.map((device) => (
              <button
                key={device.deviceId}
                className={`${styles.menuItem} ${
                  device.deviceId === selectedDeviceId ? styles.active : ''
                }`}
                onClick={() => {
                  onDeviceChange(device.deviceId);
                  setIsOpen(false);
                }}
              >
                <Icon className={styles.menuIcon} />
                <span>{device.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
