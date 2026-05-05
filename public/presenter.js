(function () {
  const socket = io();
  let currentWords = [];
  let layoutRunning = false;
  let pendingUpdate = false;

  const svg = d3.select('#cloud-svg');
  let group = svg.append('g');
  const preliveOverlay = document.getElementById('prelive-overlay');

  // Color scale — frequency drives brightness (gray → white)
  const colorScale = d3.scaleLinear()
    .domain([1, 5])
    .range(['#666666', '#ffffff'])
    .clamp(true);

  // Glow filter for high-frequency words
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'glow');
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  function getSize() {
    return {
      w: window.innerWidth - 200,
      h: window.innerHeight,
    };
  }

  function fontSizeForCount(count) {
    return Math.min(18 + count * 7, 90);
  }

  function setLiveOverlay(isLive) {
    preliveOverlay.classList.toggle('hidden', isLive);
  }

  function renderCloud(words) {
    if (!words.length) {
      document.getElementById('empty-state').style.display = 'flex';
      group.selectAll('text').remove();
      return;
    }
    document.getElementById('empty-state').style.display = 'none';

    if (layoutRunning) {
      pendingUpdate = true;
      return;
    }

    const { w, h } = getSize();
    svg.attr('width', w).attr('height', h);
    group.attr('transform', `translate(${w / 2},${h / 2})`);
    layoutRunning = true;

    d3.layout.cloud()
      .size([w, h])
      .words(words.map(d => ({ text: d.text, size: fontSizeForCount(d.count), count: d.count })))
      .padding(8)
      .rotate(() => (Math.random() > 0.8 ? 90 : 0))
      .font('Inter, sans-serif')
      .fontWeight('700')
      .fontSize(d => d.size)
      .on('end', draw)
      .start();
  }

  function draw(computed) {
    layoutRunning = false;

    const texts = group.selectAll('text').data(computed, d => d.text);

    texts.enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '700')
      .style('fill', d => colorScale(d.count))
      .style('filter', d => d.count >= 3 ? 'url(#glow)' : 'none')
      .attr('font-size', '0px')
      .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .transition()
      .duration(600)
      .ease(d3.easeBounceOut)
      .attr('font-size', d => `${d.size}px`);

    texts
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '700')
      .transition()
      .duration(500)
      .style('fill', d => colorScale(d.count))
      .style('filter', d => d.count >= 3 ? 'url(#glow)' : 'none')
      .attr('font-size', d => `${d.size}px`)
      .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`);

    texts.exit()
      .transition()
      .duration(300)
      .attr('font-size', '0px')
      .remove();

    if (pendingUpdate) {
      pendingUpdate = false;
      renderCloud(currentWords);
    }
  }

  function updateCount(words) {
    const total = words.reduce((sum, w) => sum + w.count, 0);
    document.getElementById('word-count').textContent = total;
  }

  function clearCloud() {
    currentWords = [];
    group.selectAll('text').transition().duration(400).attr('font-size', '0px').remove();
    document.getElementById('word-count').textContent = '0';
    setTimeout(() => {
      document.getElementById('empty-state').style.display = 'flex';
    }, 450);
  }

  // ── Socket events ────────────────────────────────

  socket.on('init', ({ words, isLive }) => {
    currentWords = words;
    setLiveOverlay(isLive);
    renderCloud(words);
    updateCount(words);
  });

  socket.on('word_added', ({ words }) => {
    currentWords = words;
    renderCloud(words);
    updateCount(words);
  });

  socket.on('reset', () => clearCloud());

  socket.on('session_live', () => setLiveOverlay(true));

  socket.on('session_ended', () => {
    clearCloud();
    setLiveOverlay(false);
  });

  window.addEventListener('resize', () => {
    if (currentWords.length) renderCloud(currentWords);
  });

  // ── QR Code ──────────────────────────────────────

  const submitURL = `${window.location.origin}/submit`;

  new QRCode(document.getElementById('qr-code'), {
    text: submitURL,
    width: 140,
    height: 140,
    colorDark: '#ffffff',
    colorLight: '#1a1a1a',
    correctLevel: QRCode.CorrectLevel.M,
  });

  window.openQRFullscreen = function () {
    document.getElementById('qr-overlay-url').textContent = submitURL;
    const container = document.getElementById('qr-overlay-code');
    if (!container.firstChild) {
      new QRCode(container, {
        text: submitURL,
        width: 280,
        height: 280,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }
    document.getElementById('qr-overlay').classList.add('visible');
  };

  window.closeQRFullscreen = function () {
    document.getElementById('qr-overlay').classList.remove('visible');
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeQRFullscreen();
  });
})();
