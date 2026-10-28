// PlantNet Conformal Prediction Comparison Visualization
// Responsive Plotly.js implementation.
//
// Desktop: 4 plots in one row.
// Mobile: 4 plots stacked vertically.
// Features:
// - Six prediction methods
// - Alpha-specific marker sizes and opacity
// - WPAS connecting lines
// - Target-coverage lines on Marginal Coverage
// - Compact, method-based legend
// - Shared linear y-axis range and synchronized zoom
// - Responsive resizing
// - Robust CSV parsing and visible error messages

import { getPlotlyFontConfig } from './font_utils.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const CONTAINER_ID = 'plantnet-comparison-container';

const CSV_PATH = 'images/plantnet_conformal_comparison_data.csv';

const METHOD_ORDER = [
  'standard',
  'prevalence-adjusted',
  'WPAS ($\\gamma=$ 1)',
  'WPAS ($\\gamma=$ 10)',
  'WPAS ($\\gamma=$ 100)',
  'WPAS ($\\gamma=$ 1000)'
];

const METHOD_MAPPING = {
  'standard': 'Standard',
  'prevalence-adjusted': 'PAS',
  'WPAS ($\\gamma=$ 1)': 'WPAS γ=1',
  'WPAS ($\\gamma=$ 10)': 'WPAS γ=10',
  'WPAS ($\\gamma=$ 100)': 'WPAS γ=100',
  'WPAS ($\\gamma=$ 1000)': 'WPAS γ=1000'
};

const METHOD_STYLES = {
  'Standard': {
    color: '#1f77b4',
    symbol: 'x'
  },
  'PAS': {
    color: '#ff7f0e',
    symbol: 'triangle-up'
  },
  'WPAS γ=1': {
    color: '#2ca02c',
    symbol: 'star'
  },
  'WPAS γ=10': {
    color: '#2ca02c',
    symbol: 'star'
  },
  'WPAS γ=100': {
    color: '#2ca02c',
    symbol: 'star'
  },
  'WPAS γ=1000': {
    color: '#2ca02c',
    symbol: 'star'
  }
};

const ALPHA_STYLES = {
  0.01: { size: 13, opacity: 1.00 },
  0.05: { size: 11, opacity: 0.85 },
  0.10: { size: 9, opacity: 0.70 },
  0.20: { size: 7, opacity: 0.55 }
};

const METRICS = [
  {
    key: 'at_risk_avg_coverage',
    label: 'At-risk average coverage'
  },
  {
    key: 'not_at_risk_avg_coverage',
    label: 'Not-at-risk average coverage'
  },
  {
    key: 'macro_coverage',
    label: 'Macro Coverage'
  },
  {
    key: 'marginal_coverage',
    label: 'Marginal Coverage'
  }
];

const REQUIRED_COLUMNS = [
  'alpha',
  'method',
  'at_risk_avg_coverage',
  'not_at_risk_avg_coverage',
  'marginal_coverage',
  'avg_set_size',
  'macro_coverage'
];

// -----------------------------------------------------------------------------
// Robust CSV parser
// -----------------------------------------------------------------------------

function parseCSV(csvText) {
  if (!csvText || !csvText.trim()) {
    throw new Error('The CSV file is empty.');
  }

  const text = csvText.replace(/^\uFEFF/, '');

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
    } else if (
      (char === '\n' || char === '\r') &&
      !inQuotes
    ) {
      if (char === '\r' && next === '\n') {
        i++;
      }

      row.push(field.trim());

      if (row.some(value => value !== '')) {
        rows.push(row);
      }

      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error(
      'The CSV contains an unclosed quoted field.'
    );
  }

  if (field !== '' || row.length > 0) {
    row.push(field.trim());

    if (row.some(value => value !== '')) {
      rows.push(row);
    }
  }

  if (rows.length < 2) {
    throw new Error(
      'The CSV must contain a header and at least one data row.'
    );
  }

  const headers = rows[0].map(header => header.trim());

  if (new Set(headers).size !== headers.length) {
    throw new Error(
      'The CSV contains duplicate column names.'
    );
  }

  return rows.slice(1).map((values, rowIndex) => {
    const record = {};

    headers.forEach((header, columnIndex) => {
      const value = (values[columnIndex] ?? '').trim();

      if (value === '') {
        record[header] = null;
      } else {
        const numericValue = Number(value);

        record[header] = Number.isFinite(numericValue)
          ? numericValue
          : value;
      }
    });

    if (values.length > headers.length) {
      console.warn(
        `CSV row ${rowIndex + 2} has more fields than the header.`
      );
    }

    return record;
  });
}

