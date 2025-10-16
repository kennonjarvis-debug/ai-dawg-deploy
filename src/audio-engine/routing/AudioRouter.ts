/**
 * AudioRouter - Manages audio routing between tracks and busses
 */

interface RoutingConnection {
  sourceId: string;
  destinationId: string;
}

export class AudioRouter {
  private connections: Map<string, Set<string>> = new Map();

  /**
   * Connect source to destination
   */
  connect(sourceId: string, destinationId: string): void {
    if (!this.connections.has(sourceId)) {
      this.connections.set(sourceId, new Set());
    }

    const destinations = this.connections.get(sourceId)!;
    destinations.add(destinationId);

    // Check for circular routing
    if (this.hasCircularRoute(sourceId, destinationId)) {
      destinations.delete(destinationId);
      throw new Error(`Circular routing detected: ${sourceId} -> ${destinationId}`);
    }

    console.log(`AudioRouter: Connected ${sourceId} -> ${destinationId}`);
  }

  /**
   * Disconnect source from destination
   */
  disconnect(sourceId: string, destinationId: string): void {
    const destinations = this.connections.get(sourceId);
    if (destinations) {
      destinations.delete(destinationId);

      if (destinations.size === 0) {
        this.connections.delete(sourceId);
      }

      console.log(`AudioRouter: Disconnected ${sourceId} -> ${destinationId}`);
    }
  }

  /**
   * Disconnect all connections for a node
   */
  disconnectAll(nodeId: string): void {
    // Remove as source
    this.connections.delete(nodeId);

    // Remove as destination
    this.connections.forEach((destinations, sourceId) => {
      destinations.delete(nodeId);
    });

    console.log(`AudioRouter: Disconnected all for ${nodeId}`);
  }

  /**
   * Remove a node from the routing graph
   */
  removeNode(nodeId: string): void {
    this.disconnectAll(nodeId);
  }

  /**
   * Get all destinations for a source
   */
  getDestinations(sourceId: string): string[] {
    return Array.from(this.connections.get(sourceId) || []);
  }

  /**
   * Get all sources for a destination
   */
  getSources(destinationId: string): string[] {
    const sources: string[] = [];

    this.connections.forEach((destinations, sourceId) => {
      if (destinations.has(destinationId)) {
        sources.push(sourceId);
      }
    });

    return sources;
  }

  /**
   * Check if a connection exists
   */
  isConnected(sourceId: string, destinationId: string): boolean {
    const destinations = this.connections.get(sourceId);
    return destinations ? destinations.has(destinationId) : false;
  }

  /**
   * Get all connections
   */
  getAllConnections(): RoutingConnection[] {
    const allConnections: RoutingConnection[] = [];

    this.connections.forEach((destinations, sourceId) => {
      destinations.forEach(destinationId => {
        allConnections.push({ sourceId, destinationId });
      });
    });

    return allConnections;
  }

  /**
   * Check for circular routing using DFS
   */
  private hasCircularRoute(startId: string, targetId: string): boolean {
    const visited = new Set<string>();
    const stack = [targetId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === startId) {
        return true; // Circular route found
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const destinations = this.connections.get(current);
      if (destinations) {
        stack.push(...destinations);
      }
    }

    return false;
  }

  /**
   * Get routing graph for visualization
   */
  getRoutingGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    this.connections.forEach((destinations, sourceId) => {
      graph.set(sourceId, Array.from(destinations));
    });

    return graph;
  }

  /**
   * Clear all routing connections
   */
  clear(): void {
    this.connections.clear();
    console.log('AudioRouter: All connections cleared');
  }
}
