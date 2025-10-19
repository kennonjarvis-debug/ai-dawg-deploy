import fs from 'fs/promises';
import path from 'path';

/**
 * Node in the knowledge graph
 */
export interface GraphNode {
  id: string;
  type: 'file' | 'test' | 'feature' | 'component';
  name: string;
  metadata: {
    path?: string;
    description?: string;
    tags?: string[];
    lastModified?: string;
    [key: string]: any;
  };
}

/**
 * Edge/relationship in the knowledge graph
 */
export interface GraphEdge {
  from: string;
  to: string;
  type: 'depends_on' | 'tests' | 'implements' | 'uses' | 'related_to';
  weight: number; // Strength of relationship (0-1)
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Impact analysis result
 */
export interface ImpactAnalysis {
  tests: string[];
  features: string[];
  files: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
}

/**
 * KnowledgeGraph: Builds and maintains a graph of code relationships
 *
 * Capabilities:
 * - Track which tests cover which features
 * - Map file dependencies
 * - Identify impact zones for changes
 * - Find related components
 * - Suggest test coverage gaps
 */
export class KnowledgeGraph {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge[]>; // Adjacency list: nodeId -> edges
  private storageDir: string;
  private storageFile: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.join(process.cwd(), 'tests/ai-testing-agent/brain/.storage');
    this.storageFile = path.join(this.storageDir, 'knowledge-graph.json');
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * Initialize the knowledge graph
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await this.load();
    console.log(`  KnowledgeGraph initialized with ${this.nodes.size} nodes`);
  }

  /**
   * Add a code file node
   */
  async addCodeFile(
    filePath: string,
    features: string[],
    dependencies: string[]
  ): Promise<void> {
    const nodeId = this.createNodeId('file', filePath);

    // Add file node
    this.nodes.set(nodeId, {
      id: nodeId,
      type: 'file',
      name: path.basename(filePath),
      metadata: {
        path: filePath,
        lastModified: new Date().toISOString(),
      },
    });

    // Add feature nodes and relationships
    for (const feature of features) {
      const featureId = this.createNodeId('feature', feature);

      if (!this.nodes.has(featureId)) {
        this.nodes.set(featureId, {
          id: featureId,
          type: 'feature',
          name: feature,
          metadata: {},
        });
      }

      this.addEdge(nodeId, featureId, 'implements', 0.9);
    }

    // Add dependency relationships
    for (const dep of dependencies) {
      const depId = this.createNodeId('file', dep);

      if (!this.nodes.has(depId)) {
        this.nodes.set(depId, {
          id: depId,
          type: 'file',
          name: path.basename(dep),
          metadata: { path: dep },
        });
      }

      this.addEdge(nodeId, depId, 'depends_on', 0.8);
    }

    await this.save();
  }

  /**
   * Add a test node and its relationships
   */
  async addTest(
    testName: string,
    testedFiles: string[],
    testedFeatures: string[]
  ): Promise<void> {
    const testId = this.createNodeId('test', testName);

    // Add test node
    this.nodes.set(testId, {
      id: testId,
      type: 'test',
      name: testName,
      metadata: {
        lastRun: new Date().toISOString(),
      },
    });

    // Link to files
    for (const file of testedFiles) {
      const fileId = this.createNodeId('file', file);
      this.addEdge(testId, fileId, 'tests', 1.0);
    }

    // Link to features
    for (const feature of testedFeatures) {
      const featureId = this.createNodeId('feature', feature);
      this.addEdge(testId, featureId, 'tests', 0.95);
    }

    await this.save();
  }

  /**
   * Add relationships between nodes
   */
  async addRelationships(
    fromName: string,
    toNames: string[],
    relationType: GraphEdge['type']
  ): Promise<void> {
    const fromId = this.findNodeByName(fromName);
    if (!fromId) return;

    for (const toName of toNames) {
      const toId = this.findNodeByName(toName);
      if (toId) {
        this.addEdge(fromId, toId, relationType, 0.7);
      }
    }

    await this.save();
  }

