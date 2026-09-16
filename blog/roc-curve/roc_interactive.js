// Interactive ROC / assay-threshold explorer (Plotly.js, client-side).
// Loads a data JSON (exported from the Python analysis) and renders:
//  - left panel: sample assay values split by true covid status
//    (for the "primary" assay, i.e. the first one checked)
//  - middle panel: ROC curves, overlaid for every checked assay (optional)
//  - right panel: precision/recall curves, overlaid for every checked assay (optional)
// Clickable checkbox "chips" let the user select one or more assays to
// compare, and a range slider lets the user move the classification
// threshold of the primary assay.
//
// initRocWidget(container, jsonPath) runs one independent instance of the
// widget inside `container`, fetching its data from `jsonPath`. This lets
// several widgets (e.g. full data vs. an imbalanced subsample, or a
// synthetic-signals demo) share this single script with no duplicated
// logic — see the auto-boot loop at the bottom, which starts one instance
// per `.roc-interactive` element found on the page, using each container's
// `data-json` attribute.
//
// Per-widget configuration, all optional and all defaulting to the
// original behaviour (so existing real-data widgets are unaffected):
//   - container `data-show-roc="false"`: hide the ROC panel.
//   - container `data-show-pr="false"`:  hide the Precision/Recall panel.
//   - JSON `y_scale: "linear"`: use a linear assay-value / threshold axis
//     instead of the default log scale. Needed for scenarios whose values
//     can be zero or negative (e.g. a Gaussian or "ideal" toy example),
//     which are not representable on a log axis.
//   - JSON `title_prefix`: text prepended to the primary assay/signal name
//     in the plot title (defaults to "PCR test name: ").

export async function initRocWidget(container, jsonPath) {
  const plotDiv = container.querySelector('.roc-plot');
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

  // Axis-slot assignment: the scatter panel is always 'x'/'y'. When both
  // curve panels are shown, ROC uses 'x2'/'y2' and PR uses 'x3'/'y3' (the
  // original, unchanged layout). When only one curve panel is shown, it
  // takes the 'x2'/'y2' slot, so only two axes are ever defined.
  const AXIS_ROC = { x: 'x2', y: 'y2' };
  const AXIS_PR = showRoc ? { x: 'x3', y: 'y3' } : { x: 'x2', y: 'y2' };

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

      if (showRoc) {
        rocTraces.push({
          x: assay.roc_fpr, y: assay.roc_tpr, mode: 'lines',
          name: `${name} (AUC ${assay.auc.toFixed(3)})`,
          line: { color, width: 2 }, xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, legendgroup: name,
        });
        rocTraces.push({
          x: [FPR], y: [TPR], mode: 'markers', name: name + ' point',
          marker: {
            color, size: isPrimary ? 11 : 8, symbol: isPrimary ? 'circle' : 'diamond',
            line: { color: 'black', width: isPrimary ? 1 : 0 },
          },
          xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, legendgroup: name, showlegend: false,
        });
        // Theoretical (population-level) ROC curve, when the dataset
        // provides one — e.g. the synthetic gaussian/ideal/random signals,
        // which have a known closed form. Absent for real assay data, so
        // this is a no-op there.
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
            color, size: isPrimary ? 11 : 8, symbol: isPrimary ? 'circle' : 'diamond',
            line: { color: 'black', width: isPrimary ? 1 : 0 },
          },
          xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, legendgroup: name, showlegend: false,
        });
        // Theoretical (population-level) Precision-Recall curve, when the
        // dataset provides one. Each scenario's curve is exact for that
        // scenario — flat at the prevalence pi for random guessing
        // (@thm-random-pr), the closed form of @thm-gaussian-pr for the
        // Gaussian case, or the perfect-separation limit for the ideal
        // case — unlike a single generic reference line, which cannot be
        // simultaneously correct for all three. Absent for real assay
        // data, so this is a no-op there.
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
            marker: { color: 'gray', size: 11, symbol: 'x' },
            xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false,
          });
        }
        if (showPr) {
          prTraces.push({
            x: [reco.TPR], y: [recoPrecision], mode: 'markers', name: 'Reco. point',
            marker: { color: 'gray', size: 11, symbol: 'x' },
            xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: false,
          });
        }
      }
    });

    return rocTraces.concat(prTraces);
  }


  function layoutFor(assay, title, primary) {
    const panelCount = 1 + (showRoc ? 1 : 0) + (showPr ? 1 : 0);

    // Domains: reproduce the exact original 3-panel domains when both
    // curve panels are shown, so real-data widgets render pixel-identical
    // to before. Compute a simple 2-panel (or 1-panel) split otherwise.
    let scatterDomain, rocDomain, prDomain;
    if (showRoc && showPr) {
      scatterDomain = [0, 0.27];
      rocDomain = [0.365, 0.635];
      prDomain = [0.73, 1];
    } else if (panelCount === 2) {
      scatterDomain = [0, 0.45];
      const otherDomain = [0.55, 1];
      if (showRoc) rocDomain = otherDomain; else prDomain = otherDomain;
    } else {
      scatterDomain = [0, 1];
    }

    const yAxisConfig = yScale === 'linear'
      ? {
          range: [assay.ylims[0], assay.ylims[1]],
          title: { text: 'Assay result', font: { size: 12 } },
        }
      : {
          type: 'log',
          range: [Math.log10(assay.ylims[0]), Math.log10(assay.ylims[1])],
          title: { text: 'Assay result (log scale)', font: { size: 12 } },
        };

    const layout = {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      grid: { rows: 1, columns: panelCount, pattern: 'independent' },
      xaxis: {
        domain: scatterDomain, range: [-0.35, 0.95], tickvals: [0, 0.6],
        ticktext: ['Positive', 'Negative'],
        title: { text: 'True covid status (' + primary + ' only)', font: { size: 11 } },
      },
      yaxis: yAxisConfig,
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

    if (showRoc) {
      layout[AXIS_ROC.x.replace('x', 'xaxis')] = {
        domain: rocDomain, range: [-0.05, 1.05], title: { text: 'FPR', font: { size: 12 } },
      };
      layout[AXIS_ROC.y.replace('y', 'yaxis')] = {
        range: [-0.05, 1.05], scaleanchor: AXIS_ROC.x, scaleratio: 1,
        title: { text: 'TPR', font: { size: 12 } },
      };
    }
    if (showPr) {
      layout[AXIS_PR.x.replace('x', 'xaxis')] = {
        domain: prDomain, range: [-0.05, 1.05], title: { text: 'Recall', font: { size: 12 } },
      };
      layout[AXIS_PR.y.replace('y', 'yaxis')] = {
        range: [-0.05, 1.05], scaleanchor: AXIS_PR.x, scaleratio: 1,
        title: { text: 'Precision (AP = Average Precision)', font: { size: 11 } },
      };
    }

    return layout;
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
      ? titlePrefix + primary + ' (+' + (names.length - 1) + ' compared)'
      : titlePrefix + primary) + popSuffix;

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