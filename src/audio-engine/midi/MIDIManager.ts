/**
 * MIDIManager - Handles MIDI input/output and message processing
 */

import { MIDIMessage } from '../core/types';

export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private inputs: Map<string, MIDIInput> = new Map();
  private outputs: Map<string, MIDIOutput> = new Map();
  private messageListeners: Set<(message: MIDIMessage) => void> = new Set();

  /**
   * Initialize MIDI access
   */
  async initialize(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser');
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });

      // Setup inputs
      this.midiAccess.inputs.forEach(input => {
        this.inputs.set(input.id, input);
        input.onmidimessage = this.handleMIDIMessage.bind(this);
        console.log(`MIDI Input connected: ${input.name}`);
      });

      // Setup outputs
      this.midiAccess.outputs.forEach(output => {
        this.outputs.set(output.id, output);
        console.log(`MIDI Output connected: ${output.name}`);
      });

      // Listen for device changes
      this.midiAccess.onstatechange = this.handleStateChange.bind(this);

      console.log('[MIDI] Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
    }
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    const [status, data1, data2] = event.data;
    const channel = status & 0x0f;
    const command = status & 0xf0;

    let message: MIDIMessage;

    switch (command) {
      case 0x90: // Note On
        message = {
          timestamp: event.timeStamp,
          type: data2 > 0 ? 'noteon' : 'noteoff', // velocity 0 is note off
          channel,
          data: [data1, data2]
        };
        break;

      case 0x80: // Note Off
        message = {
          timestamp: event.timeStamp,
          type: 'noteoff',
          channel,
          data: [data1, data2]
        };
        break;

      case 0xb0: // Control Change
        message = {
          timestamp: event.timeStamp,
          type: 'cc',
          channel,
          data: [data1, data2]
        };
        break;

      case 0xe0: // Pitch Bend
        const pitchValue = (data2 << 7) | data1;
        message = {
          timestamp: event.timeStamp,
          type: 'pitchbend',
          channel,
          data: [pitchValue]
        };
        break;

      default:
        return; // Unsupported message type
    }

    // Notify all listeners
    this.messageListeners.forEach(listener => listener(message));
  }

  /**
   * Handle MIDI device state changes
   */
  private handleStateChange(event: MIDIConnectionEvent): void {
    const port = event.port;

    if (port.type === 'input') {
      if (port.state === 'connected') {
        this.inputs.set(port.id, port as MIDIInput);
        (port as MIDIInput).onmidimessage = this.handleMIDIMessage.bind(this);
        console.log(`MIDI Input connected: ${port.name}`);
      } else if (port.state === 'disconnected') {
        this.inputs.delete(port.id);
        console.log(`MIDI Input disconnected: ${port.name}`);
      }
    } else if (port.type === 'output') {
      if (port.state === 'connected') {
        this.outputs.set(port.id, port as MIDIOutput);
        console.log(`MIDI Output connected: ${port.name}`);
      } else if (port.state === 'disconnected') {
        this.outputs.delete(port.id);
        console.log(`MIDI Output disconnected: ${port.name}`);
      }
    }
  }

  /**
   * Send MIDI message to output
   */
  sendMessage(outputId: string, message: MIDIMessage): void {
    const output = this.outputs.get(outputId);
    if (!output) {
      console.warn(`MIDI output not found: ${outputId}`);
      return;
    }

    let status: number;
    let data: number[] = [];

    switch (message.type) {
      case 'noteon':
        status = 0x90 | message.channel;
        data = message.data;
        break;

      case 'noteoff':
        status = 0x80 | message.channel;
        data = message.data;
        break;

      case 'cc':
        status = 0xb0 | message.channel;
        data = message.data;
        break;

      case 'pitchbend':
        status = 0xe0 | message.channel;
        const value = message.data[0];
        data = [value & 0x7f, (value >> 7) & 0x7f];
        break;
    }

    output.send([status, ...data]);
  }

  /**
   * Add a message listener
   */
  addMessageListener(listener: (message: MIDIMessage) => void): void {
    this.messageListeners.add(listener);
  }

  /**
   * Remove a message listener
   */
  removeMessageListener(listener: (message: MIDIMessage) => void): void {
    this.messageListeners.delete(listener);
  }

  /**
   * Get all available MIDI inputs
   */
  getInputs(): MIDIInput[] {
    return Array.from(this.inputs.values());
  }

  /**
   * Get all available MIDI outputs
   */
  getOutputs(): MIDIOutput[] {
    return Array.from(this.outputs.values());
  }

  /**
   * Get specific MIDI input
   */
  getInput(id: string): MIDIInput | undefined {
    return this.inputs.get(id);
  }

  /**
   * Get specific MIDI output
   */
  getOutput(id: string): MIDIOutput | undefined {
    return this.outputs.get(id);
  }

  /**
   * Clean up MIDI resources
   */
  dispose(): void {
    this.inputs.forEach(input => {
      input.onmidimessage = null;
    });

    this.inputs.clear();
    this.outputs.clear();
    this.messageListeners.clear();

    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }

    console.log('[MIDI] Disposed');
  }
}