  /**
   * Get information about a file
   */
  async getFileInfo(filePath: string): Promise<{
    relatedFiles: string[];
    dependencies: string[];
    tests: string[];
    features: string[];
  }> {
    const nodeId = this.createNodeId('file', filePath);
    const node = this.nodes.get(nodeId);

    if (!node) {
      return { relatedFiles: [], dependencies: [], tests: [], features: [] };
    }

    const outgoingEdges = this.edges.get(nodeId) || [];
    const incomingEdges = this.getIncomingEdges(nodeId);

    const dependencies: string[] = [];
    const features: string[] = [];
    const tests: string[] = [];
    const relatedFiles: string[] = [];

    // Analyze outgoing edges
    for (const edge of outgoingEdges) {
      const targetNode = this.nodes.get(edge.to);
      if (!targetNode) continue;

      if (edge.type === 'depends_on' && targetNode.type === 'file') {
        dependencies.push(targetNode.metadata.path || targetNode.name);
      } else if (edge.type === 'implements' && targetNode.type === 'feature') {
        features.push(targetNode.name);
      } else if (targetNode.type === 'file') {
        relatedFiles.push(targetNode.metadata.path || targetNode.name);
      }
    }

    // Analyze incoming edges
    for (const edge of incomingEdges) {
      const sourceNode = this.nodes.get(edge.from);
      if (!sourceNode) continue;

      if (edge.type === 'tests' && sourceNode.type === 'test') {
        tests.push(sourceNode.name);
      } else if (edge.type === 'depends_on' && sourceNode.type === 'file') {
        relatedFiles.push(sourceNode.metadata.path || sourceNode.name);
      }
    }

    return {
      relatedFiles: [...new Set(relatedFiles)],
      dependencies: [...new Set(dependencies)],
      tests: [...new Set(tests)],
      features: [...new Set(features)],
    };
  }

  /**
   * Analyze impact of changes to files
   */
  async analyzeImpact(changedFiles: string[]): Promise<ImpactAnalysis> {
    const affectedNodes = new Set<string>();
    const affectedTests = new Set<string>();
    const affectedFeatures = new Set<string>();
    const affectedFiles = new Set<string>(changedFiles);

    // BFS to find all affected nodes
    const queue: string[] = changedFiles.map(f => this.createNodeId('file', f));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      affectedNodes.add(nodeId);

      // Check incoming edges (what depends on this?)
      const incomingEdges = this.getIncomingEdges(nodeId);
      for (const edge of incomingEdges) {
        const sourceNode = this.nodes.get(edge.from);
        if (!sourceNode) continue;

        // Track by type
        if (sourceNode.type === 'test') {
          affectedTests.add(sourceNode.name);
        } else if (sourceNode.type === 'file') {
          affectedFiles.add(sourceNode.metadata.path || sourceNode.name);
        } else if (sourceNode.type === 'feature') {
          affectedFeatures.add(sourceNode.name);
        }

        // Continue BFS
        if (edge.type === 'depends_on' || edge.type === 'tests') {
          queue.push(edge.from);
        }
      }

      // Check outgoing edges (what does this depend on?)
      const outgoingEdges = this.edges.get(nodeId) || [];
      for (const edge of outgoingEdges) {
        const targetNode = this.nodes.get(edge.to);
        if (!targetNode) continue;

        if (targetNode.type === 'feature') {
          affectedFeatures.add(targetNode.name);
        }
      }
    }

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(
      affectedTests.size,
      affectedFeatures.size,
      affectedFiles.size
    );

    const reasoning = this.generateRiskReasoning(
      changedFiles.length,
      affectedTests.size,
      affectedFeatures.size,
      affectedFiles.size
    );

