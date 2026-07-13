/**
 * /brain route content — the scene itself lives in the persistent layout;
 * this page contributes only the brain-level hint line (docs/ui/01).
 */
export default function BrainViewPage() {
  return (
    <p className="pointer-events-none absolute inset-x-0 bottom-5 z-(--z-chrome) text-center text-xs tracking-[0.14em] text-text-muted uppercase">
      Drag to orbit · scroll to approach · select a region to enter
    </p>
  );
}
