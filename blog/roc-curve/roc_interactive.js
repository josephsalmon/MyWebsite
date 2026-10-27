// Interactive ROC / assay-threshold explorer (Plotly.js, client-side).
// [header comments unchanged — keep yours]

export async function initRocWidget(container, jsonPath) {
  const plotDiv = container.querySelector('.roc-plot');

  const STACKED = container.dataset.layout === 'stacked';
  const NATURAL_WIDTH = STACKED ? 945 : 800;
  const MIN_WIDTH = STACKED ? 340 : 360;

  const isColumn = getComputedStyle(container).flexDirection.startsWith('column');
  if (isColumn) {
    plotDiv.style.width = '100%';
    plotDiv.style.flex = '0 0 auto';
  } else {
    plotDiv.style.flex = `1 1 ${MIN_WIDTH}px`;
  }
  plotDiv.style.minWidth = '0';
  plotDiv.style.maxWidth = '100%';
  plotDiv.style.overflowX = 'auto';
  plotDiv.style.overflowY = 'hidden';

  const resp = await fetch(new URL(jsonPath, import.meta.url));
  if (!resp.ok) {
    plotDiv.innerHTML = '<div style="color:red;">Failed to load ' + jsonPath + '</div>';
    return;
  }
  const data = await resp.json();

  const showRoc = container.dataset.showRoc !== 'false';
  const showPr = container.dataset.showPr !== 'false';
  const yScale = data.y_scale === 'linear' ? 'linear' : 'log';
  const titlePrefix = data.title_prefix || 'PCR test name: ';

  const AXIS_ROC = { x: 'x2', y: 'y2' };
  const AXIS_PR = showRoc ? { x: 'x3', y: 'y3' } : { x: 'x2', y: 'y2' };

  const assayNames = Object.keys(data.assays);
  const chipsDiv = container.querySelector('.roc-assay-radios');
  const thresholdSlider = container.querySelector('.roc-threshold');
  const thresholdValueLabel = container.querySelector('.roc-threshold-value');

  const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

  // --- Theme system (defined BEFORE first use) ------------------------
  const LIGHT_THEME = {
    dark: false,
    text: '#243247', title: '#142238', muted: '#46566d', axis: '#243247',
    grid: 'rgba(30, 50, 75, 0.18)', zero: 'rgba(30, 50, 75, 0.55)',
    border: 'rgba(30, 50, 75, 0.28)', panel: 'rgba(0, 0, 0, 0.02)',
    threshold: '#142238', reco: '#46566d',
  };
  const DARK_THEME = {
    dark: true,
    text: '#e8edf5', title: '#ffffff', muted: '#c1cde0', axis: '#e8edf5',
    grid: 'rgba(220, 232, 250, 0.16)', zero: 'rgba(220, 232, 250, 0.60)',
    border: 'rgba(220, 232, 250, 0.25)', panel: 'rgba(255, 255, 255, 0.04)',
    threshold: '#f0f4fa', reco: '#c1cde0',
  };
  let THEME = { ...LIGHT_THEME };

  function parseRgba(str) {
    const m = /rgba?\(([^)]+)\)/.exec(str || '');   // FIXED: escaped \( \)
    if (!m) return null;
    const values = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (values.length < 3 || values.slice(0, 3).some(Number.isNaN)) return null;
    return {
      r: values[0], g: values[1], b: values[2],
      a: values.length > 3 && !Number.isNaN(values[3]) ? values[3] : 1,
    };
  }
  function getPageTheme(el) {
    const root = document.documentElement;
    const body = document.body;
    if (root.classList.contains('quarto-dark') || body?.classList.contains('quarto-dark')) return DARK_THEME;
    if (root.classList.contains('quarto-light') || body?.classList.contains('quarto-light')) return LIGHT_THEME;
    const themeValue = root.getAttribute('data-bs-theme') || root.getAttribute('data-theme')
      || body?.getAttribute('data-bs-theme') || body?.getAttribute('data-theme');
    if (themeValue) return themeValue.toLowerCase().includes('dark') ? DARK_THEME : LIGHT_THEME;
    for (let node = el; node; node = node.parentElement) {
      const bg = parseRgba(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0.5) {
        const luminance = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;
        return luminance < 0.5 ? DARK_THEME : LIGHT_THEME;
      }
    }
    return LIGHT_THEME;
  }
  function refreshTheme(el) {
    Object.assign(THEME, getPageTheme(el));
  }

  // --- Palette (AFTER theme detection) ---------------------------------
  const PALETTE_LIGHT = ['#000000ff', '#ff7f00', '#693775ff', '#4daf4a', '#c4769fff', '#8b8c8dff', '#377eb8'];
  const PALETTE_DARK  = ['#ffffffff', '#ff9d2e', '#9d5b8f', '#6fc76f', '#b08ad9', '#a0a2b8', '#64b5f6'];

  refreshTheme(container);

  const assayColor = {};                                   // SINGLE declaration
  function rebuildAssayColors() {
    assayNames.forEach((name, i) => {
      assayColor[name] = (THEME.dark ? PALETTE_DARK : PALETTE_LIGHT)[i % PALETTE_LIGHT.length];
    });
  }
  rebuildAssayColors();

  const defaultAssay = data.default_assay && data.assays[data.default_assay]
    ? data.default_assay : assayNames[0];
  const selected = new Set([defaultAssay]);
  let lastSelectedAssay = defaultAssay;

  function primaryAssay() {
    if (selected.has(lastSelectedAssay)) {
      return lastSelectedAssay;
    }

    return [...selected].at(-1) || assayNames[0];
  }

  const chipEls = {};

  assayNames.forEach((name) => {
    const id = container.id + '-radio-' + name.replace(/[^a-zA-Z0-9]/g, '-');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = name;
    input.checked = selected.has(name);
    input.style.marginRight = '2px';
    input.style.marginLeft = '0';
    input.style.cursor = 'pointer';
    input.style.transform = 'scale(0.75)';

    const label = document.createElement('label');
    label.htmlFor = id;
    const auc = data.assays[name].auc;
    label.textContent = name;
    if (typeof auc === 'number') label.title = `AUC = ${auc.toFixed(3)}`;
    label.style.cursor = 'pointer';
    label.style.userSelect = 'none';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';

    const chip = document.createElement('div');
    chip.style.display = 'flex';
    chip.style.alignItems = 'center';
    chip.style.padding = '1px 3px';
    chip.style.borderRadius = '4px';
    chip.style.border = `1px solid ${THEME.border}`;
    chip.style.borderLeftWidth = '3px';
    chip.style.transition = 'background 0.15s, border-color 0.15s';

    function refreshChipStyle() {
      const isSel = selected.has(name);
      chip.style.background = isSel ? assayColor[name] + '22' : 'transparent';
      chip.style.borderColor = isSel ? assayColor[name] : THEME.border;
      chip.style.borderLeftColor = assayColor[name];
    }
    chip._refresh = refreshChipStyle;         // lives INSIDE the loop

    function toggle() {
      if (selected.has(name)) {
        // Keep at least one lab selected.
        if (selected.size > 1) {
          selected.delete(name);

          // If the primary lab was deselected, choose the most
          // recently selected lab that is still active.
          if (lastSelectedAssay === name) {
            lastSelectedAssay = [...selected].at(-1);
          }
        }
      } else {
        selected.add(name);
        lastSelectedAssay = name;
      }

      input.checked = selected.has(name);

      assayNames.forEach((n) => chipEls[n]?._refresh());

      setupThresholdSlider();
      render();
    }

    input.addEventListener('change', toggle);
    chip.addEventListener('click', (evt) => {
      if (evt.target !== input) toggle();
    });

    chip.appendChild(input);
    chip.appendChild(label);
    chipsDiv.appendChild(chip);

    // Register this chip so toggle() can refresh its style.
    chipEls[name] = chip;

    refreshChipStyle();

  });

  function log10(x) { return Math.log(x) / Math.LN10; }

  function setupThresholdSlider() {
    const assay = data.assays[primaryAssay()];
    const [lo, hi] = assay.ylims;
    if (yScale === 'linear') {
      thresholdSlider.min = lo;
      thresholdSlider.max = hi;
      thresholdSlider.step = (hi - lo) / 500;
      thresholdSlider.value = assay.threshold_init;
    } else {
      thresholdSlider.min = log10(lo);
      thresholdSlider.max = log10(hi);
      thresholdSlider.step = (log10(hi) - log10(lo)) / 500;
      thresholdSlider.value = log10(assay.threshold_init);
    }
    updateThresholdLabel();
  }

  function currentThreshold() {
    const v = parseFloat(thresholdSlider.value);
    return yScale === 'linear' ? v : Math.pow(10, v);
  }

  function updateThresholdLabel() {
    thresholdValueLabel.textContent = 'Threshold = ' + currentThreshold().toPrecision(3);
  }

  function computeCounts(assay, threshold) {
    const pos = assay.pos, neg = assay.neg;
    let TP = 0, FN = 0, FP = 0, TN = 0;
    for (let i = 0; i < pos.length; i++) { if (pos[i] >= threshold) TP++; else FN++; }
    for (let i = 0; i < neg.length; i++) { if (neg[i] >= threshold) FP++; else TN++; }
    return { TP, FN, FP, TN, TPR: TP / (TP + FN), FPR: FP / (FP + TN) };
  }

  function ensureNonEmpty(arr) {
    const out = { x: arr.x.slice(), y: arr.y.slice() };
    if (out.x.length === 0) { out.x.push(NaN); out.y.push(NaN); }
    return out;
  }

  // --- Responsive sizing (unchanged from your version) ----------------
  const MARGIN_L = 60, MARGIN_R = 20, MARGIN_B = 55;
  const MIN_GAP_PX_3 = 52, SCATTER_RATIO = 0.8, MIN_GAP_PX_2 = 58;
  const marginTop = (scale) => Math.round(165 + 60 * (1 - scale));

  function computePlotSize() {
    const measured = plotDiv.getBoundingClientRect().width;
    const available = measured > 0 ? measured : NATURAL_WIDTH;
    const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));
    const scale = width / NATURAL_WIDTH;
    const plotAreaW = width - MARGIN_L - MARGIN_R;

    let side, plotH;
    let scatterDomain, rocDomain, prDomain;
    let rocY = null, prY = null;
    const stacked = STACKED && showRoc && showPr;

    if (stacked) {
      const gap = Math.max(40, 0.06 * plotAreaW);
      const vgap = 48;
      side = Math.min(0.45 * plotAreaW, 252);
      plotH = 2 * side + vgap;
      const f = side / plotAreaW;
      const g = gap / plotAreaW;
      scatterDomain = [0, 1 - f - g];
      rocDomain = [1 - f, 1];
      prDomain = [1 - f, 1];
      rocY = [(side + vgap) / plotH, 1];
      prY = [0, side / plotH];
    } else if (showRoc && showPr) {
      const gap = Math.max(MIN_GAP_PX_3, 0.095 * plotAreaW);
      side = (plotAreaW - 2 * gap) / (2 + SCATTER_RATIO);
      const f = side / plotAreaW;
      const g = gap / plotAreaW;
      const s = SCATTER_RATIO * f;
      scatterDomain = [0, s];
      rocDomain = [s + g, s + g + f];
      prDomain = [1 - f, 1];
    } else if (showRoc || showPr) {
      const gap = Math.max(MIN_GAP_PX_2, 0.1 * plotAreaW);
      side = Math.min(0.45 * plotAreaW, 320);
      const f = side / plotAreaW;
      const g = gap / plotAreaW;
      scatterDomain = [0, 1 - f - g];
      const curveDomain = [1 - f, 1];
      if (showRoc) rocDomain = curveDomain; else prDomain = curveDomain;
    } else {
      side = Math.min(0.6 * plotAreaW, 320);
      scatterDomain = [0, 1];
    }

    if (plotH === undefined) plotH = side;
    const top = marginTop(scale);
    const height = Math.round(plotH + top + MARGIN_B);

    return { width, height, scale, top, scatterDomain, rocDomain, prDomain, rocY, prY, stacked };
  }

  function buildScatterTraces(assay, threshold, scale) {
    const posColor = data.colors.pos;
    const negColor = data.colors.neg;
    const xPos = data.x_pos;
    const xNeg = data.x_neg;
    const pos = assay.pos;
    const neg = assay.neg;
    const ms = Math.max(3, 6 * scale);

    const posAbove = { x: [], y: [] }, posBelow = { x: [], y: [] };
    const negAbove = { x: [], y: [] }, negBelow = { x: [], y: [] };

    for (let i = 0; i < pos.length; i++) {
      if (pos[i] >= threshold) { posAbove.x.push(xPos[i]); posAbove.y.push(pos[i]); }
      else { posBelow.x.push(xPos[i]); posBelow.y.push(pos[i]); }
    }
    for (let i = 0; i < neg.length; i++) {
      if (neg[i] >= threshold) { negAbove.x.push(xNeg[i]); negAbove.y.push(neg[i]); }
      else { negBelow.x.push(xNeg[i]); negBelow.y.push(neg[i]); }
    }

    const { TP, FN, FP, TN } = computeCounts(assay, threshold);

    const posAboveP = ensureNonEmpty(posAbove);
    const posBelowP = ensureNonEmpty(posBelow);
    const negAboveP = ensureNonEmpty(negAbove);
    const negBelowP = ensureNonEmpty(negBelow);

    const scatterTraces = [
      { x: posAboveP.x, y: posAboveP.y, mode: 'markers', name: `TP (${TP})`,
        marker: { color: posColor, size: ms, line: { color: THEME.axis, width: 0.5 } },
        xaxis: 'x', yaxis: 'y' },
      { x: posBelowP.x, y: posBelowP.y, mode: 'markers', name: `FN (${FN})`,
        marker: { color: posColor, size: ms, symbol: 'x' },
        xaxis: 'x', yaxis: 'y' },
      { x: negAboveP.x, y: negAboveP.y, mode: 'markers', name: `FP (${FP})`,
        marker: { color: negColor, size: ms, line: { color: THEME.axis, width: 0.5 } },
        xaxis: 'x', yaxis: 'y' },
      { x: negBelowP.x, y: negBelowP.y, mode: 'markers', name: `TN (${TN})`,
        marker: { color: negColor, size: ms, symbol: 'x' },
        xaxis: 'x', yaxis: 'y' },
      { x: [-0.3, 0.9], y: [threshold, threshold], mode: 'lines', name: 'Threshold',
        line: { color: THEME.threshold, width: 3 }, xaxis: 'x', yaxis: 'y', showlegend: true },
    ];

    if (assay.threshold_reco !== null && assay.threshold_reco !== undefined) {
      scatterTraces.push({
        x: [-0.3, 0.9], y: [assay.threshold_reco, assay.threshold_reco],
        mode: 'lines', name: 'Thr. Reco.',
        line: { color: THEME.reco, width: 3, dash: 'dot' },
        xaxis: 'x', yaxis: 'y',
      });
    }

    return scatterTraces;
  }

  function buildComparisonTraces(names, threshold, scale) {
    const rocTraces = [], prTraces = [];
    const sizePrimary = Math.max(7, 11 * scale);
    const sizeOther = Math.max(5, 8 * scale);

    names.forEach((name) => {
      const assay = data.assays[name];
      const color = assayColor[name];
      const isPrimary = name === names[0];
      const { TP, FP, TPR, FPR } = computeCounts(assay, threshold);
      const precision = (TP + FP) > 0 ? TP / (TP + FP) : 1.0;
      const recall = TPR;

      if (showRoc) {
        rocTraces.push({
          x: assay.roc_fpr, y: assay.roc_tpr, mode: 'lines',
          name: `${name} (AUC ${assay.auc.toFixed(3)})`,
          line: { color, width: 2 }, xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, legendgroup: name,
        });
        rocTraces.push({
          x: [FPR], y: [TPR], mode: 'markers', name: name + ' point',
          marker: {
            color, size: isPrimary ? sizePrimary : sizeOther,
            symbol: isPrimary ? 'circle' : 'diamond',
            line: { color: THEME.axis, width: isPrimary ? 1 : 0 },   // was 'black'
          },
          xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, legendgroup: name, showlegend: false,
        });
        if (assay.roc_fpr_theory && assay.roc_tpr_theory) {
          rocTraces.push({
            x: assay.roc_fpr_theory, y: assay.roc_tpr_theory, mode: 'lines',
            name: `${name} (theoretical)`,
            line: { color, width: 1.5, dash: 'dash' },
            xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, legendgroup: name,
          });
        }
      }

      if (showPr) {
        prTraces.push({
          x: assay.pr_recall, y: assay.pr_precision, mode: 'lines',
          name: `${name} (AP ${assay.ap.toFixed(3)})`,
          line: { color, width: 2 }, xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, legendgroup: name,
        });
        prTraces.push({
          x: [recall], y: [precision], mode: 'markers', name: name + ' point',
          marker: {
            color, size: isPrimary ? sizePrimary : sizeOther,
            symbol: isPrimary ? 'circle' : 'diamond',
            line: { color: THEME.axis, width: isPrimary ? 1 : 0 },   // was 'black'
          },
          xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, legendgroup: name, showlegend: false,
        });
        if (assay.pr_recall_theory && assay.pr_precision_theory) {
          prTraces.push({
            x: assay.pr_recall_theory, y: assay.pr_precision_theory, mode: 'lines',
            name: `${name} (theoretical)`,
            line: { color, width: 1.5, dash: 'dash' },
            xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, legendgroup: name,
          });
        }
      }

      if (isPrimary && assay.threshold_reco !== null && assay.threshold_reco !== undefined) {
        const reco = computeCounts(assay, assay.threshold_reco);
        const recoPrecision = (reco.TP + reco.FP) > 0 ? reco.TP / (reco.TP + reco.FP) : 1.0;
        if (showRoc) {
          rocTraces.push({
            x: [reco.FPR], y: [reco.TPR], mode: 'markers', name: 'Reco. point',
            marker: { color: THEME.reco, size: sizePrimary, symbol: 'x' },
            xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false,
          });
        }
        if (showPr) {
          prTraces.push({
            x: [reco.TPR], y: [recoPrecision], mode: 'markers', name: 'Reco. point',
            marker: { color: THEME.reco, size: sizePrimary, symbol: 'x' },
            xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: false,
          });
        }
      }
    });

    return rocTraces.concat(prTraces);
  }

  function layoutFor(assay, title, primary, size) {
    const panelCount = 1 + (showRoc ? 1 : 0) + (showPr ? 1 : 0);
    const { width, height, scale, top, scatterDomain, rocDomain, prDomain, rocY, prY, stacked } = size;

    const yAxisConfig = yScale === 'linear'
      ? { range: [assay.ylims[0], assay.ylims[1]],
          title: { text: 'Assay result', font: { size: 12 } } }
      : { type: 'log',
          range: [Math.log10(assay.ylims[0]), Math.log10(assay.ylims[1])],
          title: { text: 'Assay result (log scale)', font: { size: 12 } } };

    const axisFont = (s) => ({ family: FONT_FAMILY, size: s, color: THEME.text });

    const layout = {
      font: { family: FONT_FAMILY, size: 12, color: THEME.text },
      grid: { rows: 1, columns: panelCount, pattern: 'independent' },
      xaxis: {
        domain: scatterDomain, range: [-0.35, 0.95], tickvals: [0, 0.6],
        ticktext: ['Positive', 'Negative'],
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
        title: { text: 'True covid status (' + primary + ' only)', font: axisFont(11) },
      },
      yaxis: {
        ...yAxisConfig,
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
      },
      margin: { l: MARGIN_L, r: MARGIN_R, t: top, b: MARGIN_B, pad: 4 },   // RESTORED
      title: {
        text: title,
        font: {
          size: Math.max(13, Math.round(20 * scale)),
          family: FONT_FAMILY,
          color: THEME.title,
        },
        x: 0.5,
        xanchor: 'center',
        y: 0.96,
        yanchor: 'top',
        pad: { t: 8, b: 12 },
      },
      legend: {
        orientation: 'h', y: 1.1, yanchor: 'bottom', x: 0.5, xanchor: 'center',
        font: { size: scale < 0.8 ? 9 : 10, family: FONT_FAMILY, color: THEME.text },
      },
      width, height,                                    // RESTORED — without
      paper_bgcolor: 'rgba(0,0,0,0)',                  // these the plot
      plot_bgcolor: 'rgba(0,0,0,0)',                   // breaks sizing
    };

    if (showRoc) {
      layout[AXIS_ROC.x.replace('x', 'xaxis')] = {
        domain: rocDomain, range: [-0.05, 1.05],
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
        title: { text: 'FPR', font: axisFont(12) },
      };
      layout[AXIS_ROC.y.replace('y', 'yaxis')] = {
        range: [-0.05, 1.05], scaleanchor: AXIS_ROC.x, scaleratio: 1,
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
        title: { text: 'TPR', font: axisFont(12) },
      };
    }
    if (showPr) {
      layout[AXIS_PR.x.replace('x', 'xaxis')] = {
        domain: prDomain, range: [-0.05, 1.05],
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
        title: { text: 'Recall', font: axisFont(12) },
      };
      layout[AXIS_PR.y.replace('y', 'yaxis')] = {
        range: [-0.05, 1.05], scaleanchor: AXIS_PR.x, scaleratio: 1,
        color: THEME.axis, gridcolor: THEME.grid, zerolinecolor: THEME.zero,
        tickfont: { family: FONT_FAMILY, size: 11, color: THEME.text },
        title: { text: 'Precision (AP = Average Precision)', font: axisFont(scale < 0.8 ? 10 : 11) },
      };
    }

    if (stacked) {
      delete layout.grid;
      layout.xaxis.anchor = 'y';
      layout.yaxis.anchor = 'x';
      layout.yaxis.domain = [0, 1];
      Object.assign(layout.xaxis2, { anchor: 'y2' });
      Object.assign(layout.yaxis2, { anchor: 'x2', domain: rocY });
      Object.assign(layout.xaxis3, { anchor: 'y3' });
      Object.assign(layout.yaxis3, { anchor: 'x3', domain: prY });
    }

    return layout;
  }

  function updateControlTheme() {
    rebuildAssayColors();
    container.style.setProperty('color', THEME.text, 'important');
    container.style.setProperty('font-family', FONT_FAMILY, 'important');
    Object.values(chipEls).forEach((chip) => chip._refresh());
    container.querySelectorAll('div, span, label').forEach((el) => {
      el.style.setProperty('font-family', FONT_FAMILY, 'important');
    });
    thresholdValueLabel.style.setProperty('color', THEME.muted, 'important');
    thresholdSlider.style.setProperty('accent-color', '#1769aa', 'important');
  }

  // --- Render (was MISSING from your version) ---------------------------
  let lastWidth = null;

  function render() {
    const names = assayNames.filter((n) => selected.has(n));
    const primary = primaryAssay();
    const orderedNames = [
          primary,
          ...names.filter((n) => n !== primary),
        ];
    const assay = data.assays[primary];
    const threshold = currentThreshold();
    updateThresholdLabel();

    const size = computePlotSize();
    lastWidth = size.width;

    const popSuffix = (data.n_pos !== undefined && data.n_neg !== undefined)
      ? ` — n₁=${data.n_pos}, n₀=${data.n_neg}` : '';
    const title = (names.length > 1
      ? titlePrefix + primary + ' (+' + (names.length - 1) + ' compared)'
      : titlePrefix + primary) + popSuffix;

    const traces = buildScatterTraces(assay, threshold, size.scale)
      .concat(buildComparisonTraces(orderedNames, threshold, size.scale));
    const layout = layoutFor(assay, title, primary, size);
    Plotly.react(plotDiv, traces, layout, { displayModeBar: false });
  }

  // --- Init, theme observer, resize observer (single sequence) ----------
  refreshTheme(container);
  updateControlTheme();
  setupThresholdSlider();
  render();

  let renderedDark = THEME.dark;
  const themeObserver = new MutationObserver(() => {
    refreshTheme(container);
    if (THEME.dark !== renderedDark) {
      renderedDark = THEME.dark;
      updateControlTheme();
      render();
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true, attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
  });
  themeObserver.observe(document.body, {
    attributes: true, attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
  });
  container._rocThemeObserver = themeObserver;

  thresholdSlider.addEventListener('input', render);

  const ro = new ResizeObserver(() => {
    if (computePlotSize().width !== lastWidth) render();
  });
  ro.observe(container);
  ro.observe(plotDiv);
  container._rocResizeObserver = ro;
}

document.querySelectorAll('.roc-interactive').forEach((container) => {
  initRocWidget(container, container.dataset.json || 'roc_data.json');
});