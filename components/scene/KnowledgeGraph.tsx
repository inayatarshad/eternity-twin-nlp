"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { getLobeById } from "@/lib/lobes";
import { interiorPose } from "@/lib/scene/cameraPaths";
import { useSceneStore } from "@/lib/state/scene";
import {
  NODE_TYPE_COLORS,
  NODE_TYPE_GLYPHS,
  type PositionedLobeGraph,
} from "@/lib/types/cognitive";

import type { Theme } from "@/lib/state/animation";

interface KnowledgeGraphProps {
  graph: PositionedLobeGraph;
  reducedMotion: boolean;
  theme: Theme;
  onSelectNode: (nodeId: string) => void;
}

const BASE_RADIUS = 0.035;
const HOVER_SCALE = 1.5;
const SELECT_SCALE = 1.8;

/**
 * Instanced node universe (docs/ui/06): one InstancedMesh for nodes
 * (color = type, scale = relevance), one LineSegments for edges (endpoint
 * color gradient, brightness = strength). Picking via instanceId. Layout is
 * static (P6); only attention scales animate.
 */
export function KnowledgeGraph({
  graph,
  reducedMotion,
  theme,
  onSelectNode,
}: KnowledgeGraphProps) {
  const gl = useThree((s) => s.gl);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredNodeId = useSceneStore((s) => s.hoveredNodeId);
  const selectedNodeId = useSceneStore((s) => s.selectedNodeId);
  const setHoveredNodeId = useSceneStore((s) => s.setHoveredNodeId);

  const lobe = getLobeById(graph.lobeId)!;
  const center = interiorPose(lobe).target;

  const count = graph.nodes.length;

  // static per-node attributes
  const { baseScales, colors } = useMemo(() => {
    const baseScales = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    graph.nodes.forEach((node, i) => {
      baseScales[i] = BASE_RADIUS * (0.6 + node.relevance * 1.2);
      c.set(NODE_TYPE_COLORS[node.type]);
      colors.set([c.r, c.g, c.b], i * 3);
    });
    return { baseScales, colors };
  }, [graph, count]);

  // edge buffer: positions + endpoint-gradient colors
  const edgeGeometry = useMemo(() => {
    const index = new Map(graph.nodes.map((n, i) => [n.id, i]));
    const valid = graph.edges.filter(
      (e) => index.has(e.sourceId) && index.has(e.targetId),
    );
    const positions = new Float32Array(valid.length * 6);
    const edgeColors = new Float32Array(valid.length * 6);
    const c = new THREE.Color();
    valid.forEach((e, i) => {
      const si = index.get(e.sourceId)! * 3;
      const ti = index.get(e.targetId)! * 3;
      positions.set(
        [
          graph.positions[si]!, graph.positions[si + 1]!, graph.positions[si + 2]!,
          graph.positions[ti]!, graph.positions[ti + 1]!, graph.positions[ti + 2]!,
        ],
        i * 6,
      );
      const brightness = 0.25 + e.strength * 0.5;
      for (const [offset, ni] of [[0, si], [3, ti]] as const) {
        c.setRGB(colors[ni]!, colors[ni + 1]!, colors[ni + 2]!)
          .multiplyScalar(brightness);
        edgeColors.set([c.r, c.g, c.b], i * 6 + offset);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3));
    return geo;
  }, [graph, colors]);

  // write instance matrices + colors whenever attention changes
  const writeInstances = () => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    graph.nodes.forEach((node, i) => {
      const boost =
        node.id === selectedNodeId
          ? SELECT_SCALE
          : node.id === hoveredNodeId
            ? HOVER_SCALE
            : 1;
      const s = baseScales[i]! * boost;
      m.makeScale(s, s, s);
      m.setPosition(
        graph.positions[i * 3]!,
        graph.positions[i * 3 + 1]!,
        graph.positions[i * 3 + 2]!,
      );
      mesh.setMatrixAt(i, m);
      c.setRGB(colors[i * 3]!, colors[i * 3 + 1]!, colors[i * 3 + 2]!);
      if (node.id === selectedNodeId) c.lerp(new THREE.Color("#ffffff"), 0.55);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useEffect(writeInstances, [graph, hoveredNodeId, selectedNodeId, baseScales, colors]);

  // gentle constellation drift (whole-group, not per-node — cheap)
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.06;
  });

  const hoveredNode = hoveredNodeId
    ? graph.nodes.find((n) => n.id === hoveredNodeId)
    : null;
  const hoveredIndex = hoveredNode
    ? graph.nodes.findIndex((n) => n.id === hoveredNode.id)
    : -1;

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined) return;
    const node = graph.nodes[id];
    if (node && node.id !== hoveredNodeId) {
      setHoveredNodeId(node.id);
      gl.domElement.style.cursor = "pointer";
    }
  };
  const onOut = () => {
    setHoveredNodeId(null);
    gl.domElement.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined) return;
    const node = graph.nodes[id];
    if (node) onSelectNode(node.id);
  };

  return (
    <group ref={groupRef} position={center} name={`graph-${graph.lobeId}`}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* additive edges vanish on a light background — blend normally there */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={theme === "light" ? 0.75 : 0.5}
          blending={
            theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending
          }
          depthWrite={false}
        />
      </lineSegments>

      {/* cluster landmarks */}
      {graph.clusters.map((cluster) => {
        const idx = graph.nodes
          .map((n, i) => (n.clusterId === cluster.id ? i : -1))
          .filter((i) => i >= 0);
        if (idx.length === 0) return null;
        const cx = [0, 1, 2].map(
          (a) =>
            idx.reduce((sum, i) => sum + graph.positions[i * 3 + a]!, 0) /
            idx.length,
        ) as [number, number, number];
        return (
          <Html
            key={cluster.id}
            position={[cx[0], cx[1] + 0.22, cx[2]]}
            center
            zIndexRange={[10, 10]}
            style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
          >
            <span className="text-[9px] tracking-[0.18em] text-text-muted uppercase select-none">
              {cluster.label}
            </span>
          </Html>
        );
      })}

      {/* hovered node label */}
      {hoveredNode && hoveredIndex >= 0 ? (
        <Html
          position={[
            graph.positions[hoveredIndex * 3]!,
            graph.positions[hoveredIndex * 3 + 1]! + 0.09,
            graph.positions[hoveredIndex * 3 + 2]!,
          ]}
          center
          zIndexRange={[10, 10]}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <span
            className="rounded-sm px-1.5 py-0.5 text-[10px]"
            style={{
              color: NODE_TYPE_COLORS[hoveredNode.type],
              background:
                theme === "light"
                  ? "rgba(16, 22, 43, 0.82)"
                  : "rgba(5, 6, 14, 0.85)",
            }}
          >
            {NODE_TYPE_GLYPHS[hoveredNode.type]} {hoveredNode.label}
          </span>
        </Html>
      ) : null}
    </group>
  );
}
