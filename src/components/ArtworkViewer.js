import React, { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, MoveHorizontal } from "lucide-react";
import artwork from "../domain/artwork.cjs";

export default function ArtworkViewer({ look, onClose }) {
  const root = useRef(),
    stage = useRef(),
    close = useRef(),
    drag = useRef();
  const closeAction = useRef(onClose);
  closeAction.current = onClose;
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ width: 320, height: 500 });
  const [natural, setNatural] = useState({ width: 1024, height: 1536 });
  const { fit, width, height, canvasWidth, canvasHeight, maxZoom } =
    artwork.artworkLayout(natural, viewport, zoom);
  const zoomLimit = useRef(maxZoom);
  zoomLimit.current = maxZoom;
  const changeZoom = (value) => setZoom(Math.min(maxZoom, Math.max(1, value)));
  useEffect(() => setZoom((z) => Math.min(z, maxZoom)), [maxZoom]);
  useEffect(() => {
    const before = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...root.current.parentElement.children]
      .filter((el) => el !== root.current)
      .map((el) => [el, el.inert, el.getAttribute("aria-hidden")]);
    close.current.focus();
    for (const [el] of background) {
      el.inert = true;
      el.setAttribute("aria-hidden", "true");
    }
    const observer = new ResizeObserver(([entry]) =>
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(stage.current);
    const keyboard = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAction.current();
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((z) => Math.min(zoomLimit.current, z + 0.5));
      }
      if (event.key === "-") {
        event.preventDefault();
        setZoom((z) => Math.max(1, z - 0.5));
      }
      if (event.key === "0") {
        event.preventDefault();
        setZoom(1);
      }
      if (event.key === "Tab") {
        const controls = [
          ...root.current.querySelectorAll(
            'button,a[href],summary,[tabindex="0"]',
          ),
        ].filter((e) => !e.disabled);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", keyboard);
      document.body.style.overflow = overflow;
      for (const [el, inert, hidden] of background) {
        el.inert = inert;
        if (hidden === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", hidden);
      }
      requestAnimationFrame(() => {
        const expand = document.querySelector("[data-expand-artwork]");
        if (expand) expand.focus();
        else if (
          before?.isConnected &&
          before !== document.body &&
          before !== document.documentElement
        )
          before.focus();
      });
    };
  }, []);
  // Keep the center of the picture in view when using the zoom controls.
  const prior = useRef({ width: 0, height: 0 });
  useEffect(() => {
    const el = stage.current,
      old = prior.current;
    if (old.width) {
      const x =
        (el.scrollLeft + viewport.width / 2) /
        Math.max(viewport.width, old.width + 32);
      const y =
        (el.scrollTop + viewport.height / 2) /
        Math.max(viewport.height, old.height + 32);
      el.scrollLeft =
        x * Math.max(viewport.width, width + 32) - viewport.width / 2;
      el.scrollTop =
        y * Math.max(viewport.height, height + 32) - viewport.height / 2;
    }
    prior.current = { width, height };
  }, [width, height, viewport]);
  return (
    <section
      className="artwork-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Full-screen artwork: ${look.name}`}
      ref={root}
    >
      <header className="viewer-header">
        <div>
          <strong>{look.matrixLabel || look.character}</strong>
          <span>
            {look.variant} · Option {look.option || 1} ·{" "}
            {look.optionLabel || "Original"}
          </span>
        </div>
        <button
          ref={close}
          onClick={onClose}
          aria-label="Close full-screen image"
        >
          <X aria-hidden="true" size={22} />
        </button>
      </header>
      <nav className="viewer-tools" aria-label="Image zoom controls">
        <button onClick={() => changeZoom(1)} aria-label="Fit entire image">
          <Maximize2 aria-hidden="true" size={18} /> Fit
        </button>
        <button
          onClick={() =>
            changeZoom(
              Math.max(2, (viewport.width - 32) / (natural.width * fit)),
            )
          }
          aria-label="Read labels"
        >
          <MoveHorizontal aria-hidden="true" size={18} /> Read labels
        </button>
        <button
          onClick={() => changeZoom(zoom - 0.5)}
          disabled={zoom <= 1}
          aria-label="Zoom out"
        >
          <ZoomOut aria-hidden="true" size={20} />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          onClick={() => changeZoom(zoom + 0.5)}
          disabled={zoom >= maxZoom}
          aria-label="Zoom in"
        >
          <ZoomIn aria-hidden="true" size={20} />
        </button>
      </nav>
      <div
        className="viewer-stage"
        ref={stage}
        tabIndex={0}
        aria-label="Scrollable artwork. Double tap to zoom; scroll to read labels."
        onDoubleClick={() => changeZoom(zoom > 1 ? 1 : 2.5)}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: stage.current.scrollLeft,
            top: stage.current.scrollTop,
          };
          stage.current.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          stage.current.scrollLeft =
            drag.current.left + drag.current.x - e.clientX;
          stage.current.scrollTop =
            drag.current.top + drag.current.y - e.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="viewer-canvas"
          style={{ width: canvasWidth, height: canvasHeight }}
        >
          <img
            src={look.imageFull || look.image}
            alt={`${look.character}, ${look.variant}, option ${look.option || 1}. ${look.annotations?.join(". ") || look.name}`}
            draggable={false}
            style={{ width, height }}
            onLoad={(e) =>
              setNatural({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              })
            }
          />
        </div>
      </div>
      <footer className="viewer-footer">
        <p>
          Double tap to zoom · Scroll or drag to explore · Fit to see the whole
          outfit
        </p>
        {look.annotations?.length > 0 && (
          <details>
            <summary>Read styling notes</summary>
            <ul>
              {look.annotations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </details>
        )}
      </footer>
    </section>
  );
}
