/**
 * Pornchai RFQ — Box Template SVG Dieline Drawings
 * Parametric SVG for all 12 box templates
 * Based on original JPG reference images from legacy system
 */

window.BoxSVG = (function() {

// Common SVG builder helpers
const COLORS = {
  stroke: '#333', fold: '#999', dim: '#5b2d8e', bg: '#fff',
  panel: '#fafafa', flap: '#f0f0f0', glue: '#e8e8e8',
};

function svgWrap(w, h, content, title, info) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%;height:auto;background:${COLORS.bg};border-radius:10px;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <style>
      .cut{fill:none;stroke:${COLORS.stroke};stroke-width:1.5;stroke-linejoin:round}
      .fold{fill:none;stroke:${COLORS.fold};stroke-width:0.8;stroke-dasharray:6,3}
      .dim{fill:none;stroke:${COLORS.dim};stroke-width:0.6}
      .lbl{font-family:sans-serif;font-size:9px;fill:#555;text-anchor:middle;dominant-baseline:middle}
      .lbl-sm{font-family:sans-serif;font-size:8px;fill:#888;text-anchor:middle;dominant-baseline:middle}
      .lbl-dim{font-family:sans-serif;font-size:8px;fill:${COLORS.dim};font-weight:600;text-anchor:middle}
      .lbl-bg{font-family:sans-serif;font-size:9px;fill:#555;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
      .grain{font-family:sans-serif;font-size:12px;fill:#333;font-weight:700;text-anchor:middle}
      .title{font-family:sans-serif;font-size:10px;fill:#666;text-anchor:start}
    </style>
    <defs>
      <marker id="aR" viewBox="0 0 8 6" refX="8" refY="3" markerWidth="6" markerHeight="5" orient="auto"><path d="M0,0L8,3L0,6" fill="${COLORS.dim}"/></marker>
      <marker id="aL" viewBox="0 0 8 6" refX="0" refY="3" markerWidth="6" markerHeight="5" orient="auto"><path d="M8,0L0,3L8,6" fill="${COLORS.dim}"/></marker>
      <marker id="aD" viewBox="0 0 6 8" refX="3" refY="8" markerWidth="5" markerHeight="6" orient="auto"><path d="M0,0L3,8L6,0" fill="${COLORS.dim}"/></marker>
      <marker id="aU" viewBox="0 0 6 8" refX="3" refY="0" markerWidth="5" markerHeight="6" orient="auto"><path d="M0,8L3,0L6,8" fill="${COLORS.dim}"/></marker>
      <marker id="gR" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto"><path d="M0,0L10,3L0,6" fill="#333"/></marker>
      <marker id="gL" viewBox="0 0 10 6" refX="0" refY="3" markerWidth="8" markerHeight="5" orient="auto"><path d="M10,0L0,3L10,6" fill="#333"/></marker>
    </defs>
    ${title ? `<text x="8" y="14" class="title">${title}</text>` : ''}
    ${content}
    ${info ? `<text x="${w/2}" y="${h-4}" class="lbl-sm">${info}</text>` : ''}
  </svg>`;
}

// Dimension line (horizontal)
function dimH(x1, x2, y, label) {
  const mx = (x1+x2)/2;
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="dim" marker-start="url(#aL)" marker-end="url(#aR)"/>
    <text x="${mx}" y="${y-5}" class="lbl-dim" style="paint-order:stroke;stroke:#fff;stroke-width:2.5px;stroke-linejoin:round">${label}</text>`;
}
// Dimension line (vertical)
function dimV(x, y1, y2, label) {
  const my = (y1+y2)/2;
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="dim" marker-start="url(#aU)" marker-end="url(#aD)"/>
    <text x="${x+3}" y="${my}" class="lbl-dim" text-anchor="start" dominant-baseline="middle" style="paint-order:stroke;stroke:#fff;stroke-width:2.5px;stroke-linejoin:round">${label}</text>`;
}
// GRAIN arrow
function grainArrow(x1, x2, y) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#333" stroke-width="1.2" marker-start="url(#gL)" marker-end="url(#gR)"/>
    <text x="${(x1+x2)/2}" y="${y-5}" class="grain">GRAIN</text>`;
}
// Rectangle with optional fill
function rect(x, y, w, h, fill) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill||COLORS.panel}" class="cut"/>`;
}
// Fold line
function foldH(x1, x2, y) { return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="fold"/>`; }
function foldV(x, y1, y2) { return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="fold"/>`; }
// Label
function label(x, y, text, rot) {
  const r = rot ? ` transform="rotate(${rot},${x},${y})"` : '';
  // Use paint-order stroke for white background behind text (no overlap with lines)
  return `<text x="${x}" y="${y}" class="lbl-bg"${r}>${text}</text>`;
}

// ============================================================
// TYPE 1 & 2: Reverse / Straight Tuck End
// ============================================================
function drawTuckEnd(type, w, l, d, gf, tf) {
  // Image orientation: Horizontal=L, Vertical=W
  // H cols: gf | l | w | l | w
  // V rows: tf(tuck) | w(body+flaps) | d(center) | w(body+flaps) | tf(tuck)
  const totalH = gf + 2*l + 2*w;
  const totalV = 2*tf + 2*w + d;

  // Scale to fit drawing area with margins
  const mx = 55, my = 60;
  const areaW = 520, areaH = 440;
  const sc = Math.min(areaW / totalH, areaH / totalV) * 0.90;
  const ox = mx + (areaW - totalH*sc)/2;
  const oy = my + (areaH - totalV*sc)/2;
  const S = v => v * sc;

  // Column x positions
  const x0 = ox;
  const x1 = ox + S(gf);
  const x2 = x1 + S(l);
  const x3 = x2 + S(w);
  const x4 = x3 + S(l);
  const x5 = x4 + S(w);

  // Row y positions
  const y0 = oy;
  const y1 = oy + S(tf);
  const y2 = y1 + S(w);
  const y3 = y2 + S(d);
  const y4 = y3 + S(w);
  const y5 = y4 + S(tf);

  let svg = '';

  // GRAIN arrow (above dimension lines, no overlap)
  svg += grainArrow(x1, x5, oy - 38);

  // Dimension ticks at top (between GRAIN and dieline)
  const dy = oy - 18;
  svg += dimH(x0, x1, dy, 'G');
  svg += dimH(x1, x2, dy, 'ยาว');
  svg += dimH(x2, x3, dy, 'กว้าง');
  svg += dimH(x3, x4, dy, 'ยาว');
  svg += dimH(x4, x5, dy, 'กว้าง');

  // ติดกาว label at top-left (clear of dim line)
  svg += `<text x="${x0+S(gf/2)}" y="${dy-12}" class="lbl-sm">ติดกาว</text>`;
  svg += `<line x1="${x0+S(gf/2)}" y1="${dy-8}" x2="${x0+S(gf/2)}" y2="${dy-2}" stroke="#888" stroke-width="0.5"/>`;

  // Main body outline (center section: y1 to y4, x0 to x5)
  svg += rect(x1, y1, S(2*l+2*w), S(2*w+d), COLORS.panel);

  // Glue flap (tapered on left)
  const gfInset = S(gf * 0.3);
  svg += `<path d="M${x1},${y1} L${x0+gfInset},${y1+S(w*0.15)} L${x0},${y1+S(w*0.4)} L${x0},${y4-S(w*0.4)} L${x0+gfInset},${y4-S(w*0.15)} L${x1},${y4}" class="cut" fill="${COLORS.glue}"/>`;
  svg += label(x0 + S(gf*0.4), (y1+y4)/2, 'ติดกาว', -90);

  // Fold lines between panels (vertical)
  svg += foldV(x2, y0, y5);
  svg += foldV(x3, y0, y5);
  svg += foldV(x4, y0, y5);

  // Fold lines between body and flap zones (horizontal)
  svg += foldH(x1, x5, y1);
  svg += foldH(x0, x5, y2);
  svg += foldH(x0, x5, y3);
  svg += foldH(x1, x5, y4);

  // Top tuck flap (ฝาเสียบ) - on first กว้าง panel (x1 to x1+l area for type1, x2-x3 for panel B)
  // Type 1: top tuck on panel A (กว้าง=ยาว area, x1..x2 region)
  // Actually in the image: top tuck flap spans the first ยาว panel with curved top
  const tuckPanel = type === 1 ? [x1, x2] : [x1, x2]; // both on same panel for display
  const tuckW = tuckPanel[1] - tuckPanel[0];
  const tuckInset = tuckW * 0.15;
  svg += `<path d="M${tuckPanel[0]},${y1} L${tuckPanel[0]},${y0+S(tf*0.3)} Q${tuckPanel[0]+tuckW/2},${y0-S(tf*0.1)} ${tuckPanel[1]},${y0+S(tf*0.3)} L${tuckPanel[1]},${y1}" class="cut" fill="${COLORS.flap}"/>`;
  svg += label((tuckPanel[0]+tuckPanel[1])/2, (y0+y1)/2 + 4, 'ฝาเสียบ');

  // Dust flaps (ปีกกล่อง) top - on กว้าง panels
  const dfH = S(w * 0.45); // dust flap height
  svg += rect(x2, y1, S(w), dfH, COLORS.flap);
  svg += label(x2 + S(w)/2, y1 + dfH/2, 'ปีก\nกล่อง');
  svg += rect(x4, y1, S(w), dfH, COLORS.flap);
  svg += label(x4 + S(w)/2, y1 + dfH/2, 'ปีก\nกล่อง');

  // Bottom tuck flap (ฝาเสียบ) - for type 1 reverse: on opposite side panel
  const btuckPanel = type === 1 ? [x2, x3+S(l)] : [x1, x2];
  const btuckMid = (x2 + x3) / 2;
  svg += `<path d="M${x2},${y4} L${x2},${y5-S(tf*0.3)} Q${btuckMid},${y5+S(tf*0.1)} ${x3},${y5-S(tf*0.3)} L${x3},${y4}" class="cut" fill="${COLORS.flap}"/>`;
  svg += label(btuckMid, (y4+y5)/2, 'ฝาเสียบ');

  // Dust flaps bottom
  svg += rect(x2, y4-dfH, S(w), dfH, COLORS.flap);
  svg += label(x2 + S(w)/2, y4 - dfH/2, 'ปีก\nกล่อง');
  svg += rect(x4, y4-dfH, S(w), dfH, COLORS.flap);
  svg += label(x4 + S(w)/2, y4 - dfH/2, 'ปีก\nกล่อง');

  // Right side dimension: ฝาเสียบ height
  svg += dimV(x5 + 12, y1, y4, 'ฝาเสียบ');

  const title = type === 1 ? 'Type 1: Reverse Tuck End — กล่องฝาคู่ แบบฝาสลับ' : 'Type 2: Straight Tuck End — กล่องฝาคู่ แบบฝาตรง';
  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : 'กรอกขนาด W×L×D เพื่อดูขนาดจริง';
  return svgWrap(620, 540, svg, title, info);
}

// ============================================================
// TYPE 3 & 4: TTSLB / TTAB (Auto-lock bottom)
// ============================================================
function drawAutoLock(type, w, l, d, gf, tf, ol) {
  const hw = w/2;
  const _ol = ol || 10;
  const totalH = gf + 2*l + 2*w; // same L as type 1/2
  const totalV = tf + w + d + hw + _ol; // W formula: tf+w+d+w/2+ol

  const mx = 55, my = 60;
  const areaW = 520, areaH = 440;
  const sc = Math.min(areaW / totalH, areaH / totalV) * 0.88;
  const ox = mx + (areaW - totalH*sc)/2;
  const oy = my + (areaH - totalV*sc)/2;
  const S = v => v * sc;

  const x0 = ox, x1 = ox+S(gf), x2 = x1+S(l), x3 = x2+S(w), x4 = x3+S(l), x5 = x4+S(w);
  const y0 = oy, y1 = oy+S(tf), y2 = y1+S(w), y3 = y2+S(d), y4 = y3+S(hw), y5 = y4+S(_ol);

  let svg = '';
  svg += grainArrow(x1, x5, oy - 38);

  const dy = oy - 18;
  svg += dimH(x0, x1, dy, 'G'); svg += dimH(x1, x2, dy, 'ยาว'); svg += dimH(x2, x3, dy, 'กว้าง');
  svg += dimH(x3, x4, dy, 'ยาว'); svg += dimH(x4, x5, dy, 'กว้าง');
  svg += `<text x="${x0+S(gf/2)}" y="${dy-12}" class="lbl-sm">ติดกาว</text>`;

  // Main body
  svg += rect(x1, y1, S(2*l+2*w), S(w+d+hw), COLORS.panel);

  // Glue flap
  const gfInset = S(gf * 0.3);
  svg += `<path d="M${x1},${y1} L${x0+gfInset},${y1+S(w*0.15)} L${x0},${y1+S(w*0.4)} L${x0},${y4-S(hw*0.3)} L${x0+gfInset},${y4} L${x1},${y4}" class="cut" fill="${COLORS.glue}"/>`;
  svg += label(x0+S(gf*0.4), (y1+y4)/2, 'ติดกาว', -90);

  // Fold lines
  svg += foldV(x2, y0, y5); svg += foldV(x3, y0, y5); svg += foldV(x4, y0, y5);
  svg += foldH(x1, x5, y1); svg += foldH(x0, x5, y2); svg += foldH(x0, x5, y3); svg += foldH(x1, x5, y4);

  // Top tuck flap (ฝาเสียบ)
  const tw = x2-x1;
  svg += `<path d="M${x1},${y1} L${x1},${y0+S(tf*0.3)} Q${x1+tw/2},${y0-S(tf*0.1)} ${x2},${y0+S(tf*0.3)} L${x2},${y1}" class="cut" fill="${COLORS.flap}"/>`;
  svg += label((x1+x2)/2, (y0+y1)/2+3, 'ฝาเสียบ');

  // Dust flaps top
  const dfH = S(w*0.4);
  svg += rect(x2, y1, S(w), dfH, COLORS.flap);
  svg += label(x2+S(w)/2, y1+dfH/2, 'ปีก\nกล่อง');
  svg += rect(x4, y1, S(w), dfH, COLORS.flap);
  svg += label(x4+S(w)/2, y1+dfH/2, 'ปีก\nกล่อง');

  // Bottom auto-lock tabs (instead of tuck flap)
  const tabW = S(w*0.3);
  svg += `<rect x="${x2+S(w*0.2)}" y="${y4}" width="${tabW}" height="${S(_ol*0.8)}" class="cut" fill="${COLORS.flap}"/>`;
  svg += `<rect x="${x3+S(l*0.3)}" y="${y4}" width="${tabW}" height="${S(_ol*0.8)}" class="cut" fill="${COLORS.flap}"/>`;
  svg += `<rect x="${x4+S(w*0.2)}" y="${y4}" width="${tabW}" height="${S(_ol*0.8)}" class="cut" fill="${COLORS.flap}"/>`;

  // OL label
  svg += dimV(x2+tabW+5, y4, y5, 'OL');

  svg += dimV(x5+12, y1, y4, 'ฝาเสียบ');

  const name = type===3 ? 'Type 3: TTSLB — ออโต้ล็อค หูขัด' : 'Type 4: TTAB — ออโต้ล็อค ทากาว';
  const totalW_actual = tf+w+d+hw+_ol;
  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${(gf+2*l+2*w).toFixed(1)}×${totalW_actual.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, name, info);
}

// ============================================================
// TYPE 5: Double Glue Side Wall (ฝาครอบ / Tray Lid)
// ============================================================
function drawTray(w, l, d, df) {
  const _df = df || 25;
  const totalH = l + 4*d + 2*_df; // note: in image, horizontal = ยาว+4d+2dust
  const totalV = w + 4*d;

  const mx = 55, my = 60;
  const areaW = 520, areaH = 440;
  const sc = Math.min(areaW/totalH, areaH/totalV) * 0.85;
  const ox = mx + (areaW - totalH*sc)/2;
  const oy = my + (areaH - totalV*sc)/2;
  const S = v => v * sc;

  let svg = '';

  // Horizontal: df | d | d | l | d | d | df  → but image shows: ยาว | ความสูง top
  // Image layout: horizontal = ยาว + ความสูง, vertical = กว้าง
  // Actually for Type 5: W_open = w+4d, L_open = l+4d+2dust
  // Image: horizontal=L, vertical=W

  const x0 = ox, x1 = ox+S(_df), x2 = x1+S(d), x3 = x2+S(d);
  const x4 = x3+S(l), x5 = x4+S(d), x6 = x5+S(d), x7 = x6+S(_df);
  const y0 = oy, y1 = oy+S(d), y2 = y1+S(d), y3 = y2+S(w), y4 = y3+S(d), y5 = y4+S(d);

  // Main outline
  svg += rect(x1, y1, S(4*d+l), S(2*d+w), COLORS.panel);

  // Dust flap strips top and bottom
  if (_df > 0) {
    svg += rect(x0, y1, S(_df), S(2*d+w), COLORS.flap);
    svg += rect(x6, y1, S(_df), S(2*d+w), COLORS.flap);
    svg += label(x0+S(_df/2), (y1+y4)/2, 'ปีกกล่อง', -90);
    svg += label(x6+S(_df/2), (y1+y4)/2, 'ปีกกล่อง', -90);
  }

  // Side wall flaps top and bottom
  svg += rect(x2, y0, S(2*d+l), S(d), COLORS.flap);
  svg += rect(x2, y4, S(2*d+l), S(d), COLORS.flap);

  // Fold lines
  svg += foldV(x2, y0, y5); svg += foldV(x3, y0, y5);
  svg += foldV(x4, y0, y5); svg += foldV(x5, y0, y5);
  svg += foldH(x0, x7, y1); svg += foldH(x0, x7, y2);
  svg += foldH(x0, x7, y3); svg += foldH(x0, x7, y4);

  // Corner tabs (diagonal fold)
  const corners = [[x1,y0,x2,y1],[x5,y0,x6,y1],[x1,y4,x2,y5],[x5,y4,x6,y5]];
  corners.forEach(([cx1,cy1,cx2,cy2]) => {
    svg += `<line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" class="fold"/>`;
  });

  // Labels
  svg += label((x3+x4)/2, (y2+y3)/2, 'W × L');

  // Dimension lines
  svg += dimH(x3, x4, y0-12, 'ยาว');
  svg += dimH(x4, x5, y0-12, 'ความสูง');
  svg += dimV(x7+10, y1, y4, 'กว้าง');

  svg += grainArrow(x1, x6, y0-38);

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 5: Double Glue Side Wall — ฝาครอบ', info);
}

// ============================================================
// TYPE 6: Frame-Vue Tray
// ============================================================
function drawFrameVue(w, l, d, df, ol) {
  const _df = df||25, _ol = ol||10;
  const totalH = w+4*d+2*_df+2*_ol;
  const totalV = l+4*d+2*_df+2*_ol;
  // Similar to Type 5 but with extra overlap strips
  const sc2 = Math.min(520/totalH, 440/totalV) * 0.78;
  const ox2 = 55+(520-totalH*sc2)/2, oy2 = 60+(440-totalV*sc2)/2;
  const S = v => v * sc2;

  let svg = '';
  const x0=ox2, x1=x0+S(_ol), x2=x1+S(_df), x3=x2+S(d), x4=x3+S(d);
  const x5=x4+S(w), x6=x5+S(d), x7=x6+S(d), x8=x7+S(_df), x9=x8+S(_ol);
  const y0=oy2, y1=y0+S(_ol), y2=y1+S(_df), y3=y2+S(d), y4=y3+S(d);
  const y5=y4+S(l), y6=y5+S(d), y7=y6+S(d), y8=y7+S(_df), y9=y8+S(_ol);

  svg += rect(x1, y1, x8-x1, y8-y1, COLORS.panel);
  svg += rect(x0, y2, S(_ol), y7-y2, COLORS.flap);
  svg += rect(x8, y2, S(_ol), y7-y2, COLORS.flap);
  svg += rect(x2, y0, x7-x2, S(_ol), COLORS.flap);
  svg += rect(x2, y8, x7-x2, S(_ol), COLORS.flap);

  [x2,x3,x4,x5,x6,x7].forEach(x => svg += foldV(x, y0, y9));
  [y2,y3,y4,y5,y6,y7].forEach(y => svg += foldH(x0, x9, y));

  svg += label((x4+x5)/2, (y4+y5)/2, 'W × L');
  svg += dimH(x4, x5, y0-12, 'กว้าง');
  svg += dimV(x9+10, y4, y5, 'ยาว');
  svg += grainArrow(x1, x8, y0-38);

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 6: Frame-Vue Tray', info);
}

// ============================================================
// TYPE 7: Four Corner Beers Tray
// ============================================================
function drawFourCorner(w, l, d, df) {
  const _df = df||25;
  const totalH = 2*(l+_df)+w;
  const totalV = 2*(l+d)+l;

  const sc2 = Math.min(520/totalH, 440/totalV) * 0.80;
  const ox2 = 55+(520-totalH*sc2)/2, oy2 = 60+(440-totalV*sc2)/2;
  const S = v => v * sc2;

  const x0=ox2, x1=x0+S(l), x2=x1+S(_df), x3=x2+S(w), x4=x3+S(_df), x5=x4+S(l);
  const y0=oy2, y1=y0+S(l), y2=y1+S(d), y3=y2+S(l), y4=y3+S(d), y5=y4+S(l);

  let svg = '';
  // Main shape
  svg += rect(x0, y1, x5-x0, y4-y1, COLORS.panel);
  // Top/bottom extensions
  svg += rect(x1, y0, x4-x1, S(l), COLORS.flap);
  svg += rect(x1, y4, x4-x1, S(l), COLORS.flap);

  // Fold lines
  [x1,x2,x3,x4].forEach(x => svg += foldV(x, y0, y5));
  [y1,y2,y3,y4].forEach(y => svg += foldH(x0, x5, y));

  // Corner diagonal folds
  [[x0,y1,x1,y2],[x4,y1,x5,y2],[x0,y3,x1,y4],[x4,y3,x5,y4]].forEach(([a,b,c,dd])=>{
    svg += `<line x1="${a}" y1="${b}" x2="${c}" y2="${dd}" class="fold"/>`;
  });

  svg += label((x2+x3)/2, (y2+y3)/2, 'W × L');
  svg += dimH(x2, x3, y0-12, 'ยาว');
  svg += dimH(x3, x4, y0-12, 'ความสูง');
  svg += dimV(x5+12, y1, y4, 'กว้าง');
  svg += `<text x="${x0+S(l/2)}" y="${y0-15}" class="lbl-sm">ปีกกล่อง</text>`;
  svg += grainArrow(x0, x4, y0-38);

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 7: Four Corner Beers Tray', info);
}

// ============================================================
// TYPE 8: Gable Top (จั่ว)
// ============================================================
function drawGableTop(w, l, d, gf, tf, ol) {
  const hw = w/2, _ol = ol||10;
  const totalH = gf+2*l+2*w; // same L formula
  const totalV = tf+2*d+hw+_ol;

  const sc2 = Math.min(520/totalH, 440/totalV)*0.86;
  const ox2 = 55+(520-totalH*sc2)/2, oy2 = 60+(440-totalV*sc2)/2;
  const S = v => v * sc2;

  const x0=ox2, x1=x0+S(gf), x2=x1+S(l), x3=x2+S(w), x4=x3+S(l), x5=x4+S(w);
  const y0=oy2, y1=y0+S(tf), y2=y1+S(d), y3=y2+S(d), y4=y3+S(hw), y5=y4+S(_ol);

  let svg = '';
  svg += grainArrow(x1, x5, oy2-38);
  svg += dimH(x0,x1,oy2-18,'G'); svg += dimH(x1,x2,oy2-18,'ยาว');
  svg += dimH(x2,x3,oy2-18,'กว้าง'); svg += dimH(x3,x4,oy2-18,'ยาว'); svg += dimH(x4,x5,oy2-18,'กว้าง');
  svg += `<text x="${x0+S(gf/2)}" y="${oy2-30}" class="lbl-sm">ติดกาว</text>`;

  svg += rect(x1, y1, S(2*l+2*w), S(2*d+hw), COLORS.panel);

  // Glue flap
  const gi = S(gf*0.3);
  svg += `<path d="M${x1},${y1} L${x0+gi},${y1+S(d*0.2)} L${x0},${y1+S(d*0.5)} L${x0},${y4-S(hw*0.3)} L${x0+gi},${y4} L${x1},${y4}" class="cut" fill="${COLORS.glue}"/>`;
  svg += label(x0+S(gf*0.45), (y1+y4)/2, 'ติดกาว', -90);

  // Top tuck with gable shape (triangular/peaked)
  const peakX = (x1+x2)/2;
  svg += `<path d="M${x1},${y1} L${x1},${y0+S(tf*0.4)} L${peakX},${y0} L${x2},${y0+S(tf*0.4)} L${x2},${y1}" class="cut" fill="${COLORS.flap}"/>`;
  svg += label(peakX, y0+S(tf*0.55), 'ฝาเสียบ');

  svg += foldV(x2,y0,y5); svg += foldV(x3,y0,y5); svg += foldV(x4,y0,y5);
  svg += foldH(x0,x5,y1); svg += foldH(x0,x5,y2); svg += foldH(x0,x5,y3); svg += foldH(x1,x5,y4);

  svg += dimV(x5+12, y1, y4, 'ฝาเสียบ');

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 8: Gable Top — กล่องจั่ว', info);
}

// ============================================================
// TYPE 9: Sleeve (ปลอก)
// ============================================================
function drawSleeve(w, l, d, gf) {
  const totalH = gf+2*l+2*w;
  const totalV = d;

  const sc2 = Math.min(520/totalH, 320/(totalV||1))*0.85;
  const capSc = Math.min(sc2, 3);
  const ox2 = 55+(520-totalH*capSc)/2, oy2 = 130;
  const S = v => v * capSc;

  const x0=ox2, x1=x0+S(gf), x2=x1+S(l), x3=x2+S(w), x4=x3+S(l), x5=x4+S(w);
  const y0=oy2, y5=y0+Math.max(S(d), 80); // min height

  let svg = '';
  svg += grainArrow(x1, x5, y0-42);
  svg += dimH(x0,x1,y0-22,'G'); svg += dimH(x1,x2,y0-22,'ยาว');
  svg += dimH(x2,x3,y0-22,'กว้าง'); svg += dimH(x3,x4,y0-22,'ยาว'); svg += dimH(x4,x5,y0-22,'กว้าง');
  svg += `<text x="${x0+S(gf/2)}" y="${y0-34}" class="lbl-sm">ติดกาว</text>`;

  // Main rectangle
  svg += rect(x0, y0, x5-x0, y5-y0, COLORS.panel);
  // Glue flap area
  svg += rect(x0, y0, S(gf), y5-y0, COLORS.glue);

  // Fold lines
  [x1,x2,x3,x4].forEach(x => svg += foldV(x, y0, y5));

  svg += label(x0+S(gf/2), (y0+y5)/2, 'ติดกาว', -90);
  svg += label((x1+x2)/2, (y0+y5)/2, 'ยาว');
  svg += label((x2+x3)/2, (y0+y5)/2, 'กว้าง');

  svg += dimV(x5+12, y0, y5, 'ฝาเสียบ');

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${(d||0).toFixed(1)} mm` : '';
  return svgWrap(620, 440, svg, 'Type 9: Sleeve — ปลอก', info);
}

// ============================================================
// TYPE 10: Pillow Box (หมอน)
// ============================================================
function drawPillow(w, l, d, gf) {
  const totalH = 2*w+gf;
  const totalV = l+d;

  const sc2 = Math.min(500/totalH, 440/totalV)*0.8;
  const ox2 = 55+(500-totalH*sc2)/2, oy2 = 60+(440-totalV*sc2)/2;
  const S = v => v * sc2;

  const x0=ox2, x1=x0+S(w), x2=x1+S(w), x3=x2+S(gf);
  const y0=oy2, y1=y0+S(l), y2=y1+S(d);

  let svg = '';
  svg += rect(x0, y0, S(2*w+gf), S(l+d), COLORS.panel);
  svg += rect(x2, y0, S(gf), S(l+d), COLORS.glue);
  svg += foldV(x1, y0, y2); svg += foldV(x2, y0, y2);
  svg += foldH(x0, x3, y1);

  // Curved pillow flap hints
  svg += `<path d="M${x0},${y0} Q${(x0+x1)/2},${y0-S(l*0.08)} ${x1},${y0}" class="fold"/>`;
  svg += `<path d="M${x0},${y2} Q${(x0+x1)/2},${y2+S(l*0.08)} ${x1},${y2}" class="fold"/>`;

  svg += label((x0+x1)/2, (y0+y1)/2, 'W');
  svg += label((x1+x2)/2, (y0+y1)/2, 'W');
  svg += label(x2+S(gf/2), (y0+y1)/2, 'gf');

  svg += dimH(x0, x1, y0-15, 'กว้าง');
  svg += dimV(x3+10, y0, y1, 'ยาว');
  svg += dimV(x3+10, y1, y2, 'D');
  svg += grainArrow(x0, x2, y0-38);

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 10: Pillow Box — กล่องหมอน', info);
}

// ============================================================
// TYPE 11: Seal End (ทากาว)
// ============================================================
function drawSealEnd(w, l, d, gf) {
  const totalH = gf+2*l+2*w; // same L
  const totalV = 2*w+d;

  const sc2 = Math.min(520/totalH, 440/totalV)*0.86;
  const ox2 = 55+(520-totalH*sc2)/2, oy2 = 60+(440-totalV*sc2)/2;
  const S = v => v * sc2;

  const x0=ox2, x1=x0+S(gf), x2=x1+S(l), x3=x2+S(w), x4=x3+S(l), x5=x4+S(w);
  const y0=oy2, y1=y0+S(w), y2=y1+S(d), y3=y2+S(w);

  let svg = '';
  svg += grainArrow(x1, x5, y0-38);
  svg += dimH(x0,x1,y0-18,'G'); svg += dimH(x1,x2,y0-18,'ยาว');
  svg += dimH(x2,x3,y0-18,'กว้าง'); svg += dimH(x3,x4,y0-18,'ยาว'); svg += dimH(x4,x5,y0-18,'กว้าง');
  svg += `<text x="${x0+S(gf/2)}" y="${y0-30}" class="lbl-sm">ติดกาว</text>`;

  svg += rect(x1, y0, S(2*l+2*w), S(2*w+d), COLORS.panel);

  // Glue flap
  const gi = S(gf*0.3);
  svg += `<path d="M${x1},${y0+S(w*0.1)} L${x0+gi},${y0+S(w*0.3)} L${x0},${y0+S(w*0.5)} L${x0},${y3-S(w*0.5)} L${x0+gi},${y3-S(w*0.3)} L${x1},${y3-S(w*0.1)}" class="cut" fill="${COLORS.glue}"/>`;
  svg += label(x0+S(gf*0.4), (y0+y3)/2, 'ติดกาว', -90);

  // Top/bottom seal flaps (rectangular, no tuck)
  svg += rect(x2, y0, S(w), S(w), COLORS.flap);
  svg += label(x2+S(w/2), y0+S(w/2), 'ปีก\nกล่อง');
  svg += rect(x4, y0, S(w), S(w), COLORS.flap);
  svg += label(x4+S(w/2), y0+S(w/2), 'ปีก\nกล่อง');
  svg += rect(x2, y2, S(w), S(w), COLORS.flap);
  svg += label(x2+S(w/2), y2+S(w/2), 'ปีก\nกล่อง');

  svg += foldV(x2,y0,y3); svg += foldV(x3,y0,y3); svg += foldV(x4,y0,y3);
  svg += foldH(x0,x5,y1); svg += foldH(x0,x5,y2);

  svg += dimV(x5+12, y0, y3, 'ฝาเสียบ');

  const info = w ? `W=${w} L=${l} D=${d} mm | Open: ${totalH.toFixed(1)}×${totalV.toFixed(1)} mm` : '';
  return svgWrap(620, 540, svg, 'Type 11: Seal End — ทากาว', info);
}

// ============================================================
// TYPE 12: Custom
// ============================================================
function drawCustom(w, l) {
  const svgW = 620, svgH = 540;
  const _w = w||100, _l = l||80;
  const padX = 80, padY = 80;
  const areaW = svgW - padX*2, areaH = svgH - padY*2 - 40;
  const sc2 = Math.min(areaW/_w, areaH/_l) * 0.85;
  const drawW = _w * sc2, drawH = _l * sc2;
  const ox2 = (svgW - drawW) / 2;
  const oy2 = padY + (areaH - drawH) / 2;
  const S = v => v * sc2;

  let svg = '';
  svg += rect(ox2, oy2, drawW, drawH, COLORS.panel);
  svg += label(ox2+drawW/2, oy2+drawH/2, 'Custom — กำหนดเอง', 0);
  svg += grainArrow(ox2, ox2+drawW, oy2-35);
  svg += dimH(ox2, ox2+drawW, oy2-15, w?`W=${w} mm`:'W');
  svg += dimV(ox2+drawW+15, oy2, oy2+drawH, l?`L=${l} mm`:'L');

  const info = w ? `W=${w} L=${l} mm` : 'กรอกขนาด Open Size (W×L)';
  return svgWrap(svgW, svgH, svg, 'Type 12: Custom — กำหนดเอง', info);
}

// ============================================================
// MAIN ENTRY: generate SVG for any template
// ============================================================
function generate(typeId, sz) {
  if (!typeId || typeId < 1 || typeId > 12) return '';
  const w = parseFloat(sz?.width) || 60;
  const l = parseFloat(sz?.length) || 80;
  const d = parseFloat(sz?.depth) || 30;
  const gf = parseFloat(sz?.glue_flap) || 15;
  const tf = parseFloat(sz?.tuck_flap) || 15;
  const df = parseFloat(sz?.dust_flap) || ([5,6].includes(typeId) ? 25 : 0);
  const ol = parseFloat(sz?.ol) || ([3,4,6,8].includes(typeId) ? 10 : 0);

  switch (typeId) {
    case 1: case 2: return drawTuckEnd(typeId, w, l, d, gf, tf);
    case 3: case 4: return drawAutoLock(typeId, w, l, d, gf, tf, ol);
    case 5: return drawTray(w, l, d, df);
    case 6: return drawFrameVue(w, l, d, df, ol);
    case 7: return drawFourCorner(w, l, d, df);
    case 8: return drawGableTop(w, l, d, gf, tf, ol);
    case 9: return drawSleeve(w, l, d, gf);
    case 10: return drawPillow(w, l, d, gf);
    case 11: return drawSealEnd(w, l, d, gf);
    case 12: return drawCustom(parseFloat(sz?.width)||0, parseFloat(sz?.length)||0);
    default: return '';
  }
}

return { generate };
})();
