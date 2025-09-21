import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PenTool, Save, Settings, RotateCcw, ZoomIn, ZoomOut, Network, X } from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { playClickSound, playTaskCompleteSound } from "@/lib/audio";
import * as d3 from 'd3';

// Types for D3 nodes and links
type JournalNode = d3.SimulationNodeDatum & {
  id: string;
  title: string;
  content: string;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: 'mindfulness' | 'health' | 'reflection' | 'exercise' | 'learning' | 'general';
  mood?: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  cluster?: number;
};

type JournalLink = d3.SimulationLinkDatum<JournalNode> & {
  source: string | JournalNode;
  target: string | JournalNode;
  strength: number;
  type: 'temporal' | 'semantic';
};

const prompts = [
  "What am I grateful for today?",
  "How did I grow today?",
  "What challenged me and how did I handle it?",
  "What brought me joy today?",
  "What would I tell my younger self?",
];

export function Journal() {
  const {
    journalEntries = [],
    addJournalEntry,
  } = useWellness();

  // Quick Entry Modal State
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  
  // Journal Network State
  const [showNetworkView, setShowNetworkView] = useState(false);

  // Graph-Related State
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 700 });
  const [simulation, setSimulation] = useState<d3.Simulation<JournalNode, JournalLink> | null>(null);
  const [nodes, setNodes] = useState<JournalNode[]>([]);
  const [links, setLinks] = useState<JournalLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<JournalNode | null>(null);
  const [showControls, setShowControls] = useState(false);

  // Graph settings for spacing & neatness
  const [graphSettings, setGraphSettings] = useState({
    linkDistance: 140,    // Farther apart
    nodeSize: 14,         // Fat clickable node
    chargeStrength: -650, // More repel = more space
    centerStrength: 0.18, // Pull toward center
    clusterStrength: 0.2, // Keeps clusters together
    collision: 24,        // Prevent node overlapping
  });

  // Sentiment/mood/category analyzer
  const analyzeEntry = useCallback((content: string, title: string) => {
    // Only use for clustering/links, not color!
    return { sentiment: 'neutral', mood: 'moderate', category: 'general' };
  }, []);

  // Add new entry
  const saveEntry = () => {
    const content = currentEntry.trim();
    if (!content) return;
    const title = (currentTitle.trim() || content.slice(0, 40) || "Untitled").trim();
    const date = new Date().toISOString().split('T')[0];
    if (addJournalEntry) {
      addJournalEntry({ title, content, date });
      playTaskCompleteSound();
    }
    setCurrentEntry("");
    setCurrentTitle("");
    setSelectedPrompt("");
  };

  const usePrompt = (prompt: string) => {
    playClickSound();
    setSelectedPrompt(prompt);
    setCurrentTitle(prompt);
  };

  // Graph Data - always neutral
  const createGraphData = useCallback(() => {
    const journalNodes: JournalNode[] = journalEntries.map((entry, index) => {
      const analysis = analyzeEntry(entry.content, entry.title);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: entry.date,
        ...analysis,
        cluster: Math.floor(index / 3)
      };
    });

    const journalLinks: JournalLink[] = [];
    for (let i = 0; i < journalNodes.length - 1; i++) {
      journalLinks.push({
        source: journalNodes[i].id,
        target: journalNodes[i + 1].id,
        strength: 1.0,
        type: 'temporal'
      });
    }
    for (let i = 0; i < journalNodes.length; i++) {
      for (let j = i + 1; j < journalNodes.length; j++) {
        const node1 = journalNodes[i];
        const node2 = journalNodes[j];
        const words1 = `${node1.title} ${node1.content}`.toLowerCase().split(/\s+/);
        const words2 = `${node2.title} ${node2.content}`.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        if (similarity > 0.2) {
          journalLinks.push({
            source: node1.id,
            target: node2.id,
            strength: similarity,
            type: 'semantic'
          });
        }
      }
    }
    // No mood/category links for plain gray graph
    setNodes(journalNodes);
    setLinks(journalLinks);
  }, [journalEntries, analyzeEntry]);

  // D3: Large centered square, all gray, minimum text
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;

    // SVG glow filter (gray-ish)
    svg.append("defs").html(`
      <filter id="gray-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="shadow"/>
        <feMerge>
          <feMergeNode in="shadow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `);

    const newSimulation = d3.forceSimulation<JournalNode>(nodes)
      .force('link', d3.forceLink<JournalNode, JournalLink>(links).id((d: JournalNode) => d.id).distance(graphSettings.linkDistance).strength((d: any) => d.strength))
      .force('charge', d3.forceManyBody().strength(graphSettings.chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(graphSettings.centerStrength))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force('cluster', d3.forceY(height / 2).strength(graphSettings.clusterStrength))
      .force('collision', d3.forceCollide().radius(graphSettings.collision));
    setSimulation(newSimulation);

    const container = svg.append('g');

    // Links
    container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#bbb')
      .attr('stroke-opacity', 0.22)
      .attr('stroke-width', (d: any) => 2 + d.strength);
    // Nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', graphSettings.nodeSize)
      .attr('fill', "#a3a3a3")
      .attr('stroke', "#ececec")
      .attr('stroke-width', 2)
      .attr('opacity', 0.83)
      .attr("filter", "url(#gray-glow)")
      .style('cursor', 'pointer')
      .on('click', (event: any, d: JournalNode) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .on('mouseover', function () {
        d3.select(this).attr('r', graphSettings.nodeSize * 1.35).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', graphSettings.nodeSize).attr('opacity', 0.83);
      });

    // Enable drag to move nodes
    const dragBehavior = d3.drag<SVGCircleElement, JournalNode>()
      .on('start', (event: d3.D3DragEvent<SVGCircleElement, JournalNode, unknown>, d: JournalNode) => {
        if (!event.active) newSimulation.alphaTarget(0.3).restart();
        d.fx = d.x ?? 0;
        d.fy = d.y ?? 0;
      })
      .on('drag', (event: d3.D3DragEvent<SVGCircleElement, JournalNode, unknown>, d: JournalNode) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: d3.D3DragEvent<SVGCircleElement, JournalNode, unknown>, d: JournalNode) => {
        if (!event.active) newSimulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior as any);
    // Short label under each node
    container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.title.slice(0, 8) + (d.title.length > 8 ? '…' : ''))
      .attr('font-size', '11px')
      .attr('fill', '#5a5a5a')
      .attr('text-anchor', 'middle')
      .attr('dy', graphSettings.nodeSize + 16)
      .attr('pointer-events', 'none');

    // Animate positions
    newSimulation.on('tick', () => {
      const pad = graphSettings.nodeSize + 10;
      const clampX = (x: number) => Math.max(pad, Math.min(width - pad, x));
      const clampY = (y: number) => Math.max(pad, Math.min(height - pad, y));

      // Clamp node positions to keep everything inside the viewport
      nodes.forEach((n) => {
        n.x = clampX((n.x ?? 0));
        n.y = clampY((n.y ?? 0));
      });

      container.selectAll<SVGLineElement, JournalLink>('line')
        .attr('x1', (d: JournalLink) => {
          const s = d.source as JournalNode; return clampX((s.x ?? 0));
        })
        .attr('y1', (d: JournalLink) => {
          const s = d.source as JournalNode; return clampY((s.y ?? 0));
        })
        .attr('x2', (d: JournalLink) => {
          const t = d.target as JournalNode; return clampX((t.x ?? 0));
        })
        .attr('y2', (d: JournalLink) => {
          const t = d.target as JournalNode; return clampY((t.y ?? 0));
        });

      container.selectAll<SVGCircleElement, JournalNode>('circle')
        .attr('cx', (d: JournalNode) => clampX(d.x ?? 0))
        .attr('cy', (d: JournalNode) => clampY(d.y ?? 0));
      container.selectAll<SVGTextElement, JournalNode>('text')
        .attr('x', (d: JournalNode) => clampX(d.x ?? 0))
        .attr('y', (d: JournalNode) => clampY(d.y ?? 0));
    });

    return () => { newSimulation.stop(); };
  }, [nodes, links, dimensions, graphSettings]);

  // React to settings/dimensions
  useEffect(() => {
    if (!simulation) return;
    simulation
      .force('link', d3.forceLink<JournalNode, JournalLink>(links).id((d: JournalNode) => d.id).distance(graphSettings.linkDistance).strength((d: any) => d.strength))
      .force('charge', d3.forceManyBody().strength(graphSettings.chargeStrength))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(graphSettings.centerStrength))
      .force('collision', d3.forceCollide().radius(graphSettings.collision))
      .alpha(0.3).restart();
  }, [simulation, graphSettings, dimensions, links]);
  useEffect(() => { if (journalEntries.length > 0) createGraphData(); }, [journalEntries, analyzeEntry]);
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.max(380, Math.min(rect.width, window.innerHeight - 240, 700));
        setDimensions({ width: size, height: size });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Graph controls
  const resetSimulation = () => { if (simulation) simulation.alpha(1).restart(); };
  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('g');
      container.transition().duration(300).attr('transform', 'scale(1.17)');
    }
  };
  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('g');
      container.transition().duration(300).attr('transform', 'scale(0.83)');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-background via-background to-muted/20">
      
      {/* Header */}
      <div className="pt-8 pb-4 w-full flex flex-col justify-center items-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-accent/20 to-secondary/20 mb-3 shadow">
          <PenTool className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
          Daily Journal
        </h1>
        <p className="text-lg text-muted-foreground font-medium mb-4">
          Reflect, process, and grow. Your thoughts matter.
        </p>
      </div>

      {/* Main Content: Add Journal center with Network tile beside */}
      <div className="flex flex-col lg:flex-row justify-center items-start w-full max-w-7xl mx-auto px-4 gap-6 mb-24">
        
        {/* Main Add Journal Section */}
        <div className="flex-1 max-w-2xl">
          <Card className="p-8 rounded-3xl shadow-2xl border border-border bg-background/70 backdrop-blur">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 shadow">
                <PenTool className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                New Journal Entry
              </h2>
              <p className="text-muted-foreground">
                Express your thoughts, feelings, and reflections
              </p>
            </div>
            
            {/* Writing Prompts */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Writing Prompts</h3>
              <div className="flex flex-wrap gap-2">
                {prompts.map(prompt => (
                  <Button
                    variant="outline"
                    key={prompt}
                    className="rounded-xl px-3 py-1 text-sm hover:bg-primary/10"
                    onClick={() => usePrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Entry Form */}
            <div className="space-y-4">
              <Input
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Entry title..."
                className="text-lg rounded-xl border-2 focus:border-primary/50"
              />
              <Textarea
                value={currentEntry}
                onChange={e => setCurrentEntry(e.target.value)}
                placeholder="What's on your mind? How was your day? What are you feeling?"
                className="min-h-[200px] text-base leading-relaxed rounded-xl border-2 focus:border-primary/50 resize-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setCurrentEntry("");
                  setCurrentTitle("");
                  setSelectedPrompt("");
                }}
                variant="outline"
                className="rounded-xl"
              >
                Clear
              </Button>
              <Button
                onClick={saveEntry}
                disabled={!currentEntry.trim() || !currentTitle.trim()}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent"
              >
                <Save className="h-4 w-4" />
                <span>Save Entry</span>
              </Button>
            </div>
          </Card>
          
          {/* Recent Entries */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {journalEntries.slice(0, 3).map(entry => (
                <Card key={entry.id} className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{entry.title}</h4>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.content.substring(0, 120)}...
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* Journal Network Tile */}
        <div className="w-full lg:w-80">
          <Card className="p-6 rounded-3xl shadow-xl border border-border bg-background/70 backdrop-blur hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                onClick={() => setShowNetworkView(true)}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4 shadow group-hover:scale-110 transition-transform">
                <Network className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Journal Network</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize connections between your journal entries
              </p>
              
              {/* Mini Preview */}
              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <div className="flex justify-center items-center space-x-2">
                  {Array.from({ length: Math.min(5, journalEntries.length) }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-purple-400 opacity-60 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {journalEntries.length} entries • {Math.max(0, journalEntries.length - 1)} connections
                </div>
              </div>
              
              <Button variant="outline" className="rounded-xl w-full group-hover:bg-primary/10">
                Explore Network
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Journal Network Modal */}
      {showNetworkView && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center transition-all animate-in fade-in backdrop-blur-sm p-4">
          <div ref={containerRef}
            className="flex flex-col items-center justify-center w-full max-w-6xl select-none">
            <Card className="p-6 flex flex-col items-center justify-center
                            rounded-3xl shadow-2xl border border-border
                            bg-background/70 backdrop-blur relative w-full"
                  style={{
                    width: `${Math.min(dimensions.width, window.innerWidth - 32)}px`,
                    height: `${Math.min(dimensions.height + 100, window.innerHeight - 32)}px`,
                    minWidth: "340px",
                    minHeight: "400px",
                    maxWidth: "95vw",
                    maxHeight: "95vh"
                  }}>
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2 ml-2">
                  <Network className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Journal Network</h3>
                </div>
                <div className="flex items-center gap-2 mr-2">
                  <Button variant="outline" size="sm" onClick={() => setShowControls(!showControls)} className="rounded-xl">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetSimulation} className="rounded-xl">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomIn} className="rounded-xl">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomOut} className="rounded-xl">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowNetworkView(false)} 
                    className="rounded-xl ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {showControls && (
                <div className="mb-4 p-3 bg-muted/40 rounded-xl w-full max-w-xl mx-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Link Distance</label>
                      <input type="range"
                        min={90} max={220} step={10}
                        value={graphSettings.linkDistance}
                        onChange={e => setGraphSettings(prev => ({ ...prev, linkDistance: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Node Size</label>
                      <input type="range"
                        min={10} max={24} step={1}
                        value={graphSettings.nodeSize}
                        onChange={e => setGraphSettings(prev => ({ ...prev, nodeSize: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <svg
                ref={svgRef}
                width={Math.min(dimensions.width, window.innerWidth - 80)}
                height={Math.min(dimensions.height, window.innerHeight - 200)}
                className="rounded-3xl bg-muted/30"
                style={{ boxShadow: "0 5px 40px 0 rgba(130, 130, 130, 0.05)" }}
              />

              {selectedNode && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 p-5 bg-background rounded-xl shadow-lg max-w-md border border-border z-20"
                  style={{ minWidth: 230 }}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-base">Entry Details</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 rounded-xl"
                      onClick={() => setSelectedNode(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><b>Title:</b> {selectedNode.title}</div>
                    <div><b>Date:</b> {selectedNode.date}</div>
                    <div className="break-words"><b>Content:</b> {selectedNode.content.substring(0, 120)}...</div>
                  </div>
                </div>
              )}

              <span className="absolute left-4 bottom-3 text-xs text-muted-foreground/70">All nodes gray for clarity</span>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
