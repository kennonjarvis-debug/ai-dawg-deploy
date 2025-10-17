/**
 * Agent Coordination System
 *
 * Manages agent status, help requests, buddy pairing, and resource allocation
 * for multi-agent collaboration on DAWG AI project.
 *
 * Key features:
 * - Shared status board
 * - Help request system
 * - Buddy pairing for collaboration
 * - Resource allocation coordination
 */

import fs from 'fs';
import path from 'path';
import { EventBus, getEventBus } from './eventBus';

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'blocked' | 'offline';
  current_task: string;
  progress: number;
  health: 'healthy' | 'degraded' | 'critical';
  needs_help: boolean;
  available_to_help: boolean;
  computational_resources: {
    cpu_usage: number;
    memory_usage: number;
    available_capacity: number;
  };
  last_update: string;
  capabilities: string[];
}

export interface HelpRequest {
  id: string;
  requester: string;
  requester_name: string;
  issue: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  required_capabilities?: string[];
  context?: Record<string, any>;
  created_at: string;
  claimed_by?: string;
  claimed_at?: string;
  resolved?: boolean;
  resolved_at?: string;
}

export interface BuddyPair {
  primary: string;
  buddy: string;
  focus: string;
  status: 'active' | 'paused' | 'completed';
  created_at?: string;
}

export interface AgentCoordinationState {
  agents: AgentStatus[];
  help_requests: HelpRequest[];
  buddy_pairs: BuddyPair[];
  resource_pool: {
    total_capacity: number;
    allocated: number;
    available: number;
    utilization_percent: number;
  };
  last_sync: string;
}

