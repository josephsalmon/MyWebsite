// All Metrics Softmax Pareto Visualization
// Interactive Plotly.js visualization for PlantNet-300K softmax pareto analysis

import { getPlotlyFontConfig} from './font_utils.js';

// CSV parsing helper function
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric values
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

// Data loading and processing functions
async function loadSoftmaxData() {
  try {

    const response = await fetch(new URL('images/ALL_metrics_plantnet_softmax_pareto_DATA.csv', import.meta.url));
    if (response.ok) {
      const csvText = await response.text();
      const rawData = parseCSV(csvText);
      
      // Extract unique alpha levels and methods
      const targetAlphas = [...new Set(rawData.map(row => row.alpha))].sort((a, b) => a - b);
      const methods = [...new Set(rawData.map(row => row.method))];
      
      // Method display name mapping
      const methodMapping = {
        'standard': 'Standard',
        'prevalence-adjusted': 'PAS', 
        'classwise': 'Classwise'
      };
      
      // Method color and marker mapping
      const methodStyles = {
  'standard': { color: 'blue', symbol: 'x' }, // blue cross
        'prevalence-adjusted': { color: 'orange', symbol: 'triangle-up' },
        'classwise': { color: 'red', symbol: 'x' }
      };
      
      // Organize data by method and alpha
      const processedData = {};
      methods.forEach(method => {
        processedData[method] = {
          alphas: [],
          cov_below50: [],
          undercov_gap: [],
          macro_cov: [],
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
          processedData[method].macro_cov.push(row.macro_cov);
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
  
  // Fallback data if loading fails
  return {
    methods: ['standard', 'prevalence-adjusted', 'classwise'],
    methodMapping: {
      'standard': 'Standard',
      'prevalence-adjusted': 'Prevalence-Adjusted (PAS)',
      'classwise': 'Classwise Oracle'
    },
    methodStyles: {
      'standard': { color: 'blue', symbol: 'x' },
      'prevalence-adjusted': { color: 'orange', symbol: 'triangle-up' },
      'classwise': { color: 'red', symbol: 'x' }
    },
    processedData: {},
    targetAlphas: [0.01, 0.05, 0.1, 0.2]
  };
}

// Main initialization function
async function initializeSoftmaxViz() {
  try {
    console.log('Initializing All Metrics Softmax visualization...');

    const data = await loadSoftmaxData();

    const hasData = data.methods.some(method => {
      const methodData = data.processedData[method];
      return methodData &&
        methodData.alphas &&
        methodData.alphas.length > 0;
    });

    if (!hasData) {
      throw new Error(
        'No visualization data available. Check the CSV path and file contents.'
      );
    }

    console.log('Data loaded successfully:', data);

    await createSoftmaxPlot(data);

    console.log('Softmax visualization created successfully!');
  } catch (error) {
    console.error('Error initializing softmax visualization:', error);

    const container = document.getElementById(
      'all-metrics-softmax-container'
    );

    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:20px; color:#666;">
          <p>Error loading softmax visualization</p>
          <p style="font-size:12px;">${error.message}</p>
        </div>
      `;
    }
  }
}

async function createSoftmaxPlot(data) {
  const container = document.getElementById('all-metrics-softmax-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  const fontConfig = getPlotlyFontConfig();
  const fontFamily = fontConfig.family;
  const isMobile = window.innerWidth < 700;
  const isVeryNarrow = window.innerWidth < 420;
  // Define the metrics to plot
  const metrics = [
    { key: 'cov_below50', name: 'FracBelow50%' },
    { key: 'undercov_gap', name: 'UnderCovGap' },
    { key: 'macro_cov', name: 'MacroCov' },
    { key: 'train_marginal_cov', name: 'MarginalCov' }
  ];
  
  const traces = [];
  
  // Create traces for each method and metric combination
  for (let metricIdx = 0; metricIdx < metrics.length; metricIdx++) {
    const metric = metrics[metricIdx];

    // Alpha-based marker size strategy
    const alphaSizes = { 0.01: 14, 0.05: 12, 0.1: 10, 0.2: 8 };

    // Add legend marker for each alpha (only once, for first subplot)
  // No dummy alpha legend traces needed; legend grouping handled per method/alpha below

    data.methods.forEach((method, methodIdx) => {
      const methodData = data.processedData[method];
      if (!methodData) return;

      const style = data.methodStyles[method] || { color: 'blue', symbol: 'x' };
      const displayName = data.methodMapping[method] || method;

      // Sort by alpha for proper line connections
      const sortedIndices = methodData.alphas
        .map((alpha, idx) => ({ alpha, idx }))
        .sort((a, b) => a.alpha - b.alpha)
        .map(item => item.idx);

      const sortedAlphas = sortedIndices.map(idx => methodData.alphas[idx]);
      const sortedSetSizes = sortedIndices.map(idx => methodData.set_size[idx]);
      const sortedMetricValues = sortedIndices.map(idx => methodData[metric.key][idx]);

      // For each alpha, create a separate legend entry for each method
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

  // Add vertical dashed lines at alpha values on the 4th subplot (MarginalCov)
  data.targetAlphas.forEach(alpha => {
    // Find the y-axis range for vertical lines
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
      xaxis: 'x4',  // 4th subplot (MarginalCov)
      yaxis: 'y4',
      hovertemplate: `Target coverage: ${(1 - alpha).toFixed(3)}<br>` +
                     `(α = ${alpha})<extra></extra>`,
      showlegend: false,
      name: `Target ${1 - alpha}`
    });
  });

  // Calculate global y-axis range
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

const getResponsiveLayout = () => {
  const width = container.getBoundingClientRect().width || window.innerWidth;

  // Use the viewport width to decide the layout.
  // Use the container width to size the visualization.
  const mobile = window.innerWidth < 700;
  const narrow = window.innerWidth < 420;

  const metrics = [
    { key: 'cov_below50', name: 'FracBelow50%' },
    { key: 'undercov_gap', name: 'UnderCovGap' },
    { key: 'macro_cov', name: 'MacroCov' },
    { key: 'train_marginal_cov', name: 'MarginalCov' }
  ];

  const desktopDomains = [
    [0.00, 0.225],
    [0.255, 0.48],
    [0.51, 0.735],
    [0.765, 1.00]
  ];

  const mobileDomains = [
    [0.16, 0.47],
    [0.62, 0.98],
    [0.16, 0.47],
    [0.62, 0.98]
  ];

// Desktop: all four plots occupy the same vertical space.

// Desktop: all four plots occupy the same vertical space.
// Mobile: arrange the plots in two rows.
  const xDomains = mobile ? mobileDomains : desktopDomains;

  // Desktop: four plots in one horizontal row.
  // Mobile: two plots per row.
  const topYDomain = mobile ? [0.56, 0.94] : [0.08, 0.96];
  const bottomYDomain = mobile ? [0.12, 0.48] : [0.08, 0.96];

  const axisFontSize = narrow ? 9 : mobile ? 10 : 12;
  const titleFontSize = narrow ? 10 : mobile ? 11 : 14;

  const xAxis = (idx) => ({
    domain: xDomains[idx],
    title: {
      text: metrics[idx].name,
      font: { size: titleFontSize, family: fontFamily },
      standoff: mobile ? 6 : 10
    },
    showgrid: false,
    showline: true,
    linewidth: 1,
    linecolor: 'black',
    zeroline: false,
    ticks: 'outside',
    ticklen: mobile ? 3 : 5,
    tickfont: { size: axisFontSize },
    automargin: true,
    minor: {
      ticks: mobile ? '' : 'inside',
      ticklen: 3,
      showgrid: false
    }
  });

  const yAxis = (idx) => {
    // Show y-axis tick labels only on the leftmost plot
    // on desktop, and on the left plot of each row on mobile.
    const showLabels = mobile
      ? idx % 2 === 0
      : idx === 0;

    const isLeftmost = mobile
      ? idx === 0 || idx === 2
      : idx === 0;

    return {
      type: 'log',
      dtick: 1,
      tickmode: 'array',
      tickvals: [10, 100, 1000, 10000],
      ticktext: ['10¹', '10²', '10³', '10⁴'],
      tickformat: '10^d',
      domain: mobile
        ? (idx < 2 ? topYDomain : bottomYDomain)
        : [0.08, 0.96],
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)',
      gridwidth: 1,
      showline: isLeftmost,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: showLabels ? 'outside' : '',
      ticklen: 4,
      tickfont: { size: axisFontSize },
      showticklabels: showLabels,
      automargin: true,
      dtick: 1,
      title: isLeftmost ? {
        text: 'Average Set Size',
        font: { size: titleFontSize, family: fontFamily },
        standoff: mobile ? 4 : 10
      } : undefined
    };
  };

  return {
    title: {
      text: mobile
        ? '<b>PlantNet-300K:<br>Size vs. coverage</b>'
        : '<b>Conformal prediction for Pl@ntNet-300K:<br>size vs. coverage trade-offs</b>',
      x: 0.5,
      xanchor: 'center',
      font: {
        size: mobile ? (narrow ? 13 : 15) : 18,
        family: fontFamily
      }
    },

    grid: {
      rows: mobile ? 2 : 1,
      columns: mobile ? 2 : 4,
      pattern: 'independent',
      xgap: mobile ? 0.12 : 0.04,
      ygap: mobile ? 0.12 : 0.05
    },

    xaxis: xAxis(0),
    xaxis2: xAxis(1),
    xaxis3: xAxis(2),
    xaxis4: xAxis(3),

    yaxis: yAxis(0),
    yaxis2: yAxis(1),
    yaxis3: yAxis(2),
    yaxis4: yAxis(3),

    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: {
      family: fontFamily,
      size: mobile ? 10 : 12
    },
    height: mobile ? (narrow ? 760 : 720) : 430,

    margin: {
      t: mobile ? 55 : 75,
      r: mobile ? 8 : 15,
      b: mobile ? 100 : 110,
      l: mobile ? (narrow ? 45 : 50) : 65,
      pad: 2
    },

    legend: {
      x: 0.5,
      y: mobile ? -0.12 : -0.20,
      xanchor: 'center',
      yanchor: 'top',
      orientation: 'h',

      font: {
        size: mobile ? (narrow ? 9 : 10) : 12,
        family: fontFamily
      },

      borderwidth: 1,
      bordercolor: '#E2E2E2',
      bgcolor: 'rgba(255,255,255,0.9)',

      groupclick: 'toggleitem',
      tracegroupgap: mobile ? 4 : 10,
      itemsizing: 'constant',
      itemwidth: mobile ? 20 : 30
    },

    uirevision: 'softmax-pareto',
    autosize: true
  };
};

const layout = getResponsiveLayout();

const config = {
  displayModeBar: 'hover',
  displaylogo: false,
  modeBarButtonsToRemove: [
    'pan2d',
    'select2d',
    'lasso2d',
    'autoScale2d',
    'toggleSpikelines'
  ],
  toImageButtonOptions: {
    format: 'svg',
    filename: 'plantnet_softmax_pareto',
    height: 500,
    width: 1200,
    scale: 1
  },
  responsive: true
};

const plotEl = container;

// Draw the plot.
await Plotly.newPlot(plotEl, traces, layout, config);

// Set up responsive resizing only once.
if (!plotEl.dataset.resizeHandlerAttached) {
  let resizeTimer;
  let lastWidth = 0;

  if (container._softmaxResizeObserver) {
    container._softmaxResizeObserver.disconnect();
  }

  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(async () => {
      if (!plotEl.isConnected) return;

      const currentWidth = window.innerWidth;

      // Ignore insignificant width changes to avoid resize loops.
      if (Math.abs(currentWidth - lastWidth) < 2) return;

      lastWidth = currentWidth;

      try {
        const newLayout = getResponsiveLayout();

        await Plotly.relayout(plotEl, {
          height: newLayout.height,
          margin: newLayout.margin,
          title: newLayout.title,
          legend: newLayout.legend,
          grid: newLayout.grid,
          xaxis: newLayout.xaxis,
          xaxis2: newLayout.xaxis2,
          xaxis3: newLayout.xaxis3,
          xaxis4: newLayout.xaxis4,
          yaxis: newLayout.yaxis,
          yaxis2: newLayout.yaxis2,
          yaxis3: newLayout.yaxis3,
          yaxis4: newLayout.yaxis4
        });

        await Plotly.Plots.resize(plotEl);
      } catch (error) {
        console.error(
          'Could not resize softmax visualization:',
          error
        );
      }
    }, 200);
  });

  resizeObserver.observe(plotEl.parentElement || plotEl);

  container._softmaxResizeObserver = resizeObserver;
  plotEl.dataset.resizeHandlerAttached = 'true';
}

// Synchronize y-axis zoom across all four subplots.
let syncing = false;

plotEl.on('plotly_relayout', function (relayoutData) {
  if (syncing || !relayoutData) return;

  const keys = Object.keys(relayoutData);
  const update = {};

  const autorangeChanged = keys.some(
    key => /^yaxis\d*\.autorange$/.test(key) &&
      relayoutData[key] === true
  );

  if (autorangeChanged) {
    for (let i = 1; i <= 4; i++) {
      const axis = `yaxis${i === 1 ? '' : i}`;
      update[`${axis}.autorange`] = true;
    }
  } else {
    let range = null;

    for (let i = 1; i <= 4; i++) {
      const axis = `yaxis${i === 1 ? '' : i}`;

      const low = relayoutData[`${axis}.range[0]`];
      const high = relayoutData[`${axis}.range[1]`];
      const completeRange = relayoutData[`${axis}.range`];

      if (low !== undefined && high !== undefined) {
        range = [low, high];
        break;
      }

      if (Array.isArray(completeRange)) {
        range = completeRange;
        break;
      }
    }

    if (!range) return;

    for (let i = 1; i <= 4; i++) {
      const axis = `yaxis${i === 1 ? '' : i}`;

      update[`${axis}.range`] = range;
      update[`${axis}.autorange`] = false;
    }
  }

  syncing = true;

  Plotly.relayout(plotEl, update)
    .catch(error => {
      console.error('Could not synchronize y-axis zoom:', error);
    })
    .finally(() => {
      syncing = false;
    });
});
}

// Initialize the visualization when DOM is loaded.
document.addEventListener('DOMContentLoaded', function () {
  initializeSoftmaxViz();
});

// ES6 module exports.
export {
  loadSoftmaxData,
  createSoftmaxPlot,
  initializeSoftmaxViz
};

// CommonJS / AMD / browser exports.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadSoftmaxData,
    createSoftmaxPlot,
    initializeSoftmaxViz
  };
} else if (typeof define === 'function' && define.amd) {
  define([], function () {
    return {
      loadSoftmaxData,
      createSoftmaxPlot,
      initializeSoftmaxViz
    };
  });
} else if (typeof window !== 'undefined') {
  window.AllMetricsSoftmax = {
    loadSoftmaxData,
    createSoftmaxPlot,
    initializeSoftmaxViz
  };
}