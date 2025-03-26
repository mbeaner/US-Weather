document.addEventListener('DOMContentLoaded', function () {
  // Show loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';
  loadingMessage.textContent = 'Loading your saved map...';
  document.body.appendChild(loadingMessage);
  loadingMessage.style.display = 'block';

  // Set default date to today
  const datePicker = document.getElementById('date-picker');
  const today = new Date();
  datePicker.valueAsDate = today;

  // Print button functionality
  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  // Debugging button to clear storage
  document
    .getElementById('clear-storage')
    .addEventListener('click', function () {
      localStorage.removeItem('stateColors');
      alert('Saved colors cleared! Refresh the page.');
    });

  // Map dimensions
  const width = window.innerWidth;
  const height =
    window.innerHeight - document.querySelector('header').offsetHeight;

  // Create SVG container
  const svg = d3.select('#us-map').attr('width', width).attr('height', height);

  // Projection and path
  const projection = d3
    .geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

  const path = d3.geoPath().projection(projection);

  // State abbreviations with special handling for small states
  const smallStates = ['CT', 'DE', 'MA', 'MD', 'NH', 'NJ', 'RI', 'VT'];
  const stateAbbreviations = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
  };

  // Color sequence
  const colors = ['#f0f0f0', '#3498db', '#e74c3c'];

  // Load saved state colors from localStorage
  const loadStateColors = () => {
    try {
      const savedColors = localStorage.getItem('stateColors');
      return savedColors ? JSON.parse(savedColors) : {};
    } catch (e) {
      console.error('Error loading saved colors:', e);
      return {};
    }
  };

  // Save state colors to localStorage
  const saveStateColors = (stateColors) => {
    try {
      localStorage.setItem('stateColors', JSON.stringify(stateColors));
    } catch (e) {
      console.error('Error saving colors:', e);
    }
  };

  // Initialize state colors
  let stateColors = loadStateColors();

  // Load and draw the US map
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(function (us) {
      const states = topojson.feature(us, us.objects.states).features;

      // Draw states with saved colors
      svg
        .selectAll('.state')
        .data(states)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', function (d) {
          return stateColors[d.properties.name] || colors[0];
        })
        .attr('data-color-index', function (d) {
          const savedColor = stateColors[d.properties.name];
          if (!savedColor) return 0;
          return savedColor === colors[1]
            ? 1
            : savedColor === colors[2]
            ? 2
            : 0;
        })
        .on('click', function (event, d) {
          const currentIndex = +d3.select(this).attr('data-color-index');
          const nextIndex = (currentIndex + 1) % colors.length;
          const newColor = colors[nextIndex];

          d3.select(this)
            .attr('fill', newColor)
            .attr('data-color-index', nextIndex);

          stateColors[d.properties.name] = newColor;
          saveStateColors(stateColors);
        });

      // Add state abbreviations with angled lines for specific states
      svg
        .selectAll('.state-abbr-container')
        .data(states)
        .enter()
        .append('g')
        .attr('class', 'state-abbr-container')
        .each(function (d) {
          const group = d3.select(this);
          const stateName = d.properties.name;
          let abbr = '';

          for (const a in stateAbbreviations) {
            if (stateAbbreviations[a] === stateName) {
              abbr = a;
              break;
            }
          }

          if (!abbr) return;

          const centroid = path.centroid(d);
          const isSmallState = smallStates.includes(abbr);

          if (isSmallState) {
            const distance = 60;
            let angle = 0; // East by default
            let distanceMultiplier = 1;

            // Custom angles and distances for specific states
            const stateAdjustments = {
              NH: { angle: Math.PI / 12, distanceMultiplier: 1.1 }, // 30° SE
              RI: { angle: Math.PI / 6, distanceMultiplier: 1.1 }, // 30° SE
              CT: { angle: Math.PI / 6, distanceMultiplier: 1 }, // 22.5° SE
              MD: { angle: Math.PI / 12, distanceMultiplier: 1 }, // 15° SE
            };

            if (stateAdjustments[abbr]) {
              angle = stateAdjustments[abbr].angle;
              distanceMultiplier = stateAdjustments[abbr].distanceMultiplier;
            }

            const adjustedDistance = distance * distanceMultiplier;
            const textX = centroid[0] + Math.cos(angle) * adjustedDistance;
            const textY = centroid[1] + Math.sin(angle) * adjustedDistance;

            // Add connecting line
            group
              .append('line')
              .attr('x1', centroid[0])
              .attr('y1', centroid[1])
              .attr('x2', textX)
              .attr('y2', textY)
              .attr('stroke', '#555')
              .attr('stroke-width', 0.8)
              .attr('stroke-dasharray', '3,2');

            // Add text
            group
              .append('text')
              .attr('class', 'state-abbr')
              .attr('x', textX)
              .attr('y', textY)
              .attr('dy', '.35em')
              .text(abbr);
          } else {
            group
              .append('text')
              .attr('class', 'state-abbr')
              .attr('x', centroid[0])
              .attr('y', centroid[1])
              .attr('dy', '.35em')
              .text(abbr);
          }
        });

      // Hide loading message
      loadingMessage.style.display = 'none';
    })
    .catch((error) => {
      console.error('Error loading map data:', error);
      loadingMessage.textContent = 'Error loading map. Please refresh.';
    });

  // Handle window resize
  window.addEventListener('resize', function () {
    const newWidth = window.innerWidth;
    const newHeight =
      window.innerHeight - document.querySelector('header').offsetHeight;

    svg.attr('width', newWidth).attr('height', newHeight);
    projection.translate([newWidth / 2, newHeight / 2]).scale(newWidth);
    svg.selectAll('.state').attr('d', path);

    // Update state abbreviations and lines with custom angles
    svg.selectAll('.state-abbr-container').each(function (d) {
      const group = d3.select(this);
      const stateName = d.properties.name;
      let abbr = '';

      for (const a in stateAbbreviations) {
        if (stateAbbreviations[a] === stateName) {
          abbr = a;
          break;
        }
      }

      if (!abbr || !smallStates.includes(abbr)) return;

      const centroid = path.centroid(d);
      const distance = 60;
      let angle = 0;
      let distanceMultiplier = 1;

      const stateAdjustments = {
        NH: { angle: Math.PI / 12, distanceMultiplier: 1.1 },
        RI: { angle: Math.PI / 6, distanceMultiplier: 1.1 },
        CT: { angle: Math.PI / 6, distanceMultiplier: 1 },
        MD: { angle: Math.PI / 12, distanceMultiplier: 1 },
      };

      if (stateAdjustments[abbr]) {
        angle = stateAdjustments[abbr].angle;
        distanceMultiplier = stateAdjustments[abbr].distanceMultiplier;
      }

      const adjustedDistance = distance * distanceMultiplier;
      const textX = centroid[0] + Math.cos(angle) * adjustedDistance;
      const textY = centroid[1] + Math.sin(angle) * adjustedDistance;

      group
        .select('line')
        .attr('x1', centroid[0])
        .attr('y1', centroid[1])
        .attr('x2', textX)
        .attr('y2', textY);

      group.select('text').attr('x', textX).attr('y', textY);
    });
  });
});
