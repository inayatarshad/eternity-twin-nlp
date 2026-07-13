declare module "d3-force-3d" {
  export interface SimNode {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    [key: string]: unknown;
  }

  export interface SimLink {
    source: string | number | SimNode;
    target: string | number | SimNode;
    [key: string]: unknown;
  }

  export interface Force {
    (alpha: number): void;
    initialize?(nodes: SimNode[], random: () => number, nDim: number): void;
  }

  export interface LinkForce extends Force {
    id(fn: (node: SimNode) => string): this;
    distance(fn: number | ((link: SimLink) => number)): this;
    strength(fn: number | ((link: SimLink) => number)): this;
  }

  export interface ManyBodyForce extends Force {
    strength(value: number): this;
  }

  export interface PositionForce extends Force {
    strength(value: number | ((node: SimNode) => number)): this;
    x?(value: number | ((node: SimNode) => number)): this;
    y?(value: number | ((node: SimNode) => number)): this;
    z?(value: number | ((node: SimNode) => number)): this;
  }

  export interface Simulation {
    nodes(): SimNode[];
    nodes(nodes: SimNode[]): this;
    force(name: string, force: Force | null): this;
    alpha(value: number): this;
    alphaDecay(value: number): this;
    stop(): this;
    tick(iterations?: number): this;
  }

  export function forceSimulation(
    nodes?: SimNode[],
    numDimensions?: number,
  ): Simulation;
  export function forceLink(links?: SimLink[]): LinkForce;
  export function forceManyBody(): ManyBodyForce;
  export function forceCenter(x?: number, y?: number, z?: number): Force;
  export function forceX(x?: number | ((node: SimNode) => number)): PositionForce;
  export function forceY(y?: number | ((node: SimNode) => number)): PositionForce;
  export function forceZ(z?: number | ((node: SimNode) => number)): PositionForce;
  export function forceCollide(radius?: number): Force;
}
