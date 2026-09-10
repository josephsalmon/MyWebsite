// Interactive ROC / assay-threshold explorer (Plotly.js, client-side).
// Loads a data JSON (exported from the Python analysis) and renders:
//  - left panel: sample assay values (log scale) split by true covid status
//    (for the "primary" assay, i.e. the first one checked)
//  - middle panel: ROC curves, overlaid for every checked assay
//  - right panel: precision/recall curves, overlaid for every checked assay
// Clickable checkbox "chips" let the user select one or more assays to
// compare, and a range slider (mapped to log-scale) lets the user move the
// classification threshold of the primary assay.
//
// initRocWidget(container, jsonPath) runs one independent instance of the
// widget inside `container`, fetching its data from `jsonPath`. This lets
// several widgets (e.g. full data vs. an imbalanced subsample) share this
// single script with no duplicated logic — see the auto-boot loop at the
// bottom, which starts one instance per `.roc-interactive` element found
// on the page, using each container's `data-json` attribute.

export async function initRocWidget(container, jsonPath) {
  const plotDiv = container.querySelector('.roc-plot');
  const resp = await fetch(new URL(jsonPath, import.meta.url));
  if (!resp.ok) {
    plotDiv.innerHTML = '<div style="color:red;">Failed to load ' + jsonPath + '</div>';
    return;
  }
  const data = await resp.json();

  const assayNames = Object.keys(data.assays);
  const chipsDiv = container.querySelector('.roc-assay-radios');
  const thresholdSlider = container.querySelector('.roc-threshold');
  const thresholdValueLabel = container.querySelector('.roc-threshold-value');

  const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

  // Qualitative palette used to distinguish overlaid assay curves.
  const PALETTE = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
    '#ff7f00', '#a65628', '#f781bf'];
  const assayColor = {};
  assayNames.forEach((name, i) => { assayColor[name] = PALETTE[i % PALETTE.length]; });

  const defaultAssay = data.default_assay && data.assays[data.default_assay]
    ? data.default_assay
    : assayNames[0];
  const selected = new Set([defaultAssay]);

  function primaryAssay() {
    for (const name of assayNames) {
      if (selected.has(name)) return name;
    }
    return assayNames[0];
  }

  const chipEls = {};

  // Build clickable checkbox "chips"
  assayNames.forEach((name) => {
    const id = container.id + '-radio-' + name.replace(/[^a-zA-Z0-9]/g, '-');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = name;
    input.checked = selected.has(name);
    input.style.marginRight = '4px';
    input.style.cursor = 'pointer';
    input.style.transform = 'scale(0.85)';

    const label = document.createElement('label');
    label.htmlFor = id;
    const auc = data.assays[name].auc;
    label.textContent = name;
    if (typeof auc === 'number') {
      label.title = `AUC = ${auc.toFixed(3)}`;
    }
    label.style.cursor = 'pointer';
    label.style.userSelect = 'none';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';

    const chip = document.createElement('div');
    chip.style.display = 'flex';
    chip.style.alignItems = 'center';
    chip.style.padding = '2px 4px';
    chip.style.borderRadius = '4px';
    chip.style.border = '1px solid rgba(0,0,0,0.15)';
    chip.style.borderLeftWidth = '3px';
    chip.style.transition = 'background 0.15s, border-color 0.15s';
    chipEls[name] = chip;

    function refreshChipStyle() {
      const isSel = selected.has(name);
      chip.style.background = isSel ? assayColor[name] + '22' : 'transparent';
      chip.style.borderColor = isSel ? assayColor[name] : 'rgba(0,0,0,0.15)';
      chip.style.borderLeftColor = assayColor[name];
    }

    function toggle() {
      if (selected.has(name)) {
        if (selected.size > 1) selected.delete(name);
      } else {
        selected.add(name);
      }
      input.checked = selected.has(name);
      assayNames.forEach((n) => {
        const isSel = selected.has(n);
        chipEls[n].style.background = isSel ? assayColor[n] + '22' : 'transparent';
        chipEls[n].style.borderColor = isSel ? assayColor[n] : 'rgba(0,0,0,0.15)';
        chipEls[n].style.borderLeftColor = assayColor[n];
      });
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
    refreshChipStyle();
  });

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function setupThresholdSlider() {
    const assay = data.assays[primaryAssay()];
    const [lo, hi] = assay.ylims;
    thresholdSlider.min = log10(lo);
    thresholdSlider.max = log10(hi);
    thresholdSlider.step = (log10(hi) - log10(lo)) / 500;
    thresholdSlider.value = log10(assay.threshold_init);
    updateThresholdLabel();
  }

  function currentThreshold() {
    return Math.pow(10, parseFloat(thresholdSlider.value));
  }

  function updateThresholdLabel() {
    thresholdValueLabel.textContent = 'Threshold = ' + currentThreshold().toPrecision(3);
  }

  function computeCounts(assay, threshold) {
    const pos = assay.pos;
    const neg = assay.neg;
    let TP = 0, FN = 0, FP = 0, TN = 0;
    for (let i = 0; i < pos.length; i++) {
      if (pos[i] >= threshold) TP++; else FN++;
    }
    for (let i = 0; i < neg.length; i++) {
      if (neg[i] >= threshold) FP++; else TN++;
    }
    const TPR = TP / (TP + FN);
    const FPR = FP / (FP + TN);
    return { TP, FN, FP, TN, TPR, FPR };
  }

  // Plotly can fail to draw a proper legend marker swatch when a trace's
  // data arrays are completely empty (e.g. count == 0). Padding with a
  // single NaN point keeps the legend entry (with correct color/symbol)
  // always visible, without plotting anything on the chart itself.
  function ensureNonEmpty(arr) {
    const out = { x: arr.x.slice(), y: arr.y.slice() };
    if (out.x.length === 0) {
      out.x.push(NaN);
      out.y.push(NaN);
    }
    return out;
  }

  function buildScatterTraces(assay, threshold) {
    const posColor = data.colors.pos;
    const negColor = data.colors.neg;
    const xPos = data.x_pos;
    const xNeg = data.x_neg;
    const pos = assay.pos;
    const neg = assay.neg;

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
        marker: { color: posColor, size: 6, line: { color: 'black', width: 0.5 } },
        xaxis: 'x', yaxis: 'y' },
      { x: posBelowP.x, y: posBelowP.y, mode: 'markers', name: `FN (${FN})`,
        marker: { color: posColor, size: 6, symbol: 'x' },
        xaxis: 'x', yaxis: 'y' },
      { x: negAboveP.x, y: negAboveP.y, mode: 'markers', name: `FP (${FP})`,
        marker: { color: negColor, size: 6, line: { color: 'black', width: 0.5 } },
        xaxis: 'x', yaxis: 'y' },
      { x: negBelowP.x, y: negBelowP.y, mode: 'markers', name: `TN (${TN})`,
        marker: { color: negColor, size: 6, symbol: 'x' },
        xaxis: 'x', yaxis: 'y' },
      { x: [-0.3, 0.9], y: [threshold, threshold], mode: 'lines', name: 'Threshold',
        line: { color: 'black', width: 3 }, xaxis: 'x', yaxis: 'y', showlegend: true },
    ];

    if (assay.threshold_reco !== null && assay.threshold_reco !== undefined) {
      scatterTraces.push({
        x: [-0.3, 0.9], y: [assay.threshold_reco, assay.threshold_reco],
        mode: 'lines', name: 'Thr. Reco.',
        line: { color: 'gray', width: 3, dash: 'dot' }, xaxis: 'x', yaxis: 'y',
      });
    }
    return scatterTraces;
  }

  function buildComparisonTraces(names, threshold) {
    const rocTraces = [];
    const prTraces = [];

    names.forEach((name) => {
      const assay = data.assays[name];
      const color = assayColor[name];
      const isPrimary = name === names[0];
      const { TP, FP, TPR, FPR } = computeCounts(assay, threshold);
      const precision = (TP + FP) > 0 ? TP / (TP + FP) : 1.0;
      const recall = TPR;

      rocTraces.push({
        x: assay.roc_fpr, y: assay.roc_tpr, mode: 'lines',
        name: `${name} (AUC ${assay.auc.toFixed(3)})`,
        line: { color, width: 2 }, xaxis: 'x2', yaxis: 'y2', legendgroup: name,
      });
      rocTraces.push({
        x: [FPR], y: [TPR], mode: 'markers', name: name + ' point',
        marker: {
          color, size: isPrimary ? 11 : 8, symbol: isPrimary ? 'circle' : 'diamond',
          line: { color: 'black', width: isPrimary ? 1 : 0 },
        },
        xaxis: 'x2', yaxis: 'y2', legendgroup: name, showlegend: false,
      });

      prTraces.push({
        x: assay.pr_recall, y: assay.pr_precision, mode: 'lines',
        name: `${name} (AP ${assay.ap.toFixed(3)})`,
        line: { color, width: 2 }, xaxis: 'x3', yaxis: 'y3', legendgroup: name,
      });
      prTraces.push({
        x: [recall], y: [precision], mode: 'markers', name: name + ' point',
        marker: {
          color, size: isPrimary ? 11 : 8, symbol: isPrimary ? 'circle' : 'diamond',
          line: { color: 'black', width: isPrimary ? 1 : 0 },
        },
        xaxis: 'x3', yaxis: 'y3', legendgroup: name, showlegend: false,
      });

      if (isPrimary && assay.threshold_reco !== null && assay.threshold_reco !== undefined) {
        const reco = computeCounts(assay, assay.threshold_reco);
        const recoPrecision = (reco.TP + reco.FP) > 0 ? reco.TP / (reco.TP + reco.FP) : 1.0;
        rocTraces.push({
          x: [reco.FPR], y: [reco.TPR], mode: 'markers', name: 'Reco. point',
          marker: { color: 'gray', size: 11, symbol: 'x' },
          xaxis: 'x2', yaxis: 'y2', showlegend: false,
        });
        prTraces.push({
          x: [reco.TPR], y: [recoPrecision], mode: 'markers', name: 'Reco. point',
          marker: { color: 'gray', size: 11, symbol: 'x' },
          xaxis: 'x3', yaxis: 'y3', showlegend: false,
        });
      }
    });

    return rocTraces.concat(prTraces);
  }

  function layoutFor(assay, title, primary) {
    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      grid: { rows: 1, columns: 3, pattern: 'independent' },
      xaxis: {
        domain: [0, 0.27], range: [-0.35, 0.95], tickvals: [0, 0.6],
        ticktext: ['Positive', 'Negative'],
        title: { text: 'True covid status (' + primary + ' only)', font: { size: 11 } },
      },
      yaxis: {
        type: 'log', range: [Math.log10(assay.ylims[0]), Math.log10(assay.ylims[1])],
        title: { text: 'Assay result (log scale)', font: { size: 12 } },
      },
      xaxis2: {
        domain: [0.365, 0.635], range: [-0.05, 1.05],
        title: { text: 'FPR', font: { size: 12 } },
      },
      yaxis2: {
        range: [-0.05, 1.05], scaleanchor: 'x2', scaleratio: 1,
        title: { text: 'TPR', font: { size: 12 } },
      },
      xaxis3: {
        domain: [0.73, 1], range: [-0.05, 1.05],
        title: { text: 'Recall', font: { size: 12 } },
      },
      yaxis3: {
        range: [-0.05, 1.05], scaleanchor: 'x3', scaleratio: 1,
        title: { text: 'Precision (AP = Average Precision)', font: { size: 11 } },
      },
      margin: { l: 60, r: 20, t: 140, b: 55, pad: 4 },
      title: {
        text: title,
        font: { size: 20, family: FONT_FAMILY, color: '#111' },
        x: 0.5, xanchor: 'center', y: 1, yanchor: 'top', pad: { t: 0, b: 20 },
      },
      legend: {
        orientation: 'h', y: 1.1, yanchor: 'bottom', x: 0.5, xanchor: 'center',
        font: { size: 10, family: FONT_FAMILY },
      },
      height: 440,
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  function render() {
    const names = assayNames.filter((n) => selected.has(n));
    const primary = names[0];
    const assay = data.assays[primary];
    const threshold = currentThreshold();
    updateThresholdLabel();

    const popSuffix = (data.n_pos !== undefined && data.n_neg !== undefined)
      ? ` — n₊=${data.n_pos}, n₋=${data.n_neg}`
      : '';
    const title = (names.length > 1
      ? 'PCR test name: ' + primary + ' (+' + (names.length - 1) + ' compared)'
      : 'PCR test name: ' + primary) + popSuffix;

    const traces = buildScatterTraces(assay, threshold)
      .concat(buildComparisonTraces(names, threshold));
    const layout = layoutFor(assay, title, primary);
    Plotly.react(plotDiv, traces, layout, { responsive: true, displayModeBar: false });
  }

  thresholdSlider.addEventListener('input', render);

  setupThresholdSlider();
  render();
}

// Auto-boot every widget container found on the page. Each container just
// needs class="roc-interactive" plus a data-json attribute pointing at its
// own exported JSON — no per-widget <script> block needed.
document.querySelectorAll('.roc-interactive').forEach((container) => {
  initRocWidget(container, container.dataset.json || 'roc_data.json');
});