import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { 
  Network, 
  Filter, 
  Palette, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Settings,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

interface ConversationNode {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'user' | 'bot';
  stressLevel?: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  category?: 'mindfulness' | 'health' | 'reflection' | 'exercise' | 'learning';
  sentiment?: 'positive' | 'negative' | 'neutral';
  cluster?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface ConversationLink {
  source: string | ConversationNode;
  target: string | ConversationNode;
  strength: number;
  type: 'temporal' | 'semantic' | 'stress' | 'category';
}

interface ConversationGraphProps {
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: string;
  }>;
  className?: string;
}

const ConversationGraph: React.FC<ConversationGraphProps> = ({ messages, className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [simulation, setSimulation] = useState<d3.Simulation<ConversationNode, ConversationLink> | null>(null);
  const [nodes, setNodes] = useState<ConversationNode[]>([]);
  const [links, setLinks] = useState<ConversationLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<ConversationNode | null>(null);
  const [filters, setFilters] = useState({
    stressLevel: 'all',
    category: 'all',
    sentiment: 'all',
    showLinks: true,
    showClusters: true
  });
  const [graphSettings, setGraphSettings] = useState({
    linkDistance: 50,
    nodeSize: 8,
    chargeStrength: -300,
    centerStrength: 0.1,
    clusterStrength: 0.2
  });
  const [showControls, setShowControls] = useState(true);

  // Analyze message content for sentiment and stress
  const analyzeMessage = useCallback((text: string, sender: 'user' | 'bot') => {
    const lowerText = text.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'happy', 'joyful', 'calm', 'relaxed', 'peaceful', 'grateful', 'better', 'optimistic'];
    const negativeWords = ['bad', 'awful', 'terrible', 'horrible', 'sad', 'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed', 'frustrated'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    // Simple stress level detection
    let stressLevel: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high' = 'moderate';
    if (/(great|awesome|fantastic|amazing|grateful|happy|joyful|calm|relaxed|peaceful)/.test(lowerText)) {
      stressLevel = 'very-low';
    } else if (/(good|fine|better|optimistic|content|satisfied)/.test(lowerText)) {
      stressLevel = 'low';
    } else if (/(stressed|anxious|worried|tense|overwhelmed|frustrated)/.test(lowerText)) {
      stressLevel = 'high';
    } else if (/(awful|terrible|horrible|depressed|can't cope|panic|extreme)/.test(lowerText)) {
      stressLevel = 'very-high';
    }
    
    // Category detection
    let category: 'mindfulness' | 'health' | 'reflection' | 'exercise' | 'learning' = 'health';
    if (/(breathing|meditation|mindfulness|calm|relax)/.test(lowerText)) category = 'mindfulness';
    else if (/(walk|run|exercise|workout|gym|sport)/.test(lowerText)) category = 'exercise';
    else if (/(journal|reflect|gratitude|writing)/.test(lowerText)) category = 'reflection';
    else if (/(learn|read|study|class|course|skill)/.test(lowerText)) category = 'learning';
    
    return { sentiment, stressLevel, category };
  }, []);

  // Create nodes and links from messages
  const createGraphData = useCallback(() => {
    const conversationNodes: ConversationNode[] = messages.map((msg, index) => {
      const analysis = analyzeMessage(msg.text, msg.sender);
      return {
        id: msg.id,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        sender: msg.sender,
        ...analysis,
        cluster: Math.floor(index / 5) // Simple clustering by conversation segments
      };
    });

    const conversationLinks: ConversationLink[] = [];
    
    // Create temporal links (sequential messages)
    for (let i = 0; i < conversationNodes.length - 1; i++) {
      conversationLinks.push({
        source: conversationNodes[i].id,
        target: conversationNodes[i + 1].id,
        strength: 1.0,
        type: 'temporal'
      });
    }
    
    // Create semantic links (similar content)
    for (let i = 0; i < conversationNodes.length; i++) {
      for (let j = i + 1; j < conversationNodes.length; j++) {
        const node1 = conversationNodes[i];
        const node2 = conversationNodes[j];
        
        // Calculate similarity based on common words
        const words1 = node1.text.toLowerCase().split(/\s+/);
        const words2 = node2.text.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        
        if (similarity > 0.3) {
          conversationLinks.push({
            source: node1.id,
            target: node2.id,
            strength: similarity,
            type: 'semantic'
          });
        }
      }
    }
    
    // Create stress-based links
    const stressNodes = conversationNodes.filter(node => 
      node.stressLevel === 'high' || node.stressLevel === 'very-high'
    );
    for (let i = 0; i < stressNodes.length; i++) {
      for (let j = i + 1; j < stressNodes.length; j++) {
        conversationLinks.push({
          source: stressNodes[i].id,
          target: stressNodes[j].id,
          strength: 0.8,
          type: 'stress'
        });
      }
    }
    
    // Create category-based links
    const categoryGroups = conversationNodes.reduce((acc, node) => {
      if (!acc[node.category!]) acc[node.category!] = [];
      acc[node.category!].push(node);
      return acc;
    }, {} as Record<string, ConversationNode[]>);
    
    Object.values(categoryGroups).forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          conversationLinks.push({
            source: group[i].id,
            target: group[j].id,
            strength: 0.6,
            type: 'category'
          });
        }
      }
    });

    setNodes(conversationNodes);
    setLinks(conversationLinks);
  }, [messages, analyzeMessage]);

  // Initialize and update simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create force simulation
    const newSimulation = d3.forceSimulation<ConversationNode>(nodes)
      .force('link', d3.forceLink<ConversationNode, ConversationLink>(links)
        .id(d => d.id)
        .distance(graphSettings.linkDistance)
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(graphSettings.chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(graphSettings.centerStrength))
      .force('cluster', d3.forceY(height / 2).strength(graphSettings.clusterStrength));

    setSimulation(newSimulation);

    // Create container
    const container = svg.append('g');

    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        switch (d.type) {
          case 'temporal': return '#3b82f6';
          case 'semantic': return '#10b981';
          case 'stress': return '#ef4444';
          case 'category': return '#f59e0b';
          default: return '#6b7280';
        }
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength) * 2);

    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', graphSettings.nodeSize)
      .attr('fill', d => {
        if (d.sender === 'user') {
          switch (d.stressLevel) {
            case 'very-low': return '#10b981';
            case 'low': return '#34d399';
            case 'moderate': return '#fbbf24';
            case 'high': return '#f97316';
            case 'very-high': return '#ef4444';
            default: return '#6b7280';
          }
        } else {
          return '#3b82f6';
        }
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, ConversationNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const label = container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.text.length > 30 ? d.text.substring(0, 30) + '...' : d.text)
      .attr('font-size', '10px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#374151')
      .attr('text-anchor', 'middle')
      .attr('dy', graphSettings.nodeSize + 15);

    // Add node interactions
    node
      .on('click', (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', graphSettings.nodeSize * 1.5);
        // Show tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${event.pageX - 10}, ${event.pageY - 10})`);
        
        tooltip.append('rect')
          .attr('width', 200)
          .attr('height', 100)
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 5);
        
        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .attr('fill', 'white')
          .text(`Sender: ${d.sender}`);
        
        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 40)
          .attr('fill', 'white')
          .text(`Stress: ${d.stressLevel}`);
        
        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 60)
          .attr('fill', 'white')
          .text(`Category: ${d.category}`);
        
        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 80)
          .attr('fill', 'white')
          .text(d.text.length > 50 ? d.text.substring(0, 50) + '...' : d.text);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', graphSettings.nodeSize);
        svg.selectAll('.tooltip').remove();
      });

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as ConversationNode).x!)
        .attr('y1', d => (d.source as ConversationNode).y!)
        .attr('x2', d => (d.target as ConversationNode).x!)
        .attr('y2', d => (d.target as ConversationNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Drag functions
    function dragstarted(event: any, d: ConversationNode) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: ConversationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: ConversationNode) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      newSimulation.stop();
    };
  }, [nodes, links, dimensions, graphSettings]);

  // Update simulation when settings change
  useEffect(() => {
    if (!simulation) return;

    simulation
      .force('link', d3.forceLink<ConversationNode, ConversationLink>(links)
        .id(d => d.id)
        .distance(graphSettings.linkDistance)
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(graphSettings.chargeStrength))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(graphSettings.centerStrength))
      .force('cluster', d3.forceY(dimensions.height / 2).strength(graphSettings.clusterStrength))
      .alpha(0.3)
      .restart();
  }, [simulation, graphSettings, dimensions, links]);

  // Initialize graph data
  useEffect(() => {
    createGraphData();
  }, [createGraphData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetSimulation = () => {
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('g');
      container.transition().duration(300).attr('transform', 'scale(1.2)');
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('g');
      container.transition().duration(300).attr('transform', 'scale(0.8)');
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Network className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Conversation Network</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(!showControls)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetSimulation}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showControls && (
        <div className="mb-6 p-4 bg-muted rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Stress Level Filter</label>
              <Select value={filters.stressLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, stressLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="very-low">Very Low</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very-high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category Filter</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mindfulness">Mindfulness</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sentiment Filter</label>
              <Select value={filters.sentiment} onValueChange={(value) => setFilters(prev => ({ ...prev, sentiment: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Link Distance: {graphSettings.linkDistance}</label>
              <Slider
                value={[graphSettings.linkDistance]}
                onValueChange={([value]) => setGraphSettings(prev => ({ ...prev, linkDistance: value }))}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Node Size: {graphSettings.nodeSize}</label>
              <Slider
                value={[graphSettings.nodeSize]}
                onValueChange={([value]) => setGraphSettings(prev => ({ ...prev, nodeSize: value }))}
                min={4}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Toggle
              pressed={filters.showLinks}
              onPressedChange={(pressed) => setFilters(prev => ({ ...prev, showLinks: pressed }))}
            >
              <Eye className="h-4 w-4 mr-2" />
              Show Links
            </Toggle>
            <Toggle
              pressed={filters.showClusters}
              onPressedChange={(pressed) => setFilters(prev => ({ ...prev, showClusters: pressed }))}
            >
              <Layers className="h-4 w-4 mr-2" />
              Show Clusters
            </Toggle>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50"
        />
        
        {selectedNode && (
          <div className="absolute top-4 right-4 p-4 bg-white rounded-lg shadow-lg max-w-sm">
            <h4 className="font-semibold mb-2">Message Details</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Sender:</strong> {selectedNode.sender}</div>
              <div><strong>Stress Level:</strong> 
                <Badge variant="outline" className="ml-2">
                  {selectedNode.stressLevel}
                </Badge>
              </div>
              <div><strong>Category:</strong> 
                <Badge variant="outline" className="ml-2">
                  {selectedNode.category}
                </Badge>
              </div>
              <div><strong>Sentiment:</strong> 
                <Badge variant="outline" className="ml-2">
                  {selectedNode.sentiment}
                </Badge>
              </div>
              <div><strong>Text:</strong> {selectedNode.text}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Temporal Links
        </Badge>
        <Badge variant="outline" className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Semantic Links
        </Badge>
        <Badge variant="outline" className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Stress Links
        </Badge>
        <Badge variant="outline" className="flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
          Category Links
        </Badge>
      </div>
    </Card>
  );
};

export default ConversationGraph;

