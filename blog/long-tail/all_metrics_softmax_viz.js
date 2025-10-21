// All Metrics Softmax Pareto Visualization
// Interactive Plotly.js visualization for PlantNet-300K softmax pareto analysis

import { getPlotlyFontConfig, applyDocumentFont } from './font_utils.js';

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
    // Load the CSV data
    const response = await fetch('images/ALL_metrics_plantnet_softmax_pareto_DATA.csv');
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
    
    // Load the data
    const data = await loadSoftmaxData();
    console.log('Data loaded successfully:', data);
    
    // Create the main plot
    await createSoftmaxPlot(data);
    console.log('Softmax visualization created successfully!');
    
  } catch (error) {
    console.error('Error initializing softmax visualization:', error);
    
    // Show error message in the container
    const container = document.getElementById('all-metrics-softmax-container');
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

async function createSoftmaxPlot(data) {
  const container = document.getElementById('all-metrics-softmax-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  const fontConfig = getPlotlyFontConfig();
  const fontFamily = fontConfig.family;
  
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

  const layout = {
    title: {
      text: '<b>Conformal prediction for Pl@ntNet-300K:<br>size vs. coverage trade-offs</b>',
      x: 0.5,
      font: { 
        size: 18, 
        family: fontFamily
      }
    },
    
    // X-axis configurations for 4 metric subplots
    xaxis: {
      domain: [0, 0.22],
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
      domain: [0.26, 0.48],
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
    xaxis3: {
      domain: [0.52, 0.74],
  title: { text: metrics[2].name, font: { size: 14, family: fontFamily } },
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: 'outside',
      ticklen: 5,
      minor: { ticks: 'inside', ticklen: 3, showgrid: false }
    },
    xaxis4: {
      domain: [0.78, 1.0],
  title: { text: metrics[3].name, font: { size: 14, family: fontFamily } },
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: 'black',
      zeroline: false,
      ticks: 'outside',
      ticklen: 5,
      minor: { ticks: 'inside', ticklen: 3, showgrid: false }
    },
    
    // Y-axis (only shown for leftmost subplot)
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
      dtick: 1  // Show grid lines only at powers of 10
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
    yaxis3: {
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
    yaxis4: {
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
    
    // Clean layout styling
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: { family: fontFamily },
    
    margin: { t: 60, r: 20, b: 100, l: 60 },
    height: 400,
    
    // Legend configuration (organized by alpha groups, methods linked across all subplots)
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

  await Plotly.newPlot('all-metrics-softmax-container', traces, layout, config);
  
  // Synchronize y-axis ranges across subplots when zooming/panning any subplot
  (function() {
    const plotId = 'all-metrics-softmax-container';
    let syncing = false;

    const plotEl = document.getElementById(plotId);
    if (!plotEl) return;

    plotEl.on('plotly_relayout', function(relayoutData) {
      if (syncing) return;
      if (!relayoutData || Object.keys(relayoutData).length === 0) return;

      // Collect any yaxis keys changed
      const yAxisKeys = Object.keys(relayoutData).filter(k => k.startsWith('yaxis'));
      if (yAxisKeys.length === 0) return;

      const update = {};

      // Check for autorange change
      const autorangeKey = yAxisKeys.find(k => k.endsWith('.autorange'));
      if (autorangeKey) {
        for (let i = 1; i <= 4; i++) {
          const key = i === 1 ? 'yaxis.autorange' : `yaxis${i}.autorange`;
          update[key] = true;
        }
      } else {
        // Find a full range in relayoutData
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

        for (let i = 1; i <= 4; i++) {
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

// Initialize the visualization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeSoftmaxViz();
});

// Module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    createSoftmaxPlot,
    initializeSoftmaxViz
  };
} else if (typeof define === 'function' && define.amd) {
  define([], function() { 
    return { 
      createSoftmaxPlot,
      initializeSoftmaxViz
    }; 
  });
} else {
  // Browser global
  window.AllMetricsSoftmax = { 
    createSoftmaxPlot,
    initializeSoftmaxViz
  };
}