    return {
      tests: Array.from(affectedTests),
      features: Array.from(affectedFeatures),
      files: Array.from(affectedFiles),
      riskLevel,
      reasoning,
    };
  }

  /**
   * Find test coverage gaps
   */
  async findCoverageGaps(): Promise<Array<{
    file: string;
    features: string[];
    hasCoverage: boolean;
    suggestedTests: string[];
  }>> {
    const gaps: Array<{
      file: string;
      features: string[];
      hasCoverage: boolean;
      suggestedTests: string[];
    }> = [];

    // Iterate through all file nodes
    for (const [nodeId, node] of this.nodes) {
      if (node.type !== 'file') continue;

      const incomingEdges = this.getIncomingEdges(nodeId);
      const hasTests = incomingEdges.some(
        e => e.type === 'tests' && this.nodes.get(e.from)?.type === 'test'
      );

      if (!hasTests) {
        // Get features this file implements
        const outgoingEdges = this.edges.get(nodeId) || [];
        const features = outgoingEdges
          .filter(e => e.type === 'implements')
          .map(e => this.nodes.get(e.to)?.name)
          .filter(Boolean) as string[];

        gaps.push({
          file: node.metadata.path || node.name,
          features,
          hasCoverage: false,
          suggestedTests: features.map(f => `test-${f.toLowerCase().replace(/\s+/g, '-')}`),
        });
      }
    }

    return gaps;
  }

  /**
   * Get related nodes by type
   */
  async getRelatedNodes(nodeId: string, maxDepth: number = 2): Promise<GraphNode[]> {
    const related = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      if (id !== nodeId) {
        related.add(id);
      }

      // Add neighbors
      const outgoing = this.edges.get(id) || [];
      const incoming = this.getIncomingEdges(id);

      [...outgoing, ...incoming].forEach(edge => {
        const neighborId = edge.from === id ? edge.to : edge.from;
        queue.push({ id: neighborId, depth: depth + 1 });
      });
    }

    return Array.from(related)
      .map(id => this.nodes.get(id))
      .filter(Boolean) as GraphNode[];
  }

  /**
   * Export graph for visualization
   */
  async exportForVisualization(): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }> {
    const allEdges: GraphEdge[] = [];

    for (const [nodeId, edges] of this.edges) {
      allEdges.push(...edges);
    }

    return {
      nodes: Array.from(this.nodes.values()),
      edges: allEdges,
    };
  }

  // ==================== Private Helper Methods ====================

  private createNodeId(type: string, name: string): string {
    return `${type}:${name}`;
  }

  private findNodeByName(name: string): string | undefined {
    for (const [id, node] of this.nodes) {
      if (node.name === name || node.metadata.path === name) {
        return id;
      }
    }
    return undefined;
  }

  private addEdge(
    from: string,
    to: string,
    type: GraphEdge['type'],
    weight: number
  ): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }

    // Check if edge already exists
    const existing = this.edges.get(from)!.find(e => e.to === to && e.type === type);

    if (existing) {
      // Update weight (average with existing)
      existing.weight = (existing.weight + weight) / 2;
    } else {
      this.edges.get(from)!.push({ from, to, type, weight });
    }
  }

  private getIncomingEdges(nodeId: string): GraphEdge[] {
    const incoming: GraphEdge[] = [];

    for (const edges of this.edges.values()) {
      for (const edge of edges) {
        if (edge.to === nodeId) {
          incoming.push(edge);
        }
      }
    }

    return incoming;
  }

  private calculateRiskLevel(
    testsAffected: number,
    featuresAffected: number,
    filesAffected: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const totalImpact = testsAffected + featuresAffected + filesAffected;

    if (totalImpact === 0) return 'low';
    if (totalImpact <= 5) return 'low';
    if (totalImpact <= 15) return 'medium';
    if (totalImpact <= 30) return 'high';
    return 'critical';
  }

  private generateRiskReasoning(
    changedFiles: number,
    testsAffected: number,
    featuresAffected: number,
    filesAffected: number
  ): string {
    const parts: string[] = [];

    parts.push(`${changedFiles} file(s) changed`);

    if (testsAffected > 0) {
      parts.push(`${testsAffected} test(s) affected`);
    }

    if (featuresAffected > 0) {
      parts.push(`${featuresAffected} feature(s) impacted`);
    }

    if (filesAffected > changedFiles) {
      const dependent = filesAffected - changedFiles;
      parts.push(`${dependent} dependent file(s)`);
    }

    return parts.join(', ');
  }

  private async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storageFile, 'utf-8');
      const data = JSON.parse(content);

      if (data.nodes && data.edges) {
        this.nodes.clear();
        this.edges.clear();

        // Load nodes
        for (const node of data.nodes) {
          this.nodes.set(node.id, node);
        }

        // Load edges
        for (const [nodeId, edges] of Object.entries(data.edges)) {
          this.edges.set(nodeId, edges as GraphEdge[]);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('  Warning: Failed to load knowledge graph:', error.message);
      }
    }
  }

  private async save(): Promise<void> {
    const data = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      nodes: Array.from(this.nodes.values()),
      edges: Object.fromEntries(this.edges),
    };

    await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
