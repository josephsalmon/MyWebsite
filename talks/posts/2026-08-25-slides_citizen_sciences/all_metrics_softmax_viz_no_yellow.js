import { getPlotlyFontConfig, applyDocumentFont } from './font_utils.js';

function parseCSV_NoYellow(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        row[header] = parseFloat(value);
      } else {
        row[header] = value;
      }
    });
    data.push(row);
  }

  return data;
}

async function loadSoftmaxData_NoYellow() {
  try {
    const response = await fetch(new URL('ALL_metrics_plantnet_softmax_pareto_DATA.csv', import.meta.url));
    if (response.ok) {
      const csvText = await response.text();
      const rawData = parseCSV_NoYellow(csvText);

      const targetAlphas = [...new Set(rawData.map(row => row.alpha))].sort((a, b) => a - b);
      const methods = [...new Set(rawData.map(row => row.method))].filter(m => m !== 'prevalence-adjusted');

      const methodMapping = {
        'standard': 'Standard',
        'classwise': 'Classwise'
      };

      const methodStyles = {
        'standard': { color: 'blue', symbol: 'x' },
        'classwise': { color: 'red', symbol: 'x' }
      };

      const processedData = {};
      methods.forEach(method => {
        processedData[method] = {
          alphas: [],
          cov_below50: [],
          undercov_gap: [],
          train_marginal_cov: [],
          set_size: []
        };
      });

      rawData.forEach(row => {
        const method = row.method;
        if (processedData[method]) {
          processedData[method].alphas.push(row.alpha);
          processedData[method].cov_below50.push(row.cov_below50);
          processedData[method].undercov_gap.push(row.undercov_gap);
          processedData[method].train_marginal_cov.push(row.train_marginal_cov);
          processedData[method].set_size.push(row.set_size);
        }
      });

      return {
        methods,
        methodMapping,
        methodStyles,
        processedData,
        targetAlphas
      };
    }
  } catch (error) {
    console.warn('Could not load softmax data:', error);
  }

  return {
    methods: ['standard', 'classwise'],
    methodMapping: {
      'standard': 'Standard',
      'classwise': 'Classwise Oracle'
    },
    methodStyles: {
      'standard': { color: 'blue', symbol: 'x' },
      'classwise': { color: 'red', symbol: 'x' }
    },
    processedData: {},
    targetAlphas: [0.01, 0.05, 0.1, 0.2]
  };
}

