import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { Modal, Button, ButtonGroup, FormField, Select } from './base';
import clsx from 'clsx';

interface ExportModalProps {
  isOpen: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}

type ExportFormat = 'wav' | 'mp3' | 'flac' | 'aac';
type BitDepth = 16 | 24 | 32;
type SampleRate = 44100 | 48000 | 96000 | 192000;

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  projectId,
  projectName,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [bitDepth, setBitDepth] = useState<BitDepth>(24);
  const [sampleRate, setSampleRate] = useState<SampleRate>(48000);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'rendering' | 'complete' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('rendering');
      setExportProgress(0);

      // Start the render job
      const job = await apiClient.startRender({
        projectId,
        format,
        bitDepth: format === 'wav' || format === 'flac' ? bitDepth : undefined,
        sampleRate,
        quality: format === 'mp3' || format === 'aac' ? quality : undefined,
      });

      setJobId(job.id);

      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiClient.getRenderStatus(job.id);

          if (status.progress) {
            setExportProgress(status.progress);
          }

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setExportStatus('complete');
            setExportProgress(100);
            toast.success('Export complete!');

            // Download the file
            if (status.result?.downloadUrl) {
              const link = document.createElement('a');
              link.href = status.result.downloadUrl;
              link.download = `${projectName}.${format}`;
              link.click();
            }

          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setExportStatus('error');
            toast.error('Export failed: ' + (status.error || 'Unknown error'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          setExportStatus('error');
          toast.error('Failed to check export status');
        }
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      toast.error('Failed to start export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = async () => {
    if (jobId && exportStatus === 'rendering') {
      try {
        await apiClient.cancelRender(jobId);
        toast.info('Export cancelled');
      } catch (error) {
        console.error('Cancel error:', error);
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Export Project"
      icon={<Download className="w-6 h-6 text-blue-400" />}
      size="md"
      closeOnOverlayClick={!isExporting}
      closeOnEscape={!isExporting}
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <FormField label="Format">
          <div className="grid grid-cols-4 gap-2">
            {(['wav', 'mp3', 'flac', 'aac'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                disabled={isExporting}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  format === f
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </FormField>

        {/* Sample Rate */}
        <FormField label="Sample Rate" htmlFor="sampleRate">
          <Select
            id="sampleRate"
            value={sampleRate}
            onChange={(e) => setSampleRate(Number(e.target.value) as SampleRate)}
            disabled={isExporting}
          >
            <option value={44100}>44.1 kHz</option>
            <option value={48000}>48 kHz</option>
            <option value={96000}>96 kHz</option>
            <option value={192000}>192 kHz</option>
          </Select>
        </FormField>

        {/* Bit Depth (for WAV/FLAC) */}
        {(format === 'wav' || format === 'flac') && (
          <FormField label="Bit Depth">
            <div className="grid grid-cols-3 gap-2">
              {[16, 24, 32].map((depth) => (
                <button
                  key={depth}
                  type="button"
                  onClick={() => setBitDepth(depth as BitDepth)}
                  disabled={isExporting}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    bitDepth === depth
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {depth}-bit
                </button>
              ))}
            </div>
          </FormField>
        )}

        {/* Quality (for MP3/AAC) */}
        {(format === 'mp3' || format === 'aac') && (
          <FormField label="Quality">
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  disabled={isExporting}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                    quality === q
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </FormField>
        )}

        {/* Progress */}
        {exportStatus !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                {exportStatus === 'rendering' && 'Rendering...'}
                {exportStatus === 'complete' && 'Complete!'}
                {exportStatus === 'error' && 'Error'}
              </span>
              <span className="text-gray-400">{exportProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={clsx(
                  'h-2 rounded-full transition-all duration-300',
                  exportStatus === 'complete'
                    ? 'bg-green-500'
                    : exportStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                )}
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {exportStatus === 'complete' && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Export completed successfully!</span>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Export failed. Please try again.</span>
          </div>
        )}

        {/* Actions */}
        <ButtonGroup fullWidth className="pt-2">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isExporting}
            fullWidth
          >
            {exportStatus === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || exportStatus === 'rendering'}
            loading={isExporting}
            icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            fullWidth
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  );
};