// -----------------------------------------------------------------------------
// Load and validate the CSV
// -----------------------------------------------------------------------------

async function loadComparisonData() {
  const csvUrl = new URL(CSV_PATH, import.meta.url);

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(
      `Could not load comparison CSV: HTTP ${response.status}. ` +
      `Requested file: ${csvUrl}`
    );
  }

  const csvText = await response.text();
  const rawData = parseCSV(csvText);

  const missingColumns = REQUIRED_COLUMNS.filter(
    column => !Object.prototype.hasOwnProperty.call(
      rawData[0],
      column
    )
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required CSV columns: ${missingColumns.join(', ')}`
    );
  }

  const validRows = rawData.filter(row => {
    return (
      typeof row.method === 'string' &&
      row.method.length > 0 &&
      Number.isFinite(row.alpha)
    );
  });

  if (validRows.length === 0) {
    throw new Error(
      'The CSV contains no valid method/alpha records.'
    );
  }

  const targetAlphas = [
    ...new Set(validRows.map(row => row.alpha))
  ].sort((a, b) => a - b);

  const availableMethodKeys = [
    ...new Set(validRows.map(row => row.method))
  ];

  const unknownMethods = availableMethodKeys.filter(
    method => !METHOD_MAPPING[method]
  );

  if (unknownMethods.length > 0) {
    console.warn(
      'Unmapped methods will be displayed using their CSV names:',
      unknownMethods
    );
  }

  const orderedMethodKeys = [
    ...METHOD_ORDER.filter(
      method => availableMethodKeys.includes(method)
    ),
    ...availableMethodKeys.filter(
      method => !METHOD_ORDER.includes(method)
    )
  ];

  const metricsByAlpha = {};

  targetAlphas.forEach(alpha => {
    const alphaRows = validRows.filter(
      row => row.alpha === alpha
    );

    const methodRows = orderedMethodKeys
      .map(method => alphaRows.find(row => row.method === method))
      .filter(Boolean);

    metricsByAlpha[alpha] = {
      methods: methodRows.map(
        row => METHOD_MAPPING[row.method] || row.method
      ),

      methodKeys: methodRows.map(row => row.method),

      metrics: {
        at_risk_avg_coverage: methodRows.map(
          row => row.at_risk_avg_coverage
        ),

        not_at_risk_avg_coverage: methodRows.map(
          row => row.not_at_risk_avg_coverage
        ),

        marginal_coverage: methodRows.map(
          row => row.marginal_coverage
        ),

        avg_set_size: methodRows.map(
          row => row.avg_set_size
        ),

        macro_coverage: methodRows.map(
          row => row.macro_coverage
        )
      }
    };
  });

  return {
    targetAlphas,
    metricsByAlpha,
    methodKeys: orderedMethodKeys,
    methods: orderedMethodKeys.map(
      method => METHOD_MAPPING[method] || method
    )
  };
}

// -----------------------------------------------------------------------------
// Initialization and visible error handling
// -----------------------------------------------------------------------------

async function initializePlantNetComparison() {
  const container = document.getElementById(CONTAINER_ID);

  if (!container) {
    console.error(
      `Container #${CONTAINER_ID} was not found.`
    );
    return;
  }

  try {
    if (typeof Plotly === 'undefined') {
      throw new Error(
        'Plotly.js is unavailable. Load Plotly before this module.'
      );
    }

    console.log(
      'Initializing responsive PlantNet comparison visualization...'
    );

    const data = await loadComparisonData();

    await createComparisonPlot(data);

    console.log(
      'PlantNet comparison visualization created successfully.'
    );
  } catch (error) {
    console.error(
      'Could not initialize PlantNet comparison visualization:',
      error
    );

    if (container._plantNetResizeObserver) {
      container._plantNetResizeObserver.disconnect();
      container._plantNetResizeObserver = null;
    }

    container.replaceChildren();

    const message = document.createElement('div');

    message.style.cssText = [
      'box-sizing:border-box',
      'padding:20px',
      'margin:10px 0',
      'border:1px solid #ddd',
      'border-radius:6px',
      'color:#8b1e1e',
      'background:#fff8f8',
      'font-family:Arial,sans-serif',
      'overflow-wrap:anywhere'
    ].join(';');

    const heading = document.createElement('strong');
    heading.textContent =
      'Error loading PlantNet comparison visualization';

    const details = document.createElement('p');
    details.textContent = error.message;
    details.style.fontSize = '12px';

    message.append(heading, details);
    container.appendChild(message);
  }
}