export class AgentCoordination {
  private eventBus: EventBus;
  private stateFilePath: string;
  private agentId: string;
  private agentName: string;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(agentId: string, agentName: string, eventBus?: EventBus) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.eventBus = eventBus || getEventBus({ mode: 'gitops', agentName: 'agent-coordination' });
    this.stateFilePath = path.join(process.cwd(), '_bus/state/agent-status.json');
  }

  /**
   * Initialize coordination system
   */
  async initialize(): Promise<void> {
    // Ensure state file exists
    if (!fs.existsSync(this.stateFilePath)) {
      const initialState: AgentCoordinationState = {
        agents: [],
        help_requests: [],
        buddy_pairs: [],
        resource_pool: {
          total_capacity: 0,
          allocated: 0,
          available: 0,
          utilization_percent: 0,
        },
        last_sync: new Date().toISOString(),
      };
      this.saveState(initialState);
    }

    // Connect to event bus
    await this.eventBus.connect();

    // Subscribe to coordination events
    this.subscribeToEvents();

    // Start periodic status updates (every 30 seconds)
    this.updateInterval = setInterval(() => {
      this.publishStatusUpdate();
    }, 30000);

    console.log(`[AgentCoordination] ${this.agentName} initialized`);
  }

  /**
   * Shutdown coordination system
   */
  async shutdown(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    await this.eventBus.disconnect();
  }

  /**
   * Subscribe to coordination events
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribe('agent.status.update', (envelope) => {
      this.handleStatusUpdate(envelope.payload);
    });

    this.eventBus.subscribe('agent.help.requested', (envelope) => {
      this.handleHelpRequest(envelope.payload);
    });

    this.eventBus.subscribe('agent.help.claimed', (envelope) => {
      this.handleHelpClaimed(envelope.payload);
    });

    this.eventBus.subscribe('agent.help.resolved', (envelope) => {
      this.handleHelpResolved(envelope.payload);
    });
  }

  /**
   * Update agent status
   */
  async updateStatus(update: Partial<AgentStatus>): Promise<void> {
    const state = this.loadState();

    const agentIndex = state.agents.findIndex((a) => a.id === this.agentId);

    const updatedAgent: AgentStatus = {
      id: this.agentId,
      name: this.agentName,
      role: update.role || '',
      status: update.status || 'active',
      current_task: update.current_task || '',
      progress: update.progress || 0,
      health: update.health || 'healthy',
      needs_help: update.needs_help || false,
      available_to_help: update.available_to_help !== undefined ? update.available_to_help : true,
      computational_resources: update.computational_resources || {
        cpu_usage: 0,
        memory_usage: 0,
        available_capacity: 100,
      },
      last_update: new Date().toISOString(),
      capabilities: update.capabilities || [],
    };

    if (agentIndex >= 0) {
      state.agents[agentIndex] = updatedAgent;
    } else {
      state.agents.push(updatedAgent);
    }

    this.recalculateResourcePool(state);
    this.saveState(state);

    // Publish status update event
    await this.eventBus.publish('agent.status.update', {
      agent_id: this.agentId,
      agent_name: this.agentName,
      status: updatedAgent,
    });
  }

  /**
   * Request help from other agents
   */
  async requestHelp(
    issue: string,
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    requiredCapabilities?: string[],
    context?: Record<string, any>
  ): Promise<string> {
    const state = this.loadState();

    const helpRequest: HelpRequest = {
      id: `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requester: this.agentId,
      requester_name: this.agentName,
      issue,
      urgency,
      required_capabilities: requiredCapabilities,
      context,
      created_at: new Date().toISOString(),
      resolved: false,
    };

    state.help_requests.push(helpRequest);
    this.saveState(state);

    // Publish help request event
    await this.eventBus.publish('agent.help.requested', {
      request_id: helpRequest.id,
      requester: this.agentId,
      requester_name: this.agentName,
      issue,
      urgency,
      required_capabilities: requiredCapabilities,
    });

    // Update own status to needs_help
    await this.updateStatus({ needs_help: true });

    console.log(`[AgentCoordination] Help requested: ${issue}`);
    return helpRequest.id;
  }

  /**
   * Claim a help request
   */
  async claimHelpRequest(requestId: string): Promise<boolean> {
    const state = this.loadState();

    const request = state.help_requests.find((r) => r.id === requestId);
    if (!request || request.claimed_by) {
      return false;
    }

    request.claimed_by = this.agentId;
    request.claimed_at = new Date().toISOString();
    this.saveState(state);

    // Publish help claimed event
    await this.eventBus.publish('agent.help.claimed', {
      request_id: requestId,
      claimed_by: this.agentId,
      claimed_by_name: this.agentName,
    });

    // Update own status to unavailable for help
    await this.updateStatus({ available_to_help: false });

    console.log(`[AgentCoordination] Claimed help request: ${requestId}`);
    return true;
  }

  /**
   * Resolve a help request
   */
  async resolveHelpRequest(requestId: string): Promise<void> {
    const state = this.loadState();

    const request = state.help_requests.find((r) => r.id === requestId);
    if (!request) {
      return;
    }

    request.resolved = true;
    request.resolved_at = new Date().toISOString();
    this.saveState(state);

    // Publish help resolved event
    await this.eventBus.publish('agent.help.resolved', {
      request_id: requestId,
      resolved_by: this.agentId,
      resolved_by_name: this.agentName,
    });

    // Update requester's status
    const requesterAgent = state.agents.find((a) => a.id === request.requester);
    if (requesterAgent) {
      requesterAgent.needs_help = false;
    }

    // Update own status to available for help again
    await this.updateStatus({ available_to_help: true });

    console.log(`[AgentCoordination] Resolved help request: ${requestId}`);
  }

  /**
   * Create a buddy pair
   */
  async createBuddyPair(buddyId: string, focus: string): Promise<void> {
    const state = this.loadState();

    const buddyPair: BuddyPair = {
      primary: this.agentId,
      buddy: buddyId,
      focus,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    state.buddy_pairs.push(buddyPair);
    this.saveState(state);

    await this.eventBus.publish('agent.buddy.paired', {
      primary: this.agentId,
      buddy: buddyId,
      focus,
    });

    console.log(`[AgentCoordination] Buddy pair created with ${buddyId}: ${focus}`);
  }

  /**
   * Get current coordination state
   */
  getState(): AgentCoordinationState {
    return this.loadState();
  }

  /**
   * Get available agents for help
   */
  getAvailableAgents(requiredCapabilities?: string[]): AgentStatus[] {
    const state = this.loadState();

    return state.agents.filter((agent) => {
      if (agent.id === this.agentId) return false; // Don't include self
      if (!agent.available_to_help) return false;
      if (agent.status !== 'active') return false;

      // Check capabilities if specified
      if (requiredCapabilities && requiredCapabilities.length > 0) {
        const hasCapabilities = requiredCapabilities.every((cap) =>
          agent.capabilities.includes(cap)
        );
        if (!hasCapabilities) return false;
      }

      return true;
    });
  }

  /**
   * Get open help requests
   */
  getOpenHelpRequests(): HelpRequest[] {
    const state = this.loadState();
    return state.help_requests.filter((r) => !r.resolved && !r.claimed_by);
  }

  // Private helper methods

  private handleStatusUpdate(payload: any): void {
    // Update local state cache if needed
    console.log(`[AgentCoordination] Status update from ${payload.agent_name}`);
  }

  private handleHelpRequest(payload: any): void {
    console.log(
      `[AgentCoordination] Help requested by ${payload.requester_name}: ${payload.issue}`
    );
  }

  private handleHelpClaimed(payload: any): void {
    console.log(`[AgentCoordination] Help request claimed by ${payload.claimed_by_name}`);
  }

  private handleHelpResolved(payload: any): void {
    console.log(`[AgentCoordination] Help request resolved by ${payload.resolved_by_name}`);
  }

  private publishStatusUpdate(): void {
    // Periodic status heartbeat
    const state = this.loadState();
    const myStatus = state.agents.find((a) => a.id === this.agentId);
    if (myStatus) {
      this.eventBus.publish('agent.heartbeat', {
        agent_id: this.agentId,
        agent_name: this.agentName,
        status: myStatus.status,
        health: myStatus.health,
      });
    }
  }

  private recalculateResourcePool(state: AgentCoordinationState): void {
    const totalCapacity = state.agents.reduce(
      (sum, agent) => sum + agent.computational_resources.available_capacity,
      0
    );
    const allocated = state.agents.reduce(
      (sum, agent) =>
        sum +
        (agent.computational_resources.cpu_usage + agent.computational_resources.memory_usage) / 2,
      0
    );

    state.resource_pool = {
      total_capacity: totalCapacity,
      allocated: Math.round(allocated),
      available: Math.round(totalCapacity - allocated),
      utilization_percent: totalCapacity > 0 ? Math.round((allocated / totalCapacity) * 100) : 0,
    };
  }

  private loadState(): AgentCoordinationState {
    try {
      const data = fs.readFileSync(this.stateFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[AgentCoordination] Failed to load state:', error);
      return {
        agents: [],
        help_requests: [],
        buddy_pairs: [],
        resource_pool: {
          total_capacity: 0,
          allocated: 0,
          available: 0,
          utilization_percent: 0,
        },
        last_sync: new Date().toISOString(),
      };
    }
  }

  private saveState(state: AgentCoordinationState): void {
    try {
      state.last_sync = new Date().toISOString();
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('[AgentCoordination] Failed to save state:', error);
    }
  }
}

// Singleton instance
let coordinationInstance: AgentCoordination | null = null;

export function getAgentCoordination(agentId: string, agentName: string): AgentCoordination {
  if (!coordinationInstance) {
    coordinationInstance = new AgentCoordination(agentId, agentName);
  }
  return coordinationInstance;
}
