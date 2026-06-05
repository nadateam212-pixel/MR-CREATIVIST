"use client";

import { Download } from "lucide-react";
import type { SyntheticEvent } from "react";

function blockPointer(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function ProtectedVideoOverlays() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-[18%] min-h-14 cursor-default bg-transparent"
        onClick={blockPointer}
        onDoubleClick={blockPointer}
        onContextMenu={blockPointer}
        onMouseDown={blockPointer}
        onPointerDown={blockPointer}
      >
        <span className="absolute right-3 top-3 grid size-11 place-items-center rounded-md bg-white/95 text-[hsl(var(--primary))] shadow-lg ring-1 ring-black/10">
          <Download className="size-5" />
        </span>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-20 h-[18%] min-h-16 cursor-default bg-transparent"
        onClick={blockPointer}
        onDoubleClick={blockPointer}
        onContextMenu={blockPointer}
        onMouseDown={blockPointer}
        onPointerDown={blockPointer}
      />
    </>
  );
}
