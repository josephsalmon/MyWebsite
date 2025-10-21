// PlantNet-300K Species Distribution Visualization
// Interactive scatter plot showing species distribution by IUCN conservation status

import { getPlotlyFontConfig, applyDocumentFont, getDocumentFontStyle } from './font_utils.js';

// Global scale change handler
window.setScale = function(scale) {
  document.dispatchEvent(new CustomEvent('scaleChange', { detail: scale }));
  return false;
}

document.addEventListener('DOMContentLoaded', async function() {
  // Load the CSV data and authors data in parallel
  try {
    const [csvResponse, authorsResponse] = await Promise.all([
      fetch('tiny_plantnet300k_metadata.csv'),
      fetch('Metadata/authors.json')
    ]);
    
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`);
    }
    if (!authorsResponse.ok) {
      console.warn('Authors data not available - proceeding without author information');
    }
    
    const csvText = await csvResponse.text();
    const authorsData = authorsResponse.ok ? await authorsResponse.json() : {};

    // Helper function to extract image hash from image path
    function getImageHash(imagePath) {
      if (!imagePath) return null;
      // Extract filename from path like "tiny_plantnet300k/203/8af5c1790935598cd896b692523bcfafdb1f15f2.jpg"
      const filename = imagePath.split('/').pop();
      // Remove the .jpg extension to get the hash
      return filename ? filename.replace('.jpg', '') : null;
    }

    // Split a species string into main binomial and author suffix.
    // Heuristic: if trailing parentheses exist, treat them as author; otherwise
    // treat the first two words as the binomial and the rest as the author.
    function splitSpeciesName(species) {
      if (!species || typeof species !== 'string') return { main: '', author: '' };
      // Match trailing parentheses like "Genus species (L.)"
      const parenMatch = species.match(/^(.*?)(\s*\(.*\))$/);
      if (parenMatch) return { main: parenMatch[1].trim(), author: parenMatch[2].trim() };
      const parts = species.trim().split(/\s+/);
      if (parts.length <= 2) return { main: species.trim(), author: '' };
      return { main: parts.slice(0, 2).join(' '), author: ' ' + parts.slice(2).join(' ') };
    }

    // Minimal HTML escaper for label content
    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const data = [];
    for(let i = 1; i < lines.length; i++) {
      // Handle possible commas within quoted fields
      let values = [];
      let inQuotes = false;
      let currentValue = '';

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue); // Add the last value

      const row = {};
      for(let j = 0; j < headers.length; j++) {
        if (j < values.length) {
          const value = values[j].trim();
          // Convert numeric values
          row[headers[j]] = isNaN(Number(value)) || value === '' ? value : Number(value);
        }
      }
      data.push(row);
    }

    // Define colors for IUCN statuses using official IUCN Red List colors
    const statusColors = {
      'CR': '#D81E05',  // Critically Endangered
      'EN': '#FC7F3F',  // Endangered
      'VU': '#F9E814',  // Vulnerable
      'NT': '#CCE226',  // Near Threatened
      'LC': '#60C659',  // Least Concern
      'LR/nt': '#CCE226', // Lower Risk/near threatened (treated as NT)
      'LR/cd': '#CCE226', // Lower Risk/conservation dependent (treated as NT per IUCN guidelines)
      'LR/lc': '#60C659', // Lower Risk/least concern (treated as LC)
      'DD': '#D1D1C6',  // Data Deficient
      'Not Evaluated': '#FFFFFF', // Not Evaluated
      'Not assessed': '#C1B5A5', // Not assessed (NA)
      'RE': '#9B4F96',  // Regionally Extinct
      'EW': '#542344',  // Extinct in the Wild
      'EX': '#000000'   // Extinct
    };

    // Process the data to replace NA with "Not assessed"
    data.forEach(d => {
      if (!d.iucn_status || d.iucn_status === 'NA' || d.iucn_status === '') {
        d.iucn_status = 'Not assessed';
      }
  // Map legacy Lower Risk categories to IUCN equivalents per guidelines
  // LR/cd -> NT, LR/nt -> NT, LR/lc -> LC (recoded to NT/LC and not shown separately)
      if (d.iucn_status === 'LR/cd' || d.iucn_status === 'LR/nt') {
        d.iucn_status = 'NT';
      } else if (d.iucn_status === 'LR/lc') {
        d.iucn_status = 'LC';
      }
    });

    // Extract unique IUCN statuses
    const uniqueStatuses = [...new Set(data.map(d => d.iucn_status))].sort();

    // Sort IUCN statuses by conservation concern level
    const statusOrder = {
      'LC': 0,         // Least Concern
      'LR/lc': 1,      // Lower Risk/least concern (old category)
      'NT': 2,         // Near Threatened
      'LR/nt': 3,      // Lower Risk/nearly threatened (old category)
      'DD': 4,         // Data Deficient
      'VU': 5,         // Vulnerable
      'LR/cd': 6,      // Lower Risk/conservation dependent (old category)
      'EN': 7,         // Endangered
      'CR': 8,         // Critically Endangered
      'Not Evaluated': 9,
      'Not assessed': 10
    };

    // Sort statuses by conservation concern
    const sortedStatuses = [...uniqueStatuses].sort((a, b) => {
      return (statusOrder[a] || 10) - (statusOrder[b] || 10);
    });

    // Create organized legend container
    const filterContainer = document.getElementById('filter-container');

    // Create a styled legend box
    const legendBox = document.createElement('div');
    legendBox.style.border = '1px solid #ddd';
    legendBox.style.borderRadius = '5px';
    legendBox.style.padding = '10px';
    legendBox.style.backgroundColor = '#fafafa';
    legendBox.style.maxWidth = '950px';
    legendBox.style.margin = '0 auto';
    applyDocumentFont(legendBox);

    // Add title
    const legendTitle = document.createElement('div');
    legendTitle.textContent = 'IUCN Conservation Status';
    legendTitle.style.fontWeight = 'bold';
    legendTitle.style.marginBottom = '10px';
    legendTitle.style.borderBottom = '1px solid #ddd';
    legendTitle.style.paddingBottom = '5px';
    applyDocumentFont(legendTitle, '16px');
    legendBox.appendChild(legendTitle);

  // Create two-column layout for legend: left = "At risk", right = "Not at risk"
    const legendGrid = document.createElement('div');
    legendGrid.style.display = 'grid';
    legendGrid.style.gridTemplateColumns = '1fr 1fr';
    legendGrid.style.gap = '12px';
    legendBox.appendChild(legendGrid);

  // Add "Select All" checkbox spanning both columns
    const allDiv = document.createElement('div');
    allDiv.style.display = 'flex';
    allDiv.style.alignItems = 'center';
    allDiv.style.gridColumn = '1 / -1'; // Span both columns

    const allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.id = 'select-all';
    allCheckbox.checked = true;

    const allLabel = document.createElement('label');
    allLabel.htmlFor = 'select-all';
    allLabel.style.marginLeft = '8px';
    allLabel.style.fontWeight = 'bold';
    allLabel.textContent = 'Display All';
    applyDocumentFont(allLabel, '14px');

    allDiv.appendChild(allCheckbox);
    allDiv.appendChild(allLabel);
    legendGrid.appendChild(allDiv);

    // Determine grouping: at risk vs not at risk
    const atRiskSet = new Set(['CR', 'EN', 'VU', 'NT']);
    const statusCheckboxes = [];

    const leftColumn = document.createElement('div');
    const rightColumn = document.createElement('div');

    // Column headers with accessibility
    const leftHeader = document.createElement('div');
    leftHeader.textContent = 'At risk';
    leftHeader.style.fontWeight = '600';
    leftHeader.style.marginBottom = '6px';
    leftHeader.setAttribute('role', 'heading');
    leftHeader.setAttribute('aria-level', '2');
    applyDocumentFont(leftHeader, '13px');
    leftColumn.appendChild(leftHeader);

    const rightHeader = document.createElement('div');
    rightHeader.textContent = 'Not at risk';
    rightHeader.style.fontWeight = '600';
    rightHeader.style.marginBottom = '6px';
    rightHeader.setAttribute('role', 'heading');
    rightHeader.setAttribute('aria-level', '2');
    applyDocumentFont(rightHeader, '13px');
    rightColumn.appendChild(rightHeader);

    // Desired ordering within columns
    const atRiskOrder = ['CR', 'EN', 'VU', 'NT']; // most to least endangered
    const notAtRiskOrder = ['LC', 'DD', 'Not Evaluated', 'Not assessed', 'RE', 'EW', 'EX'];

    // Helper to create a checkbox row
    function createStatusRow(status) {
      if (!sortedStatuses.includes(status)) return null; // skip missing
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.padding = '4px 0';

      const id = `status-${status.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.value = status;
      checkbox.checked = true;
      checkbox.setAttribute('aria-label', `Toggle ${status}`);
      statusCheckboxes.push(checkbox);

      const label = document.createElement('label');
      label.htmlFor = id;
      label.style.marginLeft = '8px';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.cursor = 'pointer';

      // Color box
      if (statusColors[status]) {
        const colorBox = document.createElement('span');
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '14px';
        colorBox.style.height = '14px';
        colorBox.style.backgroundColor = statusColors[status];
        colorBox.style.marginRight = '8px';
        colorBox.style.border = '1px solid #ccc';
        colorBox.style.borderRadius = '3px';
        label.appendChild(colorBox);
      }

      const statusText = document.createElement('span');
      const getFullName = (abbr) => {
        const names = {
          'CR': 'Critically Endangered',
          'EN': 'Endangered',
          'VU': 'Vulnerable',
          'NT': 'Near Threatened',
          'LC': 'Least Concern',
          'DD': 'Data Deficient',
          'Not Evaluated': 'Not Evaluated by IUCN',
          'Not assessed': 'Not assessed',
          'RE': 'Regionally Extinct',
          'EW': 'Extinct in the Wild',
          'EX': 'Extinct'
        };
        return names[abbr] || abbr;
      };

      const fullName = getFullName(status);
      statusText.textContent = (status.length <= 3 || status.includes('/')) ? `${fullName} (${status})` : fullName;
      statusText.title = fullName;
      applyDocumentFont(statusText, '12px');
      label.appendChild(statusText);

      container.appendChild(checkbox);
      container.appendChild(label);
      return container;
    }

    // Fill left (at risk) column in desired order
    atRiskOrder.forEach(s => {
      const row = createStatusRow(s);
      if (row) leftColumn.appendChild(row);
    });

    // Fill right (not at risk) column in desired order
    notAtRiskOrder.forEach(s => {
      const row = createStatusRow(s);
      if (row) rightColumn.appendChild(row);
    });

    // Append any remaining statuses that weren't included above
    sortedStatuses.forEach(s => {
      if (!atRiskOrder.includes(s) && !notAtRiskOrder.includes(s)) {
        const row = createStatusRow(s);
        if (row) rightColumn.appendChild(row);
      }
    });

    legendGrid.appendChild(leftColumn);
    legendGrid.appendChild(rightColumn);

    filterContainer.appendChild(legendBox);

  // (Highlight button removed per user request)

  // No footnote: LR/cd values are recoded to NT per instructions and not shown separately

    // Handle "select all" checkbox
    allCheckbox.addEventListener('change', () => {
      statusCheckboxes.forEach(cb => {
        cb.checked = allCheckbox.checked;
      });
      updatePlot();
    });

    // Handle individual status checkboxes
    statusCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        // Update "select all" checkbox
        allCheckbox.checked = statusCheckboxes.every(cb => cb.checked);

        // Prevent unchecking all boxes
        const anyChecked = statusCheckboxes.some(cb => cb.checked);
        if (!anyChecked) {
          cb.checked = true;
        }

        updatePlot();
      });
    });

    // Function to filter data based on selected checkboxes
    function getFilteredData() {
      const selectedStatuses = statusCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      return data.filter(d => selectedStatuses.includes(d.iucn_status));
    }

  // Track current scale
  let currentScale = 'linear';

    // Event listener for scale changes
    document.addEventListener('scaleChange', function(e) {
      currentScale = e.detail;

      // Update button appearance
      const logBtn = document.querySelector('#log-scale-btn');
      const linearBtn = document.querySelector('#linear-scale-btn');

      if (logBtn && linearBtn) {
        if (currentScale === 'log') {
          logBtn.style.backgroundColor = '#4CAF50';
          logBtn.style.color = 'white';
          linearBtn.style.backgroundColor = '#f1f1f1';
          linearBtn.style.color = '#333';
        } else {
          linearBtn.style.backgroundColor = '#4CAF50';
          linearBtn.style.color = 'white';
          logBtn.style.backgroundColor = '#f1f1f1';
          logBtn.style.color = '#333';
        }
      }

      // Update the plot
      updatePlot();
    });

    // Create the plot
    function updatePlot() {
      const filteredData = getFilteredData();

      // Group data by IUCN status for separate traces
      const dataByStatus = {};
      uniqueStatuses.forEach(status => {
        dataByStatus[status] = filteredData.filter(d => d.iucn_status === status);
      });

      // Create a trace for each IUCN status
      const traces = [];

      // Sort statuses by vulnerability level (least vulnerable first, most vulnerable last)
      // This ensures more vulnerable species appear on top (foreground)
      const vulnerabilityOrder = {
        'Not assessed': 0,
        'Not Evaluated': 1,
        'LC': 2,         // Least Concern
        'LR/lc': 3,      // Lower Risk/least concern
        'DD': 4,         // Data Deficient
        'LR/cd': 5,      // Lower Risk/conservation dependent
        'NT': 6,         // Near Threatened
        'LR/nt': 7,      // Lower Risk/nearly threatened
        'VU': 8,         // Vulnerable
        'EN': 9,         // Endangered
        'CR': 10         // Critically Endangered (most vulnerable, frontmost)
      };

      // Sort statuses by vulnerability level (background to foreground)
      const statusesByVulnerability = Object.keys(dataByStatus).sort((a, b) => {
        return (vulnerabilityOrder[a] || 0) - (vulnerabilityOrder[b] || 0);
      });

      statusesByVulnerability.forEach(status => {
        const items = dataByStatus[status];
        if (items && items.length > 0) {
          traces.push({
            x: items.map(d => d.new_idx),
            y: items.map(d => d.counts),
            text: items.map(d => {
              const sp = splitSpeciesName(d.species);
              const main = escapeHtml(sp.main);
              const author = escapeHtml(sp.author || '');
              return `<em>${main}</em>${author}<br>IUCN: ${escapeHtml(d.iucn_status)}<br>Count: ${d.counts}`;
            }),
            mode: 'markers',
            type: 'scattergl',
            name: status,
            marker: {
              size: 8,
              color: statusColors[status] || '#1f77b4',
              opacity: 0.7
            },
            hoverinfo: 'text',
            customdata: items.map(d => {
              const imageHash = getImageHash(d.image);
              const authorInfo = imageHash && authorsData[imageHash] ? authorsData[imageHash] : null;
              const sp = splitSpeciesName(d.species);
              return {
                speciesMain: sp.main,
                speciesAuthor: sp.author || '',
                image: d.image,
                count: d.counts,
                author: authorInfo ? authorInfo.author : null,
                iucn: d.iucn_status
              };
            })
          });
        }
      });

      // Get font configuration
      const fontConfig = getPlotlyFontConfig();
      
      const layout = {
        title: {
          text: 'Species popularity by IUCN Status',
          font: fontConfig.title
        },
        xaxis: {
          title: {
            text: 'Index',
            font: fontConfig.axis
          },
          tickfont: fontConfig.tick,
          zeroline: true
        },
        yaxis: {
          title: {
            text: 'Popularity (# of examples)',
            font: fontConfig.axis
          },
          tickfont: fontConfig.tick,
          type: currentScale, // Use the current scale type
          zeroline: true
        },
        hovermode: 'closest',
        legend: {
          orientation: 'h',
          yanchor: 'bottom',
          y: -0.2,
          xanchor: 'center',
          x: 0.5,
          font: fontConfig.legend
        },
        margin: { l: 60, r: 30, t: 60, b: 40 },
        autosize: true,
        showlegend: false, // We use our custom legend with checkboxes
        font: {
          family: fontConfig.family
        }
      };

      const config = {
        responsive: true,
        displayModeBar: 'hover',
        modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toggleHover'],
        toImageButtonOptions: {
          format: 'png',
          filename: 'plantnet_species_distribution'
        }
      };

      // Get plot container element and create/update the plot
      const plotContainer = document.getElementById('plotly-container');
      Plotly.newPlot('plotly-container', traces, layout, config);

      // Handle hover events for image display
      const previewImage = document.getElementById('preview-image');
      const imageLabel = document.getElementById('image-label');
      const imagePreviewContainer = document.getElementById('image-preview-container');

      // Display the most common species by default (highest count)
      let maxCount = 0;
      let maxCustomData = null;
      traces.forEach(trace => {
        if (trace.y) {
          trace.y.forEach((count, index) => {
            if (count > maxCount) {
              maxCount = count;
              maxCustomData = trace.customdata[index];
            }
          });
        }
      });

      if (maxCustomData && maxCustomData.image) {
        previewImage.src = maxCustomData.image;
        previewImage.style.display = 'block';

        // Build the label with italicized main species and normal author/photographer
        const main = escapeHtml(maxCustomData.speciesMain || '');
        const spAuthor = escapeHtml(maxCustomData.speciesAuthor || '');
        let labelHtml = `<span style="font-size: 13px; font-weight: normal;"><em>${main}</em>${spAuthor}</span><br>`;
        labelHtml += `<span style="font-size: 13px; color: #666;"># of examples: ${maxCustomData.count.toLocaleString()}</span>`;

        if (maxCustomData.author) {
          labelHtml += `<br><span style="font-size: 12px; color: #888; font-style: italic;">Photo by: ${escapeHtml(maxCustomData.author)}</span>`;
        }

        imageLabel.innerHTML = labelHtml;
        imagePreviewContainer.querySelector('div:first-child').textContent = 'Most Common Species';
      }

      // Set initial state for image preview
      if (!previewImage.src) {
        imagePreviewContainer.querySelector('div:first-child').textContent = 'Hover over a point to see species';
      }

      plotContainer.on('plotly_hover', function(data) {
        const point = data.points[0];
        const customData = point.customdata;

        if (customData && customData.image) {
          previewImage.src = customData.image;
          previewImage.style.display = 'block';

          // Build the label with italicized main species and normal author/photographer
          const main = escapeHtml(customData.speciesMain || '');
          const spAuthor = escapeHtml(customData.speciesAuthor || '');
          let labelHtml = `<span style="font-size: 13px; font-weight: normal;"><em>${main}</em>${spAuthor}</span><br>`;
          labelHtml += `<span style="font-size: 13px; color: #666;"># of examples: ${customData.count.toLocaleString()}</span>`;

          if (customData.author) {
            labelHtml += `<br><span style="font-size: 12px; color: #888; font-style: italic;">Photo by: ${escapeHtml(customData.author)}</span>`;
          }

          imageLabel.innerHTML = labelHtml;
          imagePreviewContainer.querySelector('div:first-child').textContent = 'Species Preview';
        }
      });

      plotContainer.on('plotly_unhover', function(data) {
        // Don't clear the image to keep it displayed
      });

      // Add a click event to "lock" the current image
      plotContainer.on('plotly_click', function(data) {
        // Keep the current image displayed when clicked
      });
    }

    // Initial plot
    updatePlot();

  } catch (error) {
    console.error('Error setting up visualization:', error);
    const vizDiv = document.getElementById('plantnet-viz');
    if (vizDiv) {
      vizDiv.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid red; margin: 20px;">
          <h4>Error loading visualization</h4>
          <div>${error.message}</div>
        </div>
      `;
    }
  }
});