// -----------------------------------------------------------------------------
// Responsive Plotly layout
// -----------------------------------------------------------------------------

function makeLayout(
  container,
  data,
  traces,
  fontFamily
) {
const width = container.clientWidth || 1000;
const isMobile = width < 700;

// Desktop: four columns in one row.
// Mobile: two columns and two rows.
const xDomains = isMobile
  ? [
      [0.16, 0.47],  // Plot 1: top left
      [0.64, 0.95],  // Plot 2: top right
      [0.16, 0.47],  // Plot 3: bottom left
      [0.64, 0.95]   // Plot 4: bottom right
    ]
  : [
      [0.055, 0.235],
      [0.305, 0.485],
      [0.555, 0.735],
      [0.805, 0.985]
    ];

// Plotly domains are specified from bottom to top.
const yDomains = isMobile
  ? [
      [0.56, 0.91],  // Top-left
      [0.56, 0.91],  // Top-right
      [0.12, 0.47],  // Bottom-left
      [0.12, 0.47]   // Bottom-right
    ]
  : Array.from(
      { length: 4 },
      () => [0.12, 0.91]
    );

  const allSetSizes = [];

  data.targetAlphas.forEach(alpha => {
    const sizes =
      data.metricsByAlpha[alpha]?.metrics.avg_set_size || [];

    sizes.forEach(size => {
      if (Number.isFinite(size) && size >= 0) {
        allSetSizes.push(size);
      }
    });
  });

  if (allSetSizes.length === 0) {
    throw new Error(
      'The CSV contains no valid non-negative average set sizes.'
    );
  }

  const maxSetSize = Math.max(...allSetSizes);
  const yMaximum = maxSetSize > 0
    ? maxSetSize * 1.1
    : 1;

  const layout = {
    autosize: true,

    width,

    height: isMobile ? 760 : 540,

    margin: isMobile
      ? { t: 75, r: 8, b: 75, l: 8 }
      : { t: 80, r: 15, b: 75, l: 55 },

    title: {
      text:
        'Conformal prediction for Pl@ntNet-300K:<br>' +
        '<span style="font-size:0.82em">Set size vs. coverage trade-offs</span>',

      x: 0.5,
      xanchor: 'center',
      y: 0.96,
      yanchor: 'top',

      pad: { t: 0, b: 0 },

      font: {
        family: fontFamily,
        size: isMobile ? 16 : 20,
        color: '#222'
      }
    },

    font: {
      family: fontFamily,
      size: isMobile ? 10 : 11
    },

    paper_bgcolor: 'white',
    plot_bgcolor: 'white',

    hovermode: 'closest',

    showlegend: true,

    legend: {
        orientation: 'h',

        x: 0.5,
        xanchor: 'center',

        y: 0,
        yanchor: 'top',

        font: {
          family: fontFamily,
          size: isMobile ? 10 : 11,
          color: '#333'
        },

        borderwidth: 1,
        bordercolor: '#E2E2E2',
        bgcolor: 'rgba(255,255,255,0.9)',

        tracegroupgap: 4,
        itemsizing: 'constant',
        itemwidth: isMobile ? 48 : 70,

        groupclick: 'togglegroup'
      },

    annotations: [],

    shapes: [],

    hoverlabel: {
      font: {
        family: fontFamily,
        size: 12
      }
    }
  };

  METRICS.forEach((metric, index) => {
    const axisNumber = index + 1;

    const xAxisKey = axisNumber === 1
      ? 'xaxis'
      : `xaxis${axisNumber}`;

    const yAxisKey = axisNumber === 1
      ? 'yaxis'
      : `yaxis${axisNumber}`;

    const xReference = axisNumber === 1
      ? 'x'
      : `x${axisNumber}`;

    const yReference = axisNumber === 1
      ? 'y'
      : `y${axisNumber}`;

    layout[xAxisKey] = {
      domain: xDomains[index],
      anchor: yReference,

      type: 'linear',

      title: {
      text: metric.label,
      standoff: isMobile ? 4 : 8,
      font: {
        family: fontFamily,
        size: isMobile ? 9 : 12
      }
    },

    tickfont: {
      family: fontFamily,
      size: isMobile ? 8 : 10
    },

      automargin: true,

      showgrid: false,

      showline: true,
      linecolor: '#444',
      linewidth: 1,

      ticks: 'outside',
      ticklen: 4,

      zeroline: false,

      // Coverage metrics conventionally range from zero to one.
      // Allow a little room if the input contains values outside that range.
      ...(index === 0 || index === 1 || index === 2 || index === 3
        ? {}
        : {})
    };

    layout[yAxisKey] = {
      domain: yDomains[index],
      anchor: xReference,

      type: 'linear',
      range: [0, yMaximum],
      rangemode: 'tozero',

      title: {
        text: isMobile || index === 0
          ? 'Average set size'
          : '',
        standoff: isMobile ? 5 : 8,
        font: {
          family: fontFamily,
          size: isMobile ? 10 : 12
        }
      },

      tickfont: {
        family: fontFamily,
        size: isMobile ? 8 : 10
      },

      automargin: true,

      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.10)',
      gridwidth: 1,

      showline: true,
      linecolor: '#444',
      linewidth: 1,

      ticks: 'outside',
      ticklen: 3,

      zeroline: false,

      // Preserve visible tick labels on every mobile plot.
      showticklabels: true
    };
  });

  // Target-coverage lines are drawn on the fourth plot.
  data.targetAlphas.forEach(alpha => {
    const targetCoverage = 1 - alpha;

    layout.shapes.push({
      type: 'line',

      xref: 'x4',
      yref: 'y4',

      x0: targetCoverage,
      x1: targetCoverage,

      y0: 0,
      y1: yMaximum,

      line: {
        color: '#777',
        width: 1,
        dash: 'dash'
      },

      layer: 'below'
    });
  });

  return layout;
}