async function initializeSoftmaxViz_NoYellow() {
  try {
    console.log('Initializing All Metrics Softmax visualization (No Yellow)...');
    const data = await loadSoftmaxData_NoYellow();
    console.log('Data loaded successfully:', data);
    await createSoftmaxPlot_NoYellow(data);
    console.log('Softmax visualization (No Yellow) created successfully!');
  } catch (error) {
    console.error('Error initializing softmax visualization:', error);
    const container = document.getElementById('all-metrics-softmax-container-2');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>Error loading softmax visualization</p>
          <p style="font-size: 12px;">${error.message}</p>
        </div>
      `;
    }
  }
}

async function createSoftmaxPlot_NoYellow(data) {
  const container = document.getElementById('all-metrics-softmax-container-2');
  if (!container) {
    console.error('Container element not found: all-metrics-softmax-container-2');
    return;
  }

  const fontConfig = getPlotlyFontConfig();
  const fontFamily = fontConfig.family;

  const metrics = [
    { key: 'cov_below50', name: 'FracBelow50%' },
    { key: 'train_marginal_cov', name: 'MarginalCov' }
  ];

  const traces = [];

  for (let metricIdx = 0; metricIdx < metrics.length; metricIdx++) {
    const metric = metrics[metricIdx];
    const alphaSizes = { 0.01: 14, 0.05: 12, 0.1: 10, 0.2: 8 };

    data.methods.forEach((method, methodIdx) => {
      const methodData = data.processedData[method];
      if (!methodData) return;

      const style = data.methodStyles[method] || { color: 'blue', symbol: 'x' };
      const displayName = data.methodMapping[method] || method;

      const sortedIndices = methodData.alphas
        .map((alpha, idx) => ({ alpha, idx }))
        .sort((a, b) => a.alpha - b.alpha)
        .map(item => item.idx);

      const sortedAlphas = sortedIndices.map(idx => methodData.alphas[idx]);
      const sortedSetSizes = sortedIndices.map(idx => methodData.set_size[idx]);
      const sortedMetricValues = sortedIndices.map(idx => methodData[metric.key][idx]);

      sortedAlphas.forEach((alpha, idx) => {
        traces.push({
          x: [sortedMetricValues[idx]],
          y: [sortedSetSizes[idx]],
          type: 'scatter',
          mode: 'markers',
          name: `${displayName}`,
          marker: {
            symbol: style.symbol,
            size: alphaSizes[alpha] || 10,
            color: style.color,
            line: { width: 1, color: 'white' }
          },
          xaxis: `x${metricIdx + 1}`,
          yaxis: metricIdx === 0 ? 'y' : `y${metricIdx + 1}`,
          hovertemplate: `<b>${displayName}</b><br>` +
                         `Alpha: ${alpha}<br>` +
                         `${metric.name}: %{x:.3f}<br>` +
                         'Set Size: %{y:.2f}<extra></extra>',
          showlegend: metricIdx === 0,
          legendgroup: `α=${alpha}`,
          legendgrouptitle: metricIdx === 0 ? { text: `           α = ${alpha}`, font: { size: 12, family: fontFamily } } : undefined,
          customdata: { method: method, alpha: alpha, subplot: metricIdx }
        });
      });
    });
  }

  data.targetAlphas.forEach(alpha => {
    let allSetSizesForLines = [];
    data.methods.forEach(method => {
      const methodData = data.processedData[method];
      if (methodData) {
        allSetSizesForLines.push(...methodData.set_size);
      }
    });

    const maxSetSizeForLines = Math.max(...allSetSizesForLines);
    const minSetSizeForLines = Math.min(...allSetSizesForLines);

    traces.push({
      x: [1 - alpha, 1 - alpha],
      y: [minSetSizeForLines * 0.5, maxSetSizeForLines * 2],
      type: 'scatter',
      mode: 'lines',
      line: {
        color: 'grey',
        width: 1,
        dash: 'dash'
      },
      xaxis: 'x2',
      yaxis: 'y2',
      hovertemplate: `Target coverage: ${(1 - alpha).toFixed(3)}<br>` +
                     `(α = ${alpha})<extra></extra>`,
      showlegend: false,
      name: `Target ${1 - alpha}`
    });
  });

  let allSetSizes = [];
  data.methods.forEach(method => {
    const methodData = data.processedData[method];
    if (methodData) {
      allSetSizes.push(...methodData.set_size);
    }
  });

  const maxSetSize = Math.max(...allSetSizes);
  const minSetSize = Math.min(...allSetSizes);
  const setRange = [Math.max(0, minSetSize * 0.9), maxSetSize * 1.1];

  const layout = {
    title: {
      text: '<b>Conformal prediction for Pl@ntNet-300K:<br>size vs. coverage trade-offs</b>',
      x: 0.5,
      font: {
        size: 18,
        family: fontFamily
      }
    },

    xaxis: {
      domain: [0, 0.45],
      title: { text: metrics[0].name, font: { size: 14, family: fontFamily } },
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: 'outside',
      ticklen: 5,
      minor: { ticks: 'inside', ticklen: 3, showgrid: false }
    },
    xaxis2: {
      domain: [0.55, 1.0],
      title: { text: metrics[1].name, font: { size: 14, family: fontFamily } },
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: 'outside',
      ticklen: 5,
      minor: { ticks: 'inside', ticklen: 3, showgrid: false }
    },

    yaxis: {
      title: { text: 'Average Set Size', font: { size: 14, family: fontFamily } },
      type: 'log',
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)',
      gridwidth: 1,
      showline: true,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: 'outside',
      ticklen: 5,
      minor: { ticks: 'inside', ticklen: 3, showgrid: false },
      dtick: 1
    },
    yaxis2: {
      type: 'log',
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)',
      gridwidth: 1,
      showline: false,
      zeroline: false,
      ticks: '',
      showticklabels: false,
      dtick: 1
    },

    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: { family: fontFamily },

    margin: { t: 60, r: 20, b: 100, l: 60 },
    height: 400,

    legend: {
      x: 0.5,
      y: -0.4,
      xanchor: 'center',
      yanchor: 'top',
      orientation: 'h',
      font: { size: 12, family: fontFamily },
      borderwidth: 1,
      bordercolor: '#E2E2E2',
      bgcolor: 'rgba(255,255,255,0.8)',
      groupclick: "toggleitem",
      tracegroupgap: 20,
      itemsizing: 'trace',
      itemwidth: 30
    }
  };

  const config = {
    displayModeBar: 'hover',
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
    toImageButtonOptions: {
      format: 'svg',
      filename: 'plantnet_softmax_pareto',
      height: 500,
      width: 1200,
      scale: 1
    },
    responsive: true
  };

  await Plotly.newPlot('all-metrics-softmax-container-2', traces, layout, config);

  (function() {
    const plotId = 'all-metrics-softmax-container-2';
    let syncing = false;

    const plotEl = document.getElementById(plotId);
    if (!plotEl) return;

    plotEl.on('plotly_relayout', function(relayoutData) {
      if (syncing) return;
      if (!relayoutData || Object.keys(relayoutData).length === 0) return;

      const yAxisKeys = Object.keys(relayoutData).filter(k => k.startsWith('yaxis'));
      if (yAxisKeys.length === 0) return;

      const update = {};

      const autorangeKey = yAxisKeys.find(k => k.endsWith('.autorange'));
      if (autorangeKey) {
        for (let i = 1; i <= 2; i++) {
          const key = i === 1 ? 'yaxis.autorange' : `yaxis${i}.autorange`;
          update[key] = true;
        }
      } else {
        let foundRange = null;
        for (const k of yAxisKeys) {
          const base = k.split('.')[0];
          const r0 = relayoutData[`${base}.range[0]`];
          const r1 = relayoutData[`${base}.range[1]`];
          if (typeof r0 !== 'undefined' && typeof r1 !== 'undefined') {
            foundRange = [r0, r1];
            break;
          }
        }

        if (!foundRange) return;

        for (let i = 1; i <= 2; i++) {
          const key0 = i === 1 ? 'yaxis.range[0]' : `yaxis${i}.range[0]`;
          const key1 = i === 1 ? 'yaxis.range[1]' : `yaxis${i}.range[1]`;
          update[key0] = foundRange[0];
          update[key1] = foundRange[1];
        }
      }

      syncing = true;
      Plotly.relayout(plotId, update)
        .then(() => { syncing = false; })
        .catch(() => { syncing = false; });
    });
  })();
}

document.addEventListener('DOMContentLoaded', function() {
  initializeSoftmaxViz_NoYellow();
});

export { loadSoftmaxData_NoYellow, createSoftmaxPlot_NoYellow, initializeSoftmaxViz_NoYellow };