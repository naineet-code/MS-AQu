import { SmoothCursor } from "@/components/ui/smooth-cursor";

function SmoothCursorDemo() {
  return (
    <>
      <span className="hidden md:block">Move your mouse around</span>
      <span className="block md:hidden">Tap anywhere to see the cursor</span>
      <SmoothCursor />
    </>
  );
}

export default SmoothCursorDemo; 