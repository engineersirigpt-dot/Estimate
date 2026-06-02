// ============================================================
// PORNCHAI AI BRAIN v5.0 — JARVIS × Printing Industry 3.0
// Full holographic command center with arc reactor core
// ============================================================

function initBrainRender(container, nodes, edges, D) {
  var totalRecords=D.totalRecords, bp=D.bp, bc=D.bc, bf=D.bf, bb=D.bb, bm=D.bm, bpr=D.bpr, rStats=D.rStats, brain=D.brain;

  // === HTML Shell ===
  container.innerHTML =
    '<div id="brainWrap" style="position:relative;width:100%;height:calc(100vh - 60px);overflow:hidden;background:#000">' +
    '<canvas id="brainCanvas" style="width:100%;height:100%"></canvas>' +
    '<div id="brainTooltip" style="position:absolute;display:none;padding:10px 16px;border-radius:8px;font-size:13px;pointer-events:none;z-index:20;' +
      'background:rgba(0,0,0,0.85);color:#fff;border:1px solid rgba(0,200,255,0.4);backdrop-filter:blur(12px);box-shadow:0 0 30px rgba(0,180,255,0.15)"></div>' +
    '<button onclick="App.showToolsTab()" style="position:absolute;top:16px;right:20px;background:rgba(0,180,255,0.08);color:rgba(0,200,255,0.7);border:1px solid rgba(0,200,255,0.2);padding:9px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.3s;z-index:10" ' +
      'onmouseover="this.style.background=\'rgba(0,180,255,0.15)\';this.style.color=\'#00c8ff\'" onmouseout="this.style.background=\'rgba(0,180,255,0.08)\';this.style.color=\'rgba(0,200,255,0.7)\'">\u2190 Back</button>' +
    '</div>';

  var canvas = document.getElementById('brainCanvas');
  if (!canvas) return null;
  var ctx = canvas.getContext('2d');
  var W, H, dpr = window.devicePixelRatio || 1;
  var rotX = -0.25, rotY = 0, zoom = 1, dragging = false, lastMX = 0, lastMY = 0;
  var hoveredNode = null, selectedNodeId = null, animFrame = 0, t = 0;

  // === Color palette ===
  var C = {
    cyan: '#00c8ff', cyanRGB: '0,200,255',
    mag: '#ff0080', magRGB: '255,0,128',
    gold: '#ffb800', goldRGB: '255,184,0',
    teal: '#00e5c0', tealRGB: '0,229,192',
    white: '#ffffff', dim: 'rgba(255,255,255,0.06)',
  };

  // === Helpers ===
  function hexPath(x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var a = (i/6)*Math.PI*2+(rot||0); ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r, y+Math.sin(a)*r); }
    ctx.closePath();
  }

  // === Pre-generate background particles ===
  var bgParticles = [];
  for (var i = 0; i < 200; i++) {
    bgParticles.push({
      x: Math.random(), y: Math.random(),
      vx: (Math.random()-0.5)*0.0003, vy: (Math.random()-0.5)*0.0003,
      s: 0.3 + Math.random()*1.2, a: 0.05 + Math.random()*0.15,
      phase: Math.random()*Math.PI*2
    });
  }

  // === Floating data streams ===
  var dataStreams = [];
  for (var i = 0; i < 12; i++) {
    dataStreams.push({
      x: Math.random(), speed: 0.2 + Math.random()*0.5,
      chars: [], maxLen: 15 + Math.floor(Math.random()*25),
      timer: 0, interval: 0.03 + Math.random()*0.05,
      opacity: 0.03 + Math.random()*0.04
    });
  }

  // === Ring configs for core ===
  var coreRings = [
    { r:1.4, sp:0.5, segs:60, gap:0.03, w:1, a:0.35 },
    { r:1.7, sp:-0.35, segs:36, gap:0.05, w:1.5, a:0.25 },
    { r:2.1, sp:0.2, segs:48, gap:0.04, w:0.8, a:0.2 },
    { r:2.6, sp:-0.15, segs:24, gap:0.08, w:2, a:0.15 },
    { r:3.2, sp:0.25, segs:72, gap:0.02, w:0.6, a:0.1 },
    { r:3.8, sp:-0.1, segs:12, gap:0.15, w:2.5, a:0.08 },
    { r:4.5, sp:0.08, segs:96, gap:0.015, w:0.4, a:0.05 },
  ];

  // === Energy arcs ===
  var arcs = [
    { r:2.0, sp:0.7, sweep:0.6, w:3 },
    { r:2.8, sp:-0.5, sweep:0.8, w:2 },
    { r:3.5, sp:0.35, sweep:0.45, w:2.5 },
    { r:1.6, sp:-0.9, sweep:0.35, w:1.5 },
  ];

  // === Pulse waves ===
  var pulses = [];
  var lastPulse = 0;

  // === Waveform data ===
  var waveData = [];
  for (var i = 0; i < 120; i++) waveData.push(0);

  // === Init nodes ===
  for (var i = 0; i < nodes.length; i++) {
    var nd = nodes[i];
    nd._ph = Math.random()*Math.PI*2;
    nd._sp = 0.5+Math.random();
    nd._oa = Math.random()*Math.PI*2;
    nd._os = 0.08+Math.random()*0.2;
    nd._or = 2+Math.random()*5;
    nd._bx = nd.x; nd._by = nd.y; nd._bz = nd.z||0;
  }

  // === Edge particles ===
  var eParts = [];
  for (var i = 0; i < edges.length; i++) {
    if (edges[i].width >= 1.5) {
      for (var j = 0; j < 4; j++) {
        eParts.push({ ei:i, t:Math.random(), sp:0.12+Math.random()*0.3, sz:1+Math.random()*1.5, br:0.5+Math.random()*0.5 });
      }
    }
  }

  function resize() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  var _rh = function(){resize();};
  window.addEventListener('resize', _rh);

  function proj(nd) {
    var cx=Math.cos(rotX),sx=Math.sin(rotX),cy=Math.cos(rotY),sy=Math.sin(rotY);
    var x=nd.x, y=nd.y, z=nd.z||0;
    var x1=x*cy-z*sy, z1=x*sy+z*cy, y1=y*cx-z1*sx, z2=y*sx+z1*cx;
    var f=600, s=f/(f+z2)*zoom;
    return {sx:W/2+x1*s, sy:H/2+y1*s, s:s, z:z2};
  }
  function findN(id) { for(var i=0;i<nodes.length;i++) if(nodes[i].id===id) return nodes[i]; return null; }

  // ======================== MAIN DRAW ========================
  function draw() {
    t += 0.016;
    ctx.clearRect(0,0,W,H);

    // Update node positions
    for (var i=0;i<nodes.length;i++) {
      var nd=nodes[i];
      if (nd.type==='detail') {
        nd._oa += nd._os*0.016;
        nd.x = nd._bx + Math.cos(nd._oa)*nd._or;
        nd.y = nd._by + Math.sin(nd._oa)*nd._or;
      }
    }

    // ====== BACKGROUND ======
    // Deep space gradient
    var bg = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,W*0.8);
    bg.addColorStop(0, '#0a0e18');
    bg.addColorStop(0.5, '#060810');
    bg.addColorStop(1, '#020304');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    // Ambient glow at center
    var ag = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,W*0.4);
    ag.addColorStop(0, 'rgba(0,100,180,0.06)');
    ag.addColorStop(0.5, 'rgba(0,60,120,0.02)');
    ag.addColorStop(1, 'transparent');
    ctx.fillStyle = ag;
    ctx.fillRect(0,0,W,H);

    // Floating particles
    for (var i=0;i<bgParticles.length;i++) {
      var p = bgParticles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x<0) p.x=1; if(p.x>1) p.x=0;
      if (p.y<0) p.y=1; if(p.y>1) p.y=0;
      var twinkle = p.a + Math.sin(t*1.5+p.phase)*0.06;
      ctx.fillStyle = 'rgba('+C.cyanRGB+','+Math.max(0.01,twinkle)+')';
      ctx.beginPath();
      ctx.arc(p.x*W, p.y*H, p.s, 0, Math.PI*2);
      ctx.fill();
    }

    // Data rain streams (Matrix/JARVIS style)
    ctx.font = '10px monospace';
    for (var i=0;i<dataStreams.length;i++) {
      var ds = dataStreams[i];
      ds.timer += 0.016;
      if (ds.timer > ds.interval) {
        ds.timer = 0;
        var c = String.fromCharCode(0x30A0 + Math.floor(Math.random()*96)); // Katakana
        ds.chars.push({c:c, y:0, a:1});
        if (ds.chars.length > ds.maxLen) ds.chars.shift();
      }
      for (var j=0;j<ds.chars.length;j++) {
        var ch = ds.chars[j];
        ch.y += ds.speed;
        ch.a = Math.max(0, 1 - j/ds.chars.length*0.8);
        var cy2 = ch.y * 14;
        if (cy2 > H) { ds.chars.splice(j,1); j--; continue; }
        ctx.fillStyle = 'rgba('+C.cyanRGB+','+(ch.a * ds.opacity)+')';
        ctx.fillText(ch.c, ds.x*W, cy2);
      }
    }

    // ====== CORE — JARVIS ARC REACTOR ======
    var bp0 = proj(nodes[0]);
    var cx = bp0.sx, cy = bp0.sy, cR = nodes[0].size * bp0.s;

    // === Deep field glow ===
    var dg = ctx.createRadialGradient(cx,cy,0, cx,cy,cR*6);
    dg.addColorStop(0, 'rgba('+C.cyanRGB+',0.08)');
    dg.addColorStop(0.2, 'rgba(0,100,200,0.04)');
    dg.addColorStop(0.5, 'rgba(0,40,80,0.02)');
    dg.addColorStop(1, 'transparent');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(cx,cy,cR*6,0,Math.PI*2); ctx.fill();

    // === Pulse waves ===
    if (t - lastPulse > 2.0) {
      pulses.push({t:0, maxR:350+Math.random()*150});
      lastPulse = t;
    }
    for (var i=pulses.length-1;i>=0;i--) {
      var pw = pulses[i];
      pw.t += 0.008;
      if (pw.t >= 1) { pulses.splice(i,1); continue; }
      var pr = pw.t * pw.maxR * zoom;
      var pa = (1-pw.t)*0.2;
      // Outer ring
      ctx.strokeStyle = 'rgba('+C.cyanRGB+','+pa+')';
      ctx.lineWidth = 2*(1-pw.t);
      ctx.beginPath(); ctx.arc(cx,cy,pr,0,Math.PI*2); ctx.stroke();
      // Inner glow ring
      var pg = ctx.createRadialGradient(cx,cy,pr*0.97, cx,cy,pr*1.03);
      pg.addColorStop(0,'rgba('+C.cyanRGB+',0)');
      pg.addColorStop(0.5,'rgba('+C.cyanRGB+','+(pa*0.3)+')');
      pg.addColorStop(1,'rgba('+C.cyanRGB+',0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(cx,cy,pr*1.03,0,Math.PI*2);
      ctx.arc(cx,cy,pr*0.97,0,Math.PI*2);
      ctx.fill('evenodd');
      // Secondary pulse
      if (pw.t > 0.15) {
        var pr2 = (pw.t-0.15)*pw.maxR*zoom;
        ctx.strokeStyle = 'rgba('+C.cyanRGB+','+(pa*0.3)+')';
        ctx.lineWidth = 1*(1-pw.t);
        ctx.beginPath(); ctx.arc(cx,cy,pr2,0,Math.PI*2); ctx.stroke();
      }
    }

    // === HUD Rings ===
    for (var i=0;i<coreRings.length;i++) {
      var cr = coreRings[i];
      var rr = cR * cr.r;
      var rot = t * cr.sp;
      var segA = Math.PI*2/cr.segs;
      var dashA = segA * (1-cr.gap);
      var ra = cr.a + Math.sin(t*1.2+i)*0.04;
      ctx.strokeStyle = 'rgba('+C.cyanRGB+','+Math.max(0.01,ra)+')';
      ctx.lineWidth = cr.w * bp0.s;
      for (var j=0;j<cr.segs;j++) {
        var a1 = rot + j*segA;
        ctx.beginPath(); ctx.arc(cx,cy,rr,a1,a1+dashA); ctx.stroke();
      }
    }

    // === Energy Arcs ===
    for (var i=0;i<arcs.length;i++) {
      var ar = arcs[i];
      var aR = cR * ar.r;
      var aStart = t * ar.sp + i*Math.PI*0.5;
      var aSweep = ar.sweep + Math.sin(t*0.7+i)*0.15;
      var aAlpha = 0.3 + Math.sin(t*2+i*1.5)*0.15;
      // Glow
      ctx.strokeStyle = 'rgba('+C.cyanRGB+','+(aAlpha*0.2)+')';
      ctx.lineWidth = (ar.w+5)*bp0.s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx,cy,aR,aStart,aStart+aSweep); ctx.stroke();
      // Core arc
      ctx.strokeStyle = 'rgba('+C.cyanRGB+','+aAlpha+')';
      ctx.lineWidth = ar.w*bp0.s;
      ctx.beginPath(); ctx.arc(cx,cy,aR,aStart,aStart+aSweep); ctx.stroke();
      ctx.lineCap = 'butt';
      // Tip spark
      var tx = cx+Math.cos(aStart+aSweep)*aR, ty = cy+Math.sin(aStart+aSweep)*aR;
      var sg = ctx.createRadialGradient(tx,ty,0,tx,ty,6*bp0.s);
      sg.addColorStop(0,'rgba(255,255,255,'+(aAlpha*0.8)+')');
      sg.addColorStop(1,'rgba('+C.cyanRGB+',0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(tx,ty,6*bp0.s,0,Math.PI*2); ctx.fill();
    }

    // === Radar sweep ===
    var scanA = t * 0.3;
    var scanR = cR * 5;
    try {
      var scanG = ctx.createConicGradient(scanA, cx, cy);
      scanG.addColorStop(0, 'rgba('+C.cyanRGB+',0.07)');
      scanG.addColorStop(0.05, 'rgba('+C.cyanRGB+',0)');
      for(var sg2=0.1;sg2<1;sg2+=0.1) scanG.addColorStop(sg2,'rgba(0,0,0,0)');
      ctx.fillStyle = scanG;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,scanR,0,Math.PI*2); ctx.fill();
    } catch(e) {}
    // Sweep line
    ctx.strokeStyle = 'rgba('+C.cyanRGB+',0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(scanA)*scanR, cy+Math.sin(scanA)*scanR);
    ctx.stroke();

    // === Core body — triple nested hexagons ===
    var corePulse = 0.7 + Math.sin(t*3)*0.3;
    // Outer hex
    ctx.strokeStyle = 'rgba('+C.cyanRGB+','+(0.4*corePulse)+')';
    ctx.lineWidth = 2*bp0.s;
    hexPath(cx,cy,cR*1.15, t*0.08);
    ctx.stroke();
    // Fill subtle
    ctx.fillStyle = 'rgba('+C.cyanRGB+','+(0.03*corePulse)+')';
    hexPath(cx,cy,cR*1.15, t*0.08);
    ctx.fill();
    // Mid hex
    ctx.strokeStyle = 'rgba('+C.cyanRGB+','+(0.3*corePulse)+')';
    ctx.lineWidth = 1.5*bp0.s;
    hexPath(cx,cy,cR*0.75, -t*0.12);
    ctx.stroke();
    // Inner core — bright radial
    var ig = ctx.createRadialGradient(cx,cy,0, cx,cy,cR*0.55);
    ig.addColorStop(0, 'rgba(255,255,255,'+(0.85*corePulse)+')');
    ig.addColorStop(0.25, 'rgba('+C.cyanRGB+','+(0.6*corePulse)+')');
    ig.addColorStop(0.6, 'rgba(0,80,160,'+(0.3*corePulse)+')');
    ig.addColorStop(1, 'rgba(0,40,80,0.05)');
    ctx.fillStyle = ig;
    hexPath(cx,cy,cR*0.55, t*0.15);
    ctx.fill();
    // Inner hex stroke
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.3*corePulse)+')';
    ctx.lineWidth = 1*bp0.s;
    hexPath(cx,cy,cR*0.55, t*0.15);
    ctx.stroke();

    // === Orbiting energy particles (4 CMYK) ===
    var orbColors = [C.cyanRGB, C.magRGB, C.goldRGB, C.tealRGB];
    for (var oi=0;oi<4;oi++) {
      var oA = t*(0.5+oi*0.2) + oi*Math.PI*0.5;
      var oR = cR*(1.8+oi*0.6);
      var oX = cx+Math.cos(oA)*oR, oY = cy+Math.sin(oA)*oR;
      var oAlpha = 0.6+Math.sin(t*2.5+oi)*0.3;
      // Trail
      for (var tr=1;tr<=10;tr++) {
        var trA = oA - tr*0.035;
        var trX = cx+Math.cos(trA)*oR, trY = cy+Math.sin(trA)*oR;
        ctx.fillStyle = 'rgba('+orbColors[oi]+','+(oAlpha*(1-tr/11)*0.2)+')';
        ctx.beginPath(); ctx.arc(trX,trY,(3-tr*0.25)*bp0.s,0,Math.PI*2); ctx.fill();
      }
      // Head
      var og = ctx.createRadialGradient(oX,oY,0,oX,oY,5*bp0.s);
      og.addColorStop(0,'rgba(255,255,255,'+oAlpha+')');
      og.addColorStop(0.4,'rgba('+orbColors[oi]+','+(oAlpha*0.5)+')');
      og.addColorStop(1,'rgba('+orbColors[oi]+',0)');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(oX,oY,5*bp0.s,0,Math.PI*2); ctx.fill();
    }

    // ====== EDGES — energy beams ======
    for (var i=0;i<edges.length;i++) {
      var e=edges[i], fn=findN(e.from), tn=findN(e.to);
      if(!fn||!tn) continue;
      var p1=proj(fn), p2=proj(tn);
      var lw=(e.width||0.5)*(p1.s+p2.s)/2;
      if (e.width>=1.5) {
        // Wide glow
        ctx.strokeStyle = 'rgba('+C.cyanRGB+',0.03)';
        ctx.lineWidth = lw*6;
        ctx.beginPath(); ctx.moveTo(p1.sx,p1.sy); ctx.lineTo(p2.sx,p2.sy); ctx.stroke();
        // Mid
        var ePulse = 0.15+Math.sin(t*1.5+i*0.5)*0.06;
        ctx.strokeStyle = 'rgba('+C.cyanRGB+','+ePulse+')';
        ctx.lineWidth = lw*1.5;
        ctx.beginPath(); ctx.moveTo(p1.sx,p1.sy); ctx.lineTo(p2.sx,p2.sy); ctx.stroke();
      }
      // Thin core line
      ctx.strokeStyle = 'rgba('+C.cyanRGB+','+(e.width>=1.5?0.25:0.04)+')';
      ctx.lineWidth = Math.max(0.3, lw*0.5);
      ctx.beginPath(); ctx.moveTo(p1.sx,p1.sy); ctx.lineTo(p2.sx,p2.sy); ctx.stroke();
    }

    // Edge particles
    for (var i=0;i<eParts.length;i++) {
      var ep=eParts[i];
      ep.t = (ep.t+ep.sp*0.016)%1;
      var fe=edges[ep.ei], fpf=findN(fe.from), fpt=findN(fe.to);
      if(!fpf||!fpt) continue;
      var fp1=proj(fpf), fp2=proj(fpt);
      var ex=fp1.sx+(fp2.sx-fp1.sx)*ep.t, ey=fp1.sy+(fp2.sy-fp1.sy)*ep.t;
      var es=(fp1.s+fp2.s)/2;
      // Glow
      var epg = ctx.createRadialGradient(ex,ey,0,ex,ey,ep.sz*es*5);
      epg.addColorStop(0,'rgba('+C.cyanRGB+','+(ep.br*0.3)+')');
      epg.addColorStop(1,'transparent');
      ctx.fillStyle = epg;
      ctx.beginPath(); ctx.arc(ex,ey,ep.sz*es*5,0,Math.PI*2); ctx.fill();
      // Core dot
      ctx.fillStyle = 'rgba(255,255,255,'+(ep.br*0.8)+')';
      ctx.beginPath(); ctx.arc(ex,ey,ep.sz*es,0,Math.PI*2); ctx.fill();
    }

    // ====== NODES ======
    var projected = [];
    for (var i=0;i<nodes.length;i++) projected.push({n:nodes[i], p:proj(nodes[i])});
    projected.sort(function(a,b){return b.p.z-a.p.z;});

    for (var i=0;i<projected.length;i++) {
      var item=projected[i], n=item.n, p=item.p;
      var breath = 1+Math.sin(t*n._sp+n._ph)*0.05;
      var r = n.size*p.s*breath;
      var alpha = Math.max(0.25, Math.min(1,(500+p.z)/700));
      var hov = hoveredNode===n.id, sel = selectedNodeId===n.id;

      ctx.globalAlpha = alpha;

      if (n.type==='core') {
        // Label
        ctx.globalAlpha = 1;
        var fs = Math.max(18, 26*p.s);
        ctx.font = '800 '+fs+'px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 25+Math.sin(t*2)*8;
        ctx.fillStyle = '#fff';
        ctx.fillText('Pornchai AI', cx, cy+cR*1.25+25*p.s);
        ctx.shadowBlur = 0;
        // Sub
        ctx.font = '600 '+Math.max(9,11*p.s)+'px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba('+C.cyanRGB+',0.45)';
        ctx.fillText('PRINTING INDUSTRY 3.0', cx, cy+cR*1.25+25*p.s+fs*0.8);
        // Online
        var onPulse = 0.4+Math.sin(t*3)*0.3;
        ctx.fillStyle = 'rgba(0,255,128,'+onPulse+')';
        var onY = cy+cR*1.25+25*p.s+fs*1.5;
        ctx.beginPath(); ctx.arc(cx-28*p.s, onY, 3*p.s, 0, Math.PI*2); ctx.fill();
        ctx.font = '600 '+Math.max(8,9*p.s)+'px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(0,255,128,'+(onPulse+0.1)+')';
        ctx.textAlign = 'left';
        ctx.fillText('ONLINE', cx-22*p.s, onY);
        ctx.textAlign = 'center';

      } else if (n.type==='category') {
        var hr = hov ? r*1.15 : r;
        // Glow
        var ng = ctx.createRadialGradient(p.sx,p.sy,0, p.sx,p.sy,hr*3);
        ng.addColorStop(0, n.color+'20');
        ng.addColorStop(1, 'transparent');
        ctx.fillStyle = ng;
        ctx.beginPath(); ctx.arc(p.sx,p.sy,hr*3,0,Math.PI*2); ctx.fill();
        // Hex outline
        ctx.strokeStyle = n.color;
        ctx.lineWidth = (sel?2.5:1.5)*p.s;
        ctx.globalAlpha = alpha*(0.55+Math.sin(t*1.5+n._ph)*0.15);
        hexPath(p.sx,p.sy,hr,Math.PI/6);
        ctx.stroke();
        // Subtle fill
        ctx.fillStyle = n.color+'0a';
        hexPath(p.sx,p.sy,hr,Math.PI/6);
        ctx.fill();
        // Inner glow dot
        var cig = ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,hr*0.4);
        cig.addColorStop(0, n.color+'50');
        cig.addColorStop(1, 'transparent');
        ctx.fillStyle = cig;
        ctx.beginPath(); ctx.arc(p.sx,p.sy,hr*0.4,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = alpha;
        // Label
        ctx.font = '700 '+Math.max(11,13*p.s)+'px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,'+(0.85*alpha)+')';
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.fillText(n.label, p.sx, p.sy+hr+16*p.s);
        ctx.shadowBlur = 0;
        // Selection ring
        if (sel) {
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 1.5*p.s;
          ctx.globalAlpha = 0.4+Math.sin(t*3)*0.2;
          hexPath(p.sx,p.sy,hr*1.5,t*0.3+Math.PI/6);
          ctx.stroke();
          ctx.globalAlpha = alpha;
        }
      } else {
        // Detail nodes — small glowing dots
        var dr = hov ? r*1.5 : r;
        // Glow
        var dg2 = ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,dr*3);
        dg2.addColorStop(0, n.color+'30');
        dg2.addColorStop(1, 'transparent');
        ctx.fillStyle = dg2;
        ctx.beginPath(); ctx.arc(p.sx,p.sy,dr*3,0,Math.PI*2); ctx.fill();
        // Core
        ctx.fillStyle = n.color+'90';
        ctx.beginPath(); ctx.arc(p.sx,p.sy,dr,0,Math.PI*2); ctx.fill();
        // Bright center
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(p.sx,p.sy,dr*0.4,0,Math.PI*2); ctx.fill();
        // Hover label
        if (hov) {
          ctx.font = '600 '+Math.max(10,11*p.s)+'px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 8;
          ctx.fillText(n.label, p.sx, p.sy-dr-10);
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
    }

    // ====== HUD OVERLAY ======
    // Top-left info
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    // Title
    ctx.font = '800 18px "Segoe UI", sans-serif';
    ctx.fillStyle = C.cyan;
    ctx.shadowColor = C.cyan;
    ctx.shadowBlur = 10;
    ctx.fillText('PORNCHAI AI BRAIN', 22, 16);
    ctx.shadowBlur = 0;
    ctx.font = '500 10px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba('+C.cyanRGB+',0.35)';
    ctx.fillText('Printing Industry 3.0 — Knowledge Intelligence Platform', 22, 38);

    // Stats boxes
    var stats = [
      {l:'MASTER DATA', v:totalRecords, c:C.cyan},
      {l:'PAPER', v:bp.total||0, c:'#3b82f6'},
      {l:'COATING', v:bc.total||0, c:C.cyan},
      {l:'FOIL', v:bf.total||0, c:C.gold},
      {l:'RAG CHUNKS', v:rStats.chunks||0, c:C.mag},
    ];
    var sx = 22;
    for (var i=0;i<stats.length;i++) {
      var st = stats[i];
      // Glass box
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeStyle = st.c+'30';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(sx, 54, 80, 38, 6);
      ctx.fill(); ctx.stroke();
      // Label
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillStyle = st.c+'80';
      ctx.fillText(st.l, sx+8, 62);
      // Value
      ctx.font = '800 16px "Segoe UI", sans-serif';
      ctx.fillStyle = st.c;
      ctx.fillText(st.v.toLocaleString(), sx+8, 74);
      sx += 86;
    }

    // === Waveform at bottom ===
    waveData.push(0.3+Math.sin(t*3)*0.2+Math.sin(t*7.3)*0.1+Math.sin(t*13)*0.05+Math.random()*0.1);
    if (waveData.length > 120) waveData.shift();
    var wY = H-40, wH = 20, wW = 300;
    ctx.strokeStyle = 'rgba('+C.cyanRGB+',0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var wi=0;wi<waveData.length;wi++) {
      var wx = 22+wi*(wW/120);
      var wy = wY - waveData[wi]*wH;
      wi===0 ? ctx.moveTo(wx,wy) : ctx.lineTo(wx,wy);
    }
    ctx.stroke();
    // Glow version
    ctx.strokeStyle = 'rgba('+C.cyanRGB+',0.06)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (var wi=0;wi<waveData.length;wi++) {
      var wx = 22+wi*(wW/120);
      var wy = wY - waveData[wi]*wH;
      wi===0 ? ctx.moveTo(wx,wy) : ctx.lineTo(wx,wy);
    }
    ctx.stroke();
    // Label
    ctx.font = '500 9px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba('+C.cyanRGB+',0.2)';
    ctx.textAlign = 'left';
    ctx.fillText('SYSTEM ACTIVITY', 22, H-18);

    // Bottom center
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '500 9px "Segoe UI", sans-serif';
    ctx.fillText('PORNCHAI AI BRAIN v5.0 — SIRIVATANA INTERPRINT — PRINTING INDUSTRY 3.0', W/2, H-12);

    // Clock bottom-right
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba('+C.cyanRGB+',0.15)';
    var now = new Date();
    ctx.fillText(now.toLocaleTimeString(), W-22, H-12);

    animFrame = requestAnimationFrame(draw);
  }

  // === INTERACTIONS ===
  canvas.addEventListener('mousedown', function(e){dragging=true;lastMX=e.clientX;lastMY=e.clientY;canvas.style.cursor='grabbing';});
  canvas.addEventListener('mouseup', function(){dragging=false;canvas.style.cursor='default';});
  canvas.addEventListener('mouseleave', function(){dragging=false;canvas.style.cursor='default';hoveredNode=null;var tp=document.getElementById('brainTooltip');if(tp)tp.style.display='none';});
  canvas.addEventListener('mousemove', function(e){
    if(dragging){rotY+=(e.clientX-lastMX)*0.005;rotX+=(e.clientY-lastMY)*0.005;rotX=Math.max(-Math.PI/2.5,Math.min(Math.PI/2.5,rotX));lastMX=e.clientX;lastMY=e.clientY;}
    var rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    hoveredNode=null;
    for(var i=0;i<nodes.length;i++){var n=nodes[i],p=proj(n),dx=mx-p.sx,dy=my-p.sy,hr=Math.max(n.size*p.s+6,12);
      if(dx*dx+dy*dy<hr*hr){hoveredNode=n.id;var tp=document.getElementById('brainTooltip');
        if(tp){tp.style.display='block';tp.style.left=(e.clientX-rect.left+16)+'px';tp.style.top=(e.clientY-rect.top-30)+'px';
          tp.innerHTML='<span style="color:'+n.color+';text-shadow:0 0 8px '+n.color+'">●</span> '+n.label;}
        canvas.style.cursor='pointer';break;}}
    if(!hoveredNode){var tp2=document.getElementById('brainTooltip');if(tp2)tp2.style.display='none';if(!dragging)canvas.style.cursor='default';}
  });
  canvas.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(0.3,Math.min(3,zoom-e.deltaY*0.001));},{passive:false});
  canvas.addEventListener('touchstart',function(e){if(e.touches.length===1){dragging=true;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;}},{passive:true});
  canvas.addEventListener('touchmove',function(e){if(dragging&&e.touches.length===1){e.preventDefault();rotY+=(e.touches[0].clientX-lastMX)*0.005;rotX+=(e.touches[0].clientY-lastMY)*0.005;rotX=Math.max(-Math.PI/2.5,Math.min(Math.PI/2.5,rotX));lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;}},{passive:false});
  canvas.addEventListener('touchend',function(){dragging=false;},{passive:true});

  // Click → detail panel
  canvas.addEventListener('click', function(e){
    var rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top,clicked=false;
    for(var i=0;i<nodes.length;i++){var n=nodes[i],p=proj(n),dx=mx-p.sx,dy=my-p.sy;
      if(dx*dx+dy*dy<(n.size*p.s+8)*(n.size*p.s+8)){selectedNodeId=n.id;showDetail(n);clicked=true;break;}}
    if(!clicked){selectedNodeId=null;var dp=document.getElementById('brainDetailPanel');if(dp)dp.remove();}
  });

  // === Detail Panel ===
  function showDetail(node) {
    var h='';
    function _r(a,b){return '<div class="sr"><span>'+a+'</span><span>'+b+'</span></div>';}
    function _h(a,b){return '<div class="sh"><span>'+a+'</span><span>'+b+'</span></div>';}

    if(node.type==='core'){
      h=_r('Total Records',totalRecords)+_r('Paper',bp.total||0)+_r('Coating',bc.total||0)+_r('Foil Stamp',bf.total||0)+
        _r('Box Templates',bb.total||0)+_r('Machine',bm.total||0)+_r('Process',bpr.total||0)+
        _r('RAG Docs',rStats.documents||0)+_r('RAG Chunks',rStats.chunks||0)+
        _r('Corrugated',brain.corrugated?.total||0)+_r('Price Tiers',brain.price_tiers?.total||0)+
        (bp.gsm_range?_r('GSM Range',bp.gsm_range[0]+' - '+bp.gsm_range[1]):'');
    } else if(node.id==='paper'){
      h=_h('CODE','COUNT');(bp.codes||[]).slice(0,15).forEach(function(i){h+=_r(i[0],i[1]);});
      if(bp.brands){h+=_h('BRAND','COUNT');(bp.brands||[]).slice(0,8).forEach(function(b){h+=_r(b[0],b[1]);});}
    } else if(node.id==='box'){
      (bb.templates||[]).forEach(function(i,idx){h+=_r('Type '+(idx+1)+': '+(i[0]||''),i[1]||'');});
    } else if(node.id==='machine'){
      (bm.types||[]).forEach(function(i){h+=_r(i[0],i[1]+' sizes');});
    } else if(node.id==='process'){
      h=_h('COATING TYPE','COUNT');(bc.types||[]).forEach(function(i){h+=_r(i[0],i[1]);});
    } else if(node.id==='foil'){
      h=_h('COLOR','COUNT');(bf.colors||[]).forEach(function(i){h+=_r(i[0],i[1]);});
    } else if(node.id==='afterpress'){
      (bpr.list||[]).forEach(function(n){if(n)h+=_r(n,'\u2713');});
    } else if(node.id==='rag'){
      h=_r('Documents',rStats.documents||0)+_r('Chunks',rStats.chunks||0);
      if(rStats.categories) for(var ck in rStats.categories) h+=_r(ck,rStats.categories[ck]);
    } else if(node.id==='data'){
      h=_r('Price Tiers',brain.price_tiers?.total||0)+_r('Waste Tiers',brain.waste_tiers?.total||0)+
        _r('Delivery',brain.delivery?.total||0)+_r('Corrugated',brain.corrugated?.total||0)+
        _r('Exchange Rates',brain.exchange_rate?.length||0);
      if(brain.exchange_rate){h+=_h('CURRENCY','RATE');(brain.exchange_rate||[]).forEach(function(er){h+=_r(er.currency_no||er.symbol||'',er.exchange_rate||er.rate||'-');});}
    } else { h=_r(node.label,''); }

    var panel=document.getElementById('brainDetailPanel');
    if(!panel){panel=document.createElement('div');panel.id='brainDetailPanel';canvas.parentElement.appendChild(panel);}
    var nc=node.color||C.cyan;
    panel.style.cssText='position:absolute;right:0;top:0;width:clamp(280px,28vw,350px);height:100%;background:rgba(4,6,12,0.95);backdrop-filter:blur(20px);border-left:1px solid '+nc+'25;padding:0;overflow-y:auto;animation:bSlide 0.3s ease;z-index:10;';
    panel.innerHTML='<style>@keyframes bSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}'+
      '#brainDetailPanel .sr{display:flex;justify-content:space-between;padding:9px 22px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:13px;color:rgba(255,255,255,0.75);transition:background 0.15s}'+
      '#brainDetailPanel .sr:hover{background:rgba(0,200,255,0.05)}'+
      '#brainDetailPanel .sr span:last-child{color:'+nc+';font-weight:600}'+
      '#brainDetailPanel .sh{display:flex;justify-content:space-between;padding:8px 22px;border-bottom:1px solid '+nc+'15;font-size:10px;color:'+nc+';font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px}</style>'+
      '<div style="padding:18px 22px;border-bottom:1px solid '+nc+'20;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:-100%;width:100%;height:2px;background:linear-gradient(90deg,transparent,'+nc+',transparent);animation:brainScan 2s linear infinite"></div>'+
        '<style>@keyframes brainScan{0%{left:-100%}100%{left:100%}}</style>'+
        '<div style="display:flex;align-items:center;gap:12px">'+
          '<div style="width:10px;height:10px;border-radius:50%;background:'+nc+';box-shadow:0 0 15px '+nc+'80"></div>'+
          '<div><div style="color:#fff;font-size:15px;font-weight:700">'+node.label+'</div>'+
          '<div style="color:rgba(255,255,255,0.35);font-size:11px">'+(node.type==='core'?'Core Intelligence':node.type==='category'?'Knowledge Category':'Data Node')+'</div></div></div>'+
        '<button onclick="document.getElementById(\'brainDetailPanel\').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'rgba(255,255,255,0.3)\'">\u2715</button>'+
      '</div><div style="padding:4px 0">'+h+'</div>';
  }

  draw();
  return { cleanup: function(){if(animFrame)cancelAnimationFrame(animFrame);window.removeEventListener('resize',_rh);var dp=document.getElementById('brainDetailPanel');if(dp)dp.remove();} };
}