// -----------------------------------------------------------------------------
// Build the four-panel plot
// -----------------------------------------------------------------------------

async function createComparisonPlot(data) {
  const container = document.getElementById(CONTAINER_ID);

  if (!container) {
    throw new Error(
      `Container #${CONTAINER_ID} was not found.`
    );
  }

  if (typeof Plotly === 'undefined') {
    throw new Error(
      'Plotly.js is unavailable.'
    );
  }

  const fontConfig = getPlotlyFontConfig();
  const fontFamily = fontConfig?.family || 'Arial, sans-serif';

  container.style.width = '100%';
  container.style.minWidth = '0';
  container.style.boxSizing = 'border-box';

  const traces = [];

  // Create traces for all four panels.
  // Each trace represents one method across the target alpha values.
  METRICS.forEach((metric, metricIndex) => {
    const axisNumber = metricIndex + 1;

    const xAxis = axisNumber === 1
      ? 'x'
      : `x${axisNumber}`;

    const yAxis = axisNumber === 1
      ? 'y'
      : `y${axisNumber}`;

    data.methodKeys.forEach((methodKey, methodIndex) => {
      const displayName =
        METHOD_MAPPING[methodKey] || methodKey;

      const style = METHOD_STYLES[displayName] || {
        color: '#555555',
        symbol: 'circle'
      };

      const xValues = [];
      const yValues = [];
      const alphaValues = [];
      const markerSizes = [];
      const markerOpacities = [];

      data.targetAlphas.forEach(alpha => {
        const alphaData = data.metricsByAlpha[alpha];

        if (!alphaData) {
          return;
        }

        const rowIndex =
          alphaData.methodKeys.indexOf(methodKey);

        if (rowIndex === -1) {
          return;
        }

        const coverage =
          alphaData.metrics[metric.key][rowIndex];

        const setSize =
          alphaData.metrics.avg_set_size[rowIndex];

        if (
          !Number.isFinite(coverage) ||
          !Number.isFinite(setSize)
        ) {
          return;
        }

        const alphaStyle = ALPHA_STYLES[alpha] || {
          size: 9,
          opacity: 0.7
        };

        xValues.push(coverage);
        yValues.push(setSize);
        alphaValues.push(alpha);
        markerSizes.push(alphaStyle.size);
        markerOpacities.push(alphaStyle.opacity);
      });

      if (xValues.length === 0) {
        return;
      }

      const isWPAS = methodKey.startsWith('WPAS');

      traces.push({
        type: 'scatter',
        mode: 'markers',

        name: displayName,
        legendgroup: displayName,

        // Show each method only once in the shared legend.
        showlegend: metricIndex === 0,

        x: xValues,
        y: yValues,

        xaxis: xAxis,
        yaxis: yAxis,

        marker: {
          color: style.color,
          symbol: style.symbol,
          size: markerSizes,
          opacity: markerOpacities,
          line: {
            width: 0.5,
            color: style.color
          }
        },
        customdata: alphaValues,

        hovertemplate:
          `<b>${displayName}</b><br>` +
          `${metric.label}: %{x:.4f}<br>` +
          `Average set size: %{y:.4f}<br>` +
          `α: %{customdata:.2f}` +
          '<extra></extra>'
      });
    });
  });

  if (traces.length === 0) {
    throw new Error(
      'No valid plotting traces could be created. ' +
      'Check the CSV coverage and average set-size values.'
    );
  }

  const allSetSizes = [];

  data.targetAlphas.forEach(alpha => {
    const alphaData = data.metricsByAlpha[alpha];

    if (!alphaData) {
      return;
    }

    alphaData.metrics.avg_set_size.forEach(size => {
      if (Number.isFinite(size) && size >= 0) {
        allSetSizes.push(size);
      }
    });
  });

  if (allSetSizes.length === 0) {
    throw new Error(
      'No valid average set-size values were found.'
    );
  }

  const maxSetSize = Math.max(...allSetSizes);
  const targetLineMax = maxSetSize > 0
    ? maxSetSize * 1.1
    : 1;



  // Target-coverage lines on Marginal Coverage (the fourth panel).
  // These are implemented as layout shapes so they do not add legend items.
  // Their hover labels are not interactive; the target values are shown
  // through the annotation labels below.

  const annotations = [];

  data.targetAlphas.forEach(alpha => {
    const targetCoverage = 1 - alpha;

    annotations.push({
      x: targetCoverage,
      y: targetLineMax,

      xref: 'x4',
      yref: 'y4',

      text: `1−α=${targetCoverage.toFixed(2)}`,

      showarrow: false,

      textangle: -90,

      xanchor: 'right',
      yanchor: 'top',

      font: {
        family: fontFamily,
        size: 9,
        color: '#777'
      },

      bgcolor: 'rgba(255,255,255,0.65)'
    });
  });

  const config = {
    responsive: true,

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
      filename: 'plantnet_conformal_comparison',
      height: 800,
      width: 1600,
      scale: 1
    }
  };

  // Disconnect previous observers if the chart is rebuilt.
  if (container._plantNetResizeObserver) {
    container._plantNetResizeObserver.disconnect();
    container._plantNetResizeObserver = null;
  }

  const buildLayout = () => {
    const layout = makeLayout(
      container,
      data,
      traces,
      fontFamily
    );

    layout.annotations = annotations;

    return layout;
  };

  await Plotly.newPlot(
    container,
    traces,
    buildLayout(),
    config
  );

  // ---------------------------------------------------------------------------
  // Synchronize y-axis zoom and reset operations.
  // ---------------------------------------------------------------------------

  if (container._plantNetRelayoutHandler) {
    container.removeListener(
      'plotly_relayout',
      container._plantNetRelayoutHandler
    );
  }

  let syncing = false;

  const relayoutHandler = relayoutData => {
    if (syncing || !relayoutData) {
      return;
    }

    const keys = Object.keys(relayoutData);

    const yAxisChanged = keys.some(key =>
      /^yaxis\d*(\.range(\[\d\])?|\.autorange)$/.test(key)
    );

    if (!yAxisChanged) {
      return;
    }

    const resetRequested = keys.some(key =>
      /^yaxis\d*\.autorange$/.test(key) &&
      relayoutData[key] === true
    );

    const update = {};

    if (resetRequested) {
      for (let i = 1; i <= 4; i++) {
        const axis = i === 1
          ? 'yaxis'
          : `yaxis${i}`;

        update[`${axis}.autorange`] = true;
      }
    } else {
      let selectedRange = null;

      for (let i = 1; i <= 4; i++) {
        const axis = i === 1
          ? 'yaxis'
          : `yaxis${i}`;

        const low = relayoutData[`${axis}.range[0]`];
        const high = relayoutData[`${axis}.range[1]`];

        const completeRange = relayoutData[`${axis}.range`];

        if (
          low !== undefined &&
          high !== undefined
        ) {
          selectedRange = [low, high];
          break;
        }

        if (Array.isArray(completeRange)) {
          selectedRange = completeRange;
          break;
        }
      }

      if (!selectedRange) {
        return;
      }

      for (let i = 1; i <= 4; i++) {
        const axis = i === 1
          ? 'yaxis'
          : `yaxis${i}`;

        update[`${axis}.autorange`] = false;
        update[`${axis}.range`] = selectedRange;
      }
    }

    syncing = true;

    Plotly.relayout(container, update)
      .catch(error => {
        console.error(
          'Could not synchronize y-axis zoom:',
          error
        );
      })
      .finally(() => {
        syncing = false;
      });
  };

  container._plantNetRelayoutHandler = relayoutHandler;

  container.on(
    'plotly_relayout',
    relayoutHandler
  );

  // ---------------------------------------------------------------------------
  // Responsive resizing.
  // ---------------------------------------------------------------------------

  let resizeTimer;

  let previousWidth = container.clientWidth;

  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(async () => {
      if (!container.isConnected) {
        return;
      }

      const currentWidth = container.clientWidth;

      if (
        currentWidth === 0 ||
        Math.abs(currentWidth - previousWidth) < 2
      ) {
        return;
      }

      const previousLayout = container._fullLayout;

      const wasMobile = previousWidth < 700;
      const isMobile = currentWidth < 700;

      previousWidth = currentWidth;

      try {
        // Rebuild only when crossing the desktop/mobile breakpoint.
        if (wasMobile !== isMobile) {
          await Plotly.react(
            container,
            traces,
            buildLayout(),
            config
          );
        } else {
          await Plotly.relayout(container, {
            width: currentWidth
          });

          await Plotly.Plots.resize(container);
        }
      } catch (error) {
        console.error(
          'Could not resize PlantNet comparison visualization:',
          error
        );
      }
    }, 180);
  });

  resizeObserver.observe(container.parentElement || container);

  container._plantNetResizeObserver = resizeObserver;
}

// -----------------------------------------------------------------------------
// Initialize when the DOM is ready.
// -----------------------------------------------------------------------------

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initializePlantNetComparison,
    { once: true }
  );
} else {
  initializePlantNetComparison();
}

// -----------------------------------------------------------------------------
// Browser global and ES module exports.
// -----------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.PlantNetComparison = {
    loadComparisonData,
    createComparisonPlot,
    initializePlantNetComparison
  };
}

export {
  loadComparisonData,
  createComparisonPlot,
  initializePlantNetComparison
};
