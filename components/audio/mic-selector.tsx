'use client';

import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface MicSelectorProps {
  onDeviceChange: (deviceId: string) => void;
}

export function MicSelector({ onDeviceChange }: MicSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    // Get list of audio input devices
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = deviceList.filter((device) => device.kind === 'audioinput');

        setDevices(audioInputs);

        // Set default device
        if (audioInputs.length > 0 && !selectedDevice) {
          const defaultDevice = audioInputs[0]?.deviceId;
          if (defaultDevice) {
            setSelectedDevice(defaultDevice);
            onDeviceChange(defaultDevice);
          }
        }
      } catch (error) {
        console.error('Error getting audio devices:', error);
      }
    };

    getDevices();

    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [selectedDevice, onDeviceChange]);

  const handleChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    onDeviceChange(deviceId);
  };

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Mic className="w-4 h-4 text-gray-400" />
      <select
        value={selectedDevice}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-600"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${devices.indexOf(device) + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}
