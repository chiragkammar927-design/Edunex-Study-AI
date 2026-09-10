import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  Sparkles,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Bot,
  HelpCircle,
  ArrowRight,
  GitFork,
  Layers,
  Award,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Info,
  Sliders,
  TrendingUp,
  BrainCircuit,
  Flame,
} from 'lucide-react';
import { PathwayNode, PathwayLink, SubjectType } from '../types';
import {
  initialPathwayNodes,
  initialPathwayLinks,
  getAncestorPrerequisites,
  getDescendantDependents,
} from '../data/learningPathwaysData';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface LearningPathwaysProps {
  onOpenCoachWithTopic?: (subject: SubjectType, topic: string) => void;
  onOpenQuizWithTopic?: (subject: SubjectType, topic: string) => void;
  onOpenLesson?: (subject: SubjectType, chapterTitle: string) => void;
  onAddXP?: (amount: number, reason?: string) => void;
}

interface D3Node extends PathwayNode, d3.SimulationNodeDatum {
  id: string;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: D3Node | string;
  target: D3Node | string;
  type: 'prerequisite' | 'recommended' | 'interdisciplinary';
  description?: string;
}

export const LearningPathways: React.FC<LearningPathwaysProps> = ({
  onOpenCoachWithTopic,
  onOpenQuizWithTopic,
  onOpenLesson,
  onAddXP,
}) => {
  // Persistence for user progress through the pathways
  const [nodes, setNodes] = useState<PathwayNode[]>(() => {
    const saved = localStorage.getItem('nexora_learning_pathways_nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialPathwayNodes;
      }
    }
    return initialPathwayNodes;
  });

  const [links] = useState<PathwayLink[]>(initialPathwayLinks);

  // Filter and Layout states
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'pipeline' | 'force'>('pipeline');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInterdisciplinary, setShowInterdisciplinary] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Selected Node for Drawer Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('math-calculus');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // SVG & D3 Refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('nexora_learning_pathways_nodes', JSON.stringify(nodes));
  }, [nodes]);

  // Derived filtered nodes and links
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (selectedSubject !== 'all' && node.subject !== selectedSubject) return false;
      if (selectedStatus !== 'all' && node.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(q);
        const matchesDesc = node.description.toLowerCase().includes(q);
        const matchesSubject = node.subject.toLowerCase().includes(q);
        const matchesConcept = node.keyConcepts.some((c) => c.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesConcept) return false;
      }
      return true;
    });
  }, [nodes, selectedSubject, selectedStatus, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as D3Node).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as D3Node).id;

      if (!activeNodeIds.has(sourceId) || !activeNodeIds.has(targetId)) return false;
      if (!showInterdisciplinary && link.type === 'interdisciplinary') return false;
      return true;
    });
  }, [links, activeNodeIds, showInterdisciplinary]);

  // Highlight chains for currently inspected/hovered node
  const focusNodeId = hoveredNodeId || selectedNodeId;
  const ancestorPrereqs = useMemo(() => {
    if (!focusNodeId) return new Set<string>();
    return getAncestorPrerequisites(focusNodeId, nodes);
  }, [focusNodeId, nodes]);

  const descendantDependents = useMemo(() => {
    if (!focusNodeId) return new Set<string>();
    return getDescendantDependents(focusNodeId, nodes);
  }, [focusNodeId, nodes]);

  // Node Inspector current node
  const activeInspectorNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = nodes.length;
    const mastered = nodes.filter((n) => n.status === 'mastered').length;
    const inProgress = nodes.filter((n) => n.status === 'in_progress').length;
    const ready = nodes.filter((n) => n.status === 'ready').length;
    const weak = nodes.filter((n) => n.status === 'weak').length;
    const locked = nodes.filter((n) => n.status === 'locked').length;
    const avgMastery = Math.round(nodes.reduce((acc, n) => acc + n.masteryPercentage, 0) / (total || 1));

    // Find recommended next topic: ready or in-progress with high exam weight
    const recommended =
      nodes.find((n) => n.status === 'ready' && n.examWeight === 'High') ||
      nodes.find((n) => n.status === 'in_progress') ||
      nodes.find((n) => n.status === 'ready') ||
      nodes[0];

    return { total, mastered, inProgress, ready, weak, locked, avgMastery, recommended };
  }, [nodes]);

  // Color helper according to subject
  const getSubjectColor = (subject: SubjectType) => {
    switch (subject) {
      case 'Mathematics':
        return { primary: '#3b82f6', light: '#dbeafe', dark: '#1e3a8a', ring: '#60a5fa' };
      case 'Physics':
        return { primary: '#8b5cf6', light: '#ede9fe', dark: '#4c1d95', ring: '#a78bfa' };
      case 'Chemistry':
        return { primary: '#06b6d4', light: '#cffafe', dark: '#164e63', ring: '#22d3ee' };
      case 'Biology':
        return { primary: '#10b981', light: '#d1fae5', dark: '#064e3b', ring: '#34d399' };
      case 'Computer Science':
        return { primary: '#f59e0b', light: '#fef3c7', dark: '#78350f', ring: '#fbbf24' };
      default:
        return { primary: '#64748b', light: '#f1f5f9', dark: '#1e293b', ring: '#94a3b8' };
    }
  };

  // Status visual badge helper
  const getStatusBadge = (status: PathwayNode['status']) => {
    switch (status) {
      case 'mastered':
        return {
          label: 'Mastered',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          bg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-500',
          icon: Zap,
        };
      case 'ready':
        return {
          label: 'Unlocked & Ready',
          bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          icon: Sparkles,
        };
      case 'weak':
        return {
          label: 'Needs Review',
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: AlertTriangle,
        };
      case 'locked':
      default:
        return {
          label: 'Prerequisites Locked',
          bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-500',
          icon: Lock,
        };
    }
  };

  // Handle manual study progress simulation
  const handleBoostMastery = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const newMastery = Math.min(100, n.masteryPercentage + 20);
          const newStatus: PathwayNode['status'] =
            newMastery >= 80 ? 'mastered' : newMastery >= 50 ? 'in_progress' : 'weak';
          return {
            ...n,
            masteryPercentage: newMastery,
            status: newStatus,
          };
        }
        return n;
      })
    );

    triggerCelebration();
    soundFX.playGentleZenBell(0.6);
    if (onAddXP) {
      onAddXP(50, 'Mastery milestone reached in Learning Pathways!');
    }
  };

  // Handle Marking Complete
  const handleMarkMastered = (nodeId: string) => {
    setNodes((prev) => {
      // 1. Mark node as mastered
      const updated = prev.map((n) => (n.id === nodeId ? { ...n, masteryPercentage: 100, status: 'mastered' as const } : n));

      // 2. Automatically unlock dependent nodes whose prerequisites are now all satisfied
      return updated.map((n) => {
        if (n.status === 'locked' && n.prerequisites.length > 0) {
          const allPrereqsMastered = n.prerequisites.every((prereqId) => {
            const p = updated.find((item) => item.id === prereqId);
            return p && (p.status === 'mastered' || p.masteryPercentage >= 75);
          });
          if (allPrereqsMastered) {
            return { ...n, status: 'ready' as const };
          }
        }
        return n;
      });
    });

    triggerCelebration();
    soundFX.playWarmMarimba(0.7);
    if (onAddXP) {
      onAddXP(100, 'Completed mastery of pathway node!');
    }
  };

  // =========================================================================
  // D3 FORCE SIMULATION RENDER ENGINE
  // =========================================================================
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create Defs for Arrow Markers and Gradients
    const defs = svg.append('defs');

    // Arrow markers
    const createMarker = (id: string, color: string) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 38) // Position marker cleanly outside the node radius
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    };

    createMarker('arrow-default', '#94a3b8');
    createMarker('arrow-active', '#06b6d4');
    createMarker('arrow-mastered', '#10b981');
    createMarker('arrow-interdisciplinary', '#a855f7');
    createMarker('arrow-highlight', '#38bdf8');

    // Filter glow for active/hovered paths
    const filter = defs.append('filter').attr('id', 'pathway-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', (d) => d);

    // Deep copy nodes and links so D3 mutation does not break React states
    const simNodes: D3Node[] = filteredNodes.map((d) => ({ ...d }));
    const simLinks: D3Link[] = filteredLinks.map((d) => ({
      source: typeof d.source === 'string' ? d.source : (d.source as D3Node).id,
      target: typeof d.target === 'string' ? d.target : (d.target as D3Node).id,
      type: d.type,
      description: d.description,
    }));

    // Zoom container
    const gContainer = svg.append('g').attr('class', 'zoom-layer');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Background click to deselect
    svg.on('click', (event) => {
      if (event.target.tagName === 'svg' || event.target.classList.contains('zoom-layer')) {
        setSelectedNodeId(null);
      }
    });

    // Subject Y coordinates for tiered milestone pipeline layout
    const subjectOrder: SubjectType[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    const getSubjectY = (subject: SubjectType) => {
      const idx = subjectOrder.indexOf(subject);
      const padding = 80;
      const usableHeight = height - padding * 2;
      return padding + (idx >= 0 ? idx : 0) * (usableHeight / (subjectOrder.length - 1 || 1));
    };

    const getTierX = (tier: number) => {
      const padding = 120;
      const usableWidth = width - padding * 2;
      return padding + (tier - 1) * (usableWidth / 3);
    };

    // Build Simulation
    const simulation = d3
      .forceSimulation<D3Node>(simNodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(simLinks)
          .id((d) => d.id)
          .distance((link) => (link.type === 'interdisciplinary' ? 140 : 100))
      )
      .force('charge', d3.forceManyBody().strength(layoutMode === 'force' ? -350 : -200))
      .force('collide', d3.forceCollide().radius(48).iterations(2));

    if (layoutMode === 'pipeline') {
      // Milestone pipeline mode: organize strictly into Tier columns with Subject swimlanes
      simulation
        .force(
          'x',
          d3
            .forceX<D3Node>((d) => getTierX(d.tier))
            .strength(0.85)
        )
        .force(
          'y',
          d3
            .forceY<D3Node>((d) => getSubjectY(d.subject))
            .strength(0.45)
        );
    } else {
      // Organic force layout
      simulation
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));
    }

    simulationRef.current = simulation;

    // Draw Tier Backdrops if in pipeline mode
    if (layoutMode === 'pipeline') {
      const tierGuidesGroup = gContainer.append('g').attr('class', 'tier-guides').attr('opacity', 0.6);
      const tierTitles = ['Tier 1: Foundations', 'Tier 2: Core Concepts', 'Tier 3: Advanced Topics', 'Tier 4: Mastery & Capstones'];

      [1, 2, 3, 4].forEach((t) => {
        const xPos = getTierX(t);
        tierGuidesGroup
          .append('line')
          .attr('x1', xPos)
          .attr('y1', 20)
          .attr('x2', xPos)
          .attr('y2', height + 100)
          .attr('stroke', '#334155')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.35);

        tierGuidesGroup
          .append('text')
          .attr('x', xPos)
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '0.05em')
          .text(tierTitles[t - 1]);
      });
    }

    // Draw Links
    const linkGroup = gContainer.append('g').attr('class', 'links');

    const linkLines = linkGroup
      .selectAll<SVGPathElement, D3Link>('path')
      .data(simLinks)
      .enter()
      .append('path')
      .attr('class', 'pathway-link')
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', (d) => (d.type === 'interdisciplinary' ? 2 : 2.5))
      .attr('stroke-dasharray', (d) => (d.type === 'interdisciplinary' ? '5,4' : d.type === 'recommended' ? '4,3' : 'none'))
      .attr('marker-end', (d) => {
        if (d.type === 'interdisciplinary') return 'url(#arrow-interdisciplinary)';
        return 'url(#arrow-default)';
      })
      .attr('stroke', (d) => {
        if (d.type === 'interdisciplinary') return '#c084fc';
        return '#64748b';
      })
      .attr('opacity', 0.5);

    // Draw Nodes
    const nodeGroup = gContainer.append('g').attr('class', 'nodes');

    const nodeElements = nodeGroup
      .selectAll<SVGGElement, D3Node>('g')
      .data(simNodes, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'pathway-node cursor-pointer')
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // Allow nodes to stay pinned where dragged
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        soundFX.playFriendlyChime?.(0.2);
      })
      .on('mouseenter', (_, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    // Node Outer Glow / Halo
    nodeElements
      .append('circle')
      .attr('r', 32)
      .attr('class', 'node-glow')
      .attr('fill', (d) => {
        const colors = getSubjectColor(d.subject);
        return d.status === 'mastered' ? '#10b981' : colors.primary;
      })
      .attr('opacity', 0.08);

    // Node Progress Track Background
    nodeElements
      .append('circle')
      .attr('r', 27)
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    // Node SVG Mastery Meter Ring
    nodeElements
      .append('circle')
      .attr('r', 27)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.status === 'mastered') return '#10b981';
        if (d.status === 'weak') return '#f43f5e';
        if (d.status === 'ready') return '#f59e0b';
        if (d.status === 'in_progress') return '#06b6d4';
        return '#475569';
      })
      .attr('stroke-width', 3.5)
      .attr('stroke-dasharray', 2 * Math.PI * 27)
      .attr('stroke-dashoffset', (d) => 2 * Math.PI * 27 * (1 - d.masteryPercentage / 100))
      .attr('transform', 'rotate(-90)')
      .attr('stroke-linecap', 'round');

    // Inner Solid Circle with Subject / Status Color
    nodeElements
      .append('circle')
      .attr('r', 22)
      .attr('fill', (d) => {
        if (d.status === 'locked') return '#1e293b';
        if (d.status === 'mastered') return '#064e3b';
        if (d.status === 'weak') return '#881337';
        if (d.status === 'ready') return '#78350f';
        const colors = getSubjectColor(d.subject);
        return colors.dark;
      })
      .attr('stroke', (d) => {
        if (d.status === 'mastered') return '#34d399';
        if (d.status === 'ready') return '#fbbf24';
        const colors = getSubjectColor(d.subject);
        return colors.ring;
      })
      .attr('stroke-width', 1.5);

    // Node Center Glyph / Indicator
    nodeElements
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text((d) => {
        if (d.status === 'mastered') return '✓';
        if (d.status === 'locked') return '🔒';
        if (d.status === 'ready') return '⚡';
        if (d.status === 'weak') return '!';
        return `${d.masteryPercentage}%`;
      });

    // Subject Mini Tag Pill above node
    nodeElements
      .append('text')
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.04em')
      .attr('fill', (d) => getSubjectColor(d.subject).ring)
      .text((d) => d.subject.toUpperCase());

    // Title label below node
    nodeElements
      .append('text')
      .attr('y', 42)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#f1f5f9')
      .attr('class', 'node-title-text pointer-events-none select-none')
      .text((d) => {
        return d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title;
      });

    // Simulation Tick Event
    simulation.on('tick', () => {
      // Curved Link Paths for aesthetics
      linkLines.attr('d', (d: any) => {
        const sx = d.source.x;
        const sy = d.source.y;
        const tx = d.target.x;
        const ty = d.target.y;

        if (layoutMode === 'pipeline') {
          // Smooth horizontal bezier curve
          const dx = tx - sx;
          return `M${sx},${sy}C${sx + dx * 0.5},${sy} ${tx - dx * 0.5},${ty} ${tx},${ty}`;
        } else {
          // Slight arc curve
          const dx = tx - sx;
          const dy = ty - sy;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
        }
      });

      nodeElements.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial stabilization reheat
    simulation.alpha(1).restart();

    // Clean up
    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, layoutMode]);

  // =========================================================================
  // UPDATE VISUAL HIGHLIGHTS ON SELECTION / HOVER
  // =========================================================================
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const activeId = hoveredNodeId || selectedNodeId;

    if (!activeId) {
      // Reset all to default opacity
      svg.selectAll<SVGPathElement, D3Link>('.pathway-link').attr('opacity', 0.5).attr('stroke-width', 2).attr('stroke', (d) => (d.type === 'interdisciplinary' ? '#c084fc' : '#64748b')).attr('filter', null);

      svg.selectAll<SVGGElement, D3Node>('.pathway-node').attr('opacity', 1);
      return;
    }

    // Highlight links
    svg
      .selectAll<SVGPathElement, D3Link>('.pathway-link')
      .attr('opacity', (d: any) => {
        const sId = d.source.id || d.source;
        const tId = d.target.id || d.target;

        // Is prerequisite flow (leading to activeId)
        if (tId === activeId || (ancestorPrereqs.has(sId) && ancestorPrereqs.has(tId))) return 1;
        // Is unlock flow (leading out of activeId)
        if (sId === activeId || (descendantDependents.has(sId) && descendantDependents.has(tId))) return 1;

        return 0.1;
      })
      .attr('stroke', (d: any) => {
        const sId = d.source.id || d.source;
        const tId = d.target.id || d.target;

        if (tId === activeId || ancestorPrereqs.has(sId)) return '#38bdf8'; // Glowing cyan prerequisite
        if (sId === activeId || descendantDependents.has(tId)) return '#a855f7'; // Glowing purple unlock
        return '#475569';
      })
      .attr('stroke-width', (d: any) => {
        const sId = d.source.id || d.source;
        const tId = d.target.id || d.target;
        if (sId === activeId || tId === activeId) return 3.5;
        if (ancestorPrereqs.has(sId) || descendantDependents.has(tId)) return 3;
        return 1.5;
      })
      .attr('filter', (d: any) => {
        const sId = d.source.id || d.source;
        const tId = d.target.id || d.target;
        if (sId === activeId || tId === activeId) return 'url(#pathway-glow)';
        return null;
      });

    // Dim non-related nodes
    svg.selectAll<SVGGElement, D3Node>('.pathway-node').attr('opacity', (d) => {
      if (d.id === activeId) return 1;
      if (ancestorPrereqs.has(d.id)) return 1;
      if (descendantDependents.has(d.id)) return 1;
      return 0.25;
    });
  }, [hoveredNodeId, selectedNodeId, ancestorPrereqs, descendantDependents]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.77);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Center on specific node
  const handleCenterOnNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const targetNode = filteredNodes.find((n) => n.id === nodeId);
    if (!targetNode || !svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const scale = 1.2;

    const x = (targetNode as any).x || width / 2;
    const y = (targetNode as any).y || height / 2;

    const transform = d3.zoomIdentity.translate(width / 2 - x * scale, height / 2 - y * scale).scale(scale);

    d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, transform);
  };

  return (
    <div className={`space-y-5 animate-fadeIn pb-12 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0b1120] p-6 overflow-hidden' : ''}`}>
      {/* Top Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
              <span>Interactive Knowledge Graph & Mastery Topology</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Learning Pathways
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                D3 Force Graph
              </span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Explore your complete academic curriculum mapped by prerequisite chains. Hover or click any concept to illuminate
              its foundational requirements, unblocked future milestones, and cross-subject bridges.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mastered</span>
              <span className="text-2xl font-black text-emerald-400">
                {metrics.mastered}
                <span className="text-xs font-bold text-slate-400 font-normal ml-1">/{metrics.total}</span>
              </span>
              <span className="text-[10px] text-emerald-300/80 block mt-0.5 font-semibold">
                {Math.round((metrics.mastered / (metrics.total || 1)) * 100)}% Curriculum
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ready Now</span>
              <span className="text-2xl font-black text-amber-400">{metrics.ready}</span>
              <span className="text-[10px] text-amber-300/80 block mt-0.5 font-semibold">Unblocked</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
              <span className="text-2xl font-black text-cyan-400">{metrics.inProgress}</span>
              <span className="text-[10px] text-cyan-300/80 block mt-0.5 font-semibold">Active Focus</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Mastery</span>
              <span className="text-2xl font-black text-indigo-300">{metrics.avgMastery}%</span>
              <span className="text-[10px] text-indigo-300/80 block mt-0.5 font-semibold">Overall Score</span>
            </div>
          </div>
        </div>

          {/* Recommended Next Step Smart Banner */}
        {metrics.recommended && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Next Recommended Milestone</span>
              </span>
              <span className="text-white font-bold">{metrics.recommended.title}</span>
              <span className="text-slate-400 hidden md:inline">({metrics.recommended.subject})</span>
              <span className="text-slate-400 hidden lg:inline">— {metrics.recommended.description.slice(0, 75)}…</span>
            </div>
            <button
              onClick={() => handleCenterOnNode(metrics.recommended.id)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Inspect Milestone</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Graph Toolbar & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Subject:</span>
          {(['all', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] as const).map((sub) => {
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub === 'all' ? 'All Subjects' : sub}
              </button>
            );
          })}
        </div>

        {/* View Mode & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLayoutMode('pipeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Tiered Milestone Pipeline (Left-to-Right Progression)"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setLayoutMode('force')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'force'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Organic Force-Directed Clustering"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Organic</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Interdisciplinary Cross-Subject Toggle */}
          <button
            onClick={() => setShowInterdisciplinary(!showInterdisciplinary)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
              showInterdisciplinary
                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
            }`}
            title="Toggle cross-disciplinary links between subjects (e.g. Math in Physics & Chem)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cross-Subject Bridges</span>
          </button>

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas & Slide-over Details Drawer */}
      <div
        ref={containerRef}
        className={`relative rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden ${
          isFullscreen ? 'h-[calc(100vh-180px)]' : 'h-[620px]'
        }`}
      >
        {/* Legend Overlay (Top Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 shadow-lg pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>Mastered (≥80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            <span>In Progress (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span>Unlocked & Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
            <span>Needs Review (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Prerequisites Locked</span>
          </div>
        </div>

        {/* Pathway Highlight Explainer Pill (Top Right) */}
        <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-[11px] text-slate-300 shadow-lg">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any node to illuminate its full prerequisite chain</span>
        </div>

        {/* D3 SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        />

        {/* Slide-over Node Inspector Drawer */}
        {activeInspectorNode && (
          <div className="absolute top-4 right-4 bottom-4 w-80 sm:w-96 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md text-white font-mono"
                      style={{ backgroundColor: getSubjectColor(activeInspectorNode.subject).primary }}
                    >
                      {activeInspectorNode.subject}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tier {activeInspectorNode.tier}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300">
                      {activeInspectorNode.examWeight} Weight
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white leading-snug">
                    {activeInspectorNode.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge & Mastery Progress */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Mastery Level</span>
                  {(() => {
                    const badge = getStatusBadge(activeInspectorNode.status);
                    const Icon = badge.icon;
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">{activeInspectorNode.masteryPercentage}%</span>
                    <span className="text-slate-400">Target: 85%+</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${activeInspectorNode.masteryPercentage}%`,
                        backgroundColor:
                          activeInspectorNode.masteryPercentage >= 80
                            ? '#10b981'
                            : activeInspectorNode.masteryPercentage >= 50
                            ? '#06b6d4'
                            : '#f43f5e',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Concept Overview */}
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Concept Overview</h4>
                  <p className="text-slate-300 leading-relaxed">{activeInspectorNode.description}</p>
                </div>

                {/* Key Skills Checklist */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Core Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeInspectorNode.keyConcepts.map((concept, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700/60 text-[11px] font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Prerequisite Chain Status */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Direct Prerequisites ({activeInspectorNode.prerequisites.length})</span>
                  </h4>
                  {activeInspectorNode.prerequisites.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Foundational concept — No prior prerequisites required!</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeInspectorNode.prerequisites.map((prereqId) => {
                        const pNode = nodes.find((n) => n.id === prereqId);
                        if (!pNode) return null;
                        const isSatisfied = pNode.status === 'mastered' || pNode.masteryPercentage >= 75;
                        return (
                          <div
                            key={prereqId}
                            onClick={() => handleCenterOnNode(prereqId)}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2">
                              {isSatisfied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span className="text-slate-200 font-medium">{pNode.title}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {pNode.masteryPercentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* What This Unlocks Downstream */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Unlock className="w-3 h-3 text-cyan-400" />
                    <span>Unlocks Downstream Milestones</span>
                  </h4>
                  {(() => {
                    const dependents = nodes.filter((n) => n.prerequisites.includes(activeInspectorNode.id));
                    if (dependents.length === 0) {
                      return (
                        <p className="text-slate-400 italic text-[11px]">
                          Capstone mastery node in current syllabus track.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        {dependents.map((dep) => (
                          <div
                            key={dep.id}
                            onClick={() => handleCenterOnNode(dep.id)}
                            className="p-1.5 px-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition text-[11px]"
                          >
                            <span>{dep.title}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {onOpenCoachWithTopic && (
                  <button
                    onClick={() => {
                      onOpenCoachWithTopic(activeInspectorNode.subject, activeInspectorNode.title);
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-500/30"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Coach</span>
                  </button>
                )}

                {onOpenQuizWithTopic && (
                  <button
                    onClick={() => {
                      onOpenQuizWithTopic(activeInspectorNode.subject, activeInspectorNode.title);
                    }}
                    className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-cyan-500/30"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Practice Quiz</span>
                  </button>
                )}
              </div>

              {/* Boost / Complete Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBoostMastery(activeInspectorNode.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Log Revision (+20%)</span>
                </button>

                {activeInspectorNode.status !== 'mastered' && (
                  <button
                    onClick={() => handleMarkMastered(activeInspectorNode.id)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1"
                    title="Mark completely mastered and unlock prerequisites"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Master (+100 XP)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
