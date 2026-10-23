function artworkLayout(natural, viewport, zoom = 1) {
  const nw = Math.max(1, natural.width),
    nh = Math.max(1, natural.height);
  const vw = Math.max(1, viewport.width),
    vh = Math.max(1, viewport.height);
  const fit = Math.min(Math.max(1, vw - 32) / nw, Math.max(1, vh - 32) / nh);
  const maxZoom = Math.max(5, 1 / fit);
  const scale = Math.max(1, Math.min(maxZoom, zoom));
  const width = nw * fit * scale,
    height = nh * fit * scale;
  return {
    fit,
    maxZoom,
    width,
    height,
    canvasWidth: Math.max(vw, width + 32),
    canvasHeight: Math.max(vh, height + 32),
  };
}
module.exports = { artworkLayout };
