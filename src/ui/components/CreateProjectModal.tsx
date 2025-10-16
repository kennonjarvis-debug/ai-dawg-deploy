import React, { useState } from 'react';
import { Music2 } from 'lucide-react';
import type { CreateProjectRequest } from '../../api/types';
import { Modal, Button, ButtonGroup, Input, Select, Textarea, Checkbox, FormField } from './base';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectRequest) => void;
}

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    bpm: 120,
    sampleRate: 44100,
    timeSignature: '4/4',
    key: 'C',
    isPublic: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      bpm: 120,
      sampleRate: 44100,
      timeSignature: '4/4',
      key: 'C',
      isPublic: false,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      icon={<Music2 className="w-6 h-6 text-blue-400" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <FormField label="Project Name" required htmlFor="projectName">
          <Input
            id="projectName"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Awesome Track"
            data-testid="project-name-input"
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" htmlFor="projectDescription">
          <Textarea
            id="projectDescription"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="A brief description of your project..."
            data-testid="project-description-input"
          />
        </FormField>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* BPM */}
          <FormField label="BPM" htmlFor="bpm">
            <Input
              id="bpm"
              type="number"
              min={20}
              max={300}
              value={formData.bpm}
              onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) || 120 })}
              data-testid="project-bpm-input"
            />
          </FormField>

          {/* Sample Rate */}
          <FormField label="Sample Rate" htmlFor="sampleRate">
            <Select
              id="sampleRate"
              value={formData.sampleRate}
              onChange={(e) => setFormData({ ...formData, sampleRate: parseInt(e.target.value) })}
              data-testid="project-sample-rate-select"
            >
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48 kHz</option>
              <option value={96000}>96 kHz</option>
            </Select>
          </FormField>

          {/* Key */}
          <FormField label="Musical Key" htmlFor="musicalKey">
            <Select
              id="musicalKey"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              data-testid="project-key-select"
            >
              {MUSICAL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Time Signature */}
          <FormField label="Time Signature" htmlFor="timeSignature">
            <Select
              id="timeSignature"
              value={formData.timeSignature}
              onChange={(e) => setFormData({ ...formData, timeSignature: e.target.value })}
              data-testid="project-time-signature-select"
            >
              {TIME_SIGNATURES.map((sig) => (
                <option key={sig} value={sig}>
                  {sig}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Public Toggle */}
        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
          <Checkbox
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            label="Make this project public (visible to all users)"
            data-testid="project-public-checkbox"
          />
        </div>

        {/* Actions */}
        <ButtonGroup fullWidth className="pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth data-testid="cancel-create-project">
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth data-testid="create-project-button">
            Create Project
          </Button>
        </ButtonGroup>
      </form>
    </Modal>
  );
};
