import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal, Button, ButtonGroup, Input, FormField } from './base';

interface AuxTrackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: { name: string; channels: 'mono' | 'stereo' }) => void;
}

export const AuxTrackDialog: React.FC<AuxTrackDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('Aux');
  const [channels, setChannels] = useState<'mono' | 'stereo'>('stereo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, channels });
    handleClose();
  };

  const handleClose = () => {
    setName('Aux');
    setChannels('stereo');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Aux Track"
      icon={<Plus className="w-6 h-6 text-purple-400" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Track Name */}
        <FormField label="Track Name" required htmlFor="auxTrackName">
          <Input
            id="auxTrackName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aux 1"
            autoFocus
          />
        </FormField>

        {/* Channel Configuration */}
        <FormField label="Channel Configuration" required>
          <div className="space-y-3">
            {/* Mono Option */}
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-base hover:border-primary-hover/50 cursor-pointer transition-colors bg-bg-surface hover:bg-bg-surface-hover">
              <input
                type="radio"
                name="channels"
                value="mono"
                checked={channels === 'mono'}
                onChange={(e) => setChannels(e.target.value as 'mono' | 'stereo')}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium text-text-base">Mono</div>
                <div className="text-xs text-text-muted">Single channel aux track</div>
              </div>
            </label>

            {/* Stereo Option */}
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-base hover:border-primary-hover/50 cursor-pointer transition-colors bg-bg-surface hover:bg-bg-surface-hover">
              <input
                type="radio"
                name="channels"
                value="stereo"
                checked={channels === 'stereo'}
                onChange={(e) => setChannels(e.target.value as 'mono' | 'stereo')}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium text-text-base">Stereo</div>
                <div className="text-xs text-text-muted">Dual channel aux track (L/R)</div>
              </div>
            </label>
          </div>
        </FormField>

        {/* Action Buttons */}
        <ButtonGroup>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Aux Track
          </Button>
        </ButtonGroup>
      </form>
    </Modal>
  );
};
