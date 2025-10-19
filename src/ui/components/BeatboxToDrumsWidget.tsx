/**
 * Beatbox-to-Drums Widget
 *
 * Upload beatbox audio and convert to MIDI drum patterns
 */

import React, { useState } from 'react';
import { Music, Upload, Wand2, Download, Play, Stop } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../api/client';

interface BeatboxToDrumsWidgetProps {
  projectId: string;
  onDrumsGenerated?: (result: any) => void;
}

export const BeatboxToDrumsWidget: React.FC<BeatboxToDrumsWidgetProps> = ({
  projectId,
  onDrumsGenerated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Options
  const [drumKit, setDrumKit] = useState('acoustic');
  const [quantize, setQuantize] = useState(true);
  const [enhancePattern, setEnhancePattern] = useState(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setResult(null);
      toast.success(`Loaded: ${file.name}`);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a beatbox recording first');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', uploadedFile);
      formData.append('drumKit', drumKit);
      formData.append('quantize', String(quantize));
      formData.append('enhancePattern', String(enhancePattern));

      toast.info('Analyzing beatbox patterns...');

      const response = await apiClient.request('POST', '/ai/beatbox-to-drums', formData);

      setResult(response);
      toast.success('Beatbox converted to drums!');

      if (onDrumsGenerated) {
        onDrumsGenerated(response);
      }
    } catch (error: any) {
      toast.error(`Failed to process beatbox: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playPreview = () => {
    if (!result) return;

    setIsPlaying(true);
    toast.info('Playing drum pattern preview...');

    // In production, this would actually play the audio
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  const downloadMIDI = () => {
    if (!result?.midiData) return;

    // Decode base64 MIDI data and download
    const midiBlob = new Blob([atob(result.midiData)], { type: 'audio/midi' });
    const url = URL.createObjectURL(midiBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beatbox-drums-${Date.now()}.mid`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('MIDI file downloaded');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Beatbox-to-Drums</h3>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Upload Beatbox Recording</label>
        <div className="flex gap-2">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            id="beatbox-upload"
          />
          <button
            onClick={() => document.getElementById('beatbox-upload')?.click()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {uploadedFile ? uploadedFile.name : 'Choose File'}
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Drum Kit</label>
          <select
            value={drumKit}
            onChange={(e) => setDrumKit(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
          >
            <option value="acoustic">Acoustic</option>
            <option value="electronic">Electronic</option>
            <option value="808">808</option>
            <option value="trap">Trap</option>
            <option value="rock">Rock</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Quantize to Grid</label>
          <button
            onClick={() => setQuantize(!quantize)}
            className={`w-12 h-6 rounded-full transition-colors ${
              quantize ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                quantize ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Enhance Pattern</label>
          <button
            onClick={() => setEnhancePattern(!enhancePattern)}
            className={`w-12 h-6 rounded-full transition-colors ${
              enhancePattern ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                enhancePattern ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={!uploadedFile || isProcessing}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Wand2 className="w-4 h-4" />
        {isProcessing ? 'Processing...' : 'Convert to Drums'}
      </button>

      {/* Results */}
      {result && (
        <div className="bg-gray-900 rounded p-4 space-y-3">
          <h4 className="text-white font-semibold mb-2">Results</h4>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Tempo</div>
              <div className="text-white font-semibold">
                {result.analysis.tempo} BPM
              </div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Patterns</div>
              <div className="text-white font-semibold">
                {result.analysis.detectedPatterns.length}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Duration</div>
              <div className="text-white font-semibold">
                {result.analysis.duration.toFixed(1)}s
              </div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Confidence</div>
              <div className="text-white font-semibold">
                {(result.analysis.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Drum Samples Used */}
          <div>
            <div className="text-gray-400 text-sm mb-1">Drum Samples</div>
            <div className="flex flex-wrap gap-1">
              {result.drumSamples.map((sample: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-gray-800 text-purple-400 text-xs px-2 py-1 rounded"
                >
                  {sample.split('/').pop()}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={playPreview}
              disabled={isPlaying}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Stop className="w-4 h-4" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>
            <button
              onClick={downloadMIDI}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              MIDI
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Processing time: {result.processingTime}ms
          </div>
        </div>
      )}
    </div>
  );
};
