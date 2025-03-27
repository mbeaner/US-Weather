document.addEventListener('DOMContentLoaded', function () {
  // =============================================
  const WEATHER_API_KEY = 'c8770350a4744a86bbd193337252603'; // ← REPLACE THIS WITH YOUR KEY
  // =============================================

  const WEATHER_API_BASE_URL = `https://api.weatherapi.com/v1`;

  // Helper function to convert date to Eastern Time
  function toEasternTime(date) {
    const estOffset = date.getTimezoneOffset() + 300; // EST is UTC-5 (300 minutes)
    const estDate = new Date(date.getTime() + estOffset * 60000);
    return estDate;
  }

  // Major cities in each state (we'll check these for hottest temperature)
  const stateCities = {
    AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
    AK: ['Anchorage', 'Fairbanks', 'Juneau'],
    AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
    AR: ['Little Rock', 'Fayetteville', 'Fort Smith'],
    CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Sacramento'],
    CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
    CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'],
    DE: ['Wilmington', 'Dover', 'Newark'],
    FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
    GA: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'],
    HI: ['Honolulu', 'Hilo', 'Kailua', 'Kapolei'],
    ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
    IL: ['Chicago', 'Aurora', 'Rockford', 'Springfield'],
    IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
    IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
    KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
    KY: ['Louisville', 'Lexington', 'Bowling Green', 'Frankfort'],
    LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
    ME: ['Portland', 'Lewiston', 'Bangor', 'Augusta'],
    MD: ['Baltimore', 'Frederick', 'Rockville', 'Annapolis'],
    MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
    MI: ['Detroit', 'Grand Rapids', 'Warren', 'Lansing'],
    MN: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'],
    MS: ['Jackson', 'Gulfport', 'Southaven', 'Biloxi'],
    MO: ['Kansas City', 'St. Louis', 'Springfield', 'Jefferson City'],
    MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
    NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
    NV: ['Las Vegas', 'Henderson', 'Reno', 'Carson City'],
    NH: ['Manchester', 'Nashua', 'Concord', 'Derry'],
    NJ: ['Newark', 'Jersey City', 'Paterson', 'Trenton'],
    NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
    NY: ['New York', 'Buffalo', 'Rochester', 'Albany'],
    NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
    ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
    OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
    OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
    OR: ['Portland', 'Eugene', 'Salem', 'Gresham'],
    PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Harrisburg'],
    RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'],
    SC: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant'],
    SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Pierre'],
    TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
    TX: ['Houston', 'San Antonio', 'Dallas', 'Austin'],
    UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
    VT: ['Burlington', 'South Burlington', 'Rutland', 'Montpelier'],
    VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond'],
    WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'],
    WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
    WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
    WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
  };

  // Enhanced dark mode toggle functionality
  const darkModeSwitch = document.getElementById('dark-mode-switch');
  const toggleText = document.querySelector('.toggle-text');

  // Check for saved dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    darkModeSwitch.checked = true;
    document.body.classList.add('dark-mode');
    toggleText.textContent = 'Light Mode';
  }

  darkModeSwitch.addEventListener('change', function () {
    const isDarkMode = this.checked;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    toggleText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';

    // Force redraw of SVG elements
    const abbrs = document.querySelectorAll('.state-abbr');
    abbrs.forEach((abbr) => {
      abbr.style.display = 'none';
      abbr.offsetHeight; // Trigger reflow
      abbr.style.display = null;
    });
  });

  // Show loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';
  loadingMessage.textContent = 'Loading your saved map...';
  document.body.appendChild(loadingMessage);
  loadingMessage.style.display = 'block';

  // Set default date to today in EST and configure date picker
  const datePicker = document.getElementById('date-picker');
  const today = new Date();
  const estToday = toEasternTime(today);
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const estTwoWeeksLater = toEasternTime(twoWeeksLater);

  // Set the date picker to today's date in EST (formatted as YYYY-MM-DD)
  datePicker.valueAsDate = estToday;
  datePicker.max = estTwoWeeksLater.toISOString().split('T')[0]; // Limit to 14 days in future

  // Helper function to add days to a date
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Print button functionality
  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  // Clear storage button functionality
  document
    .getElementById('clear-storage')
    .addEventListener('click', function () {
      if (confirm('Are you sure you want to clear all saved data?')) {
        localStorage.removeItem('stateColors');
        alert('Saved data cleared! Refreshing the page...');
        setTimeout(() => location.reload(), 1000);
      }
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
  let temperatureData = {};

  // Enhanced Tooltip setup
  const tooltip = d3.select('#state-tooltip');
  let hoverTimeout;

  // Function to show tooltip
  function showTooltip(event, d) {
    clearTimeout(hoverTimeout);

    const stateName = d.properties.name;
    const stateAbbr = Object.keys(stateAbbreviations).find(
      (abbr) => stateAbbreviations[abbr] === stateName
    );

    if (!stateAbbr) return;

    const temp = temperatureData[stateAbbr];
    const city = stateCities[stateAbbr] ? stateCities[stateAbbr][0] : 'Unknown';

    tooltip.select('.tooltip-title').text(stateName);
    tooltip.select('.tooltip-city').text(city);
    tooltip
      .select('.tooltip-temp')
      .text(temp !== undefined && temp !== null ? `${temp}°F` : 'No data');

    // Calculate position with boundary checking
    const tooltipWidth = 220;
    const tooltipHeight = 100;
    const padding = 20;

    let left = event.pageX + 15;
    let top = event.pageY + 15;

    // Adjust if too close to right edge
    if (left + tooltipWidth > window.innerWidth) {
      left = event.pageX - tooltipWidth - 5;
    }

    // Adjust if too close to bottom edge
    if (top + tooltipHeight > window.innerHeight) {
      top = event.pageY - tooltipHeight - 5;
    }

    // Ensure minimum padding from edges
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipWidth - padding)
    );
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipHeight - padding)
    );

    tooltip
      .style('left', left + 'px')
      .style('top', top + 'px')
      .classed('show', true);
  }

  // Function to hide tooltip
  function hideTooltip() {
    hoverTimeout = setTimeout(() => {
      tooltip.classed('show', false);
    }, 200);
  }

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

  // Fetch hottest city temperature for each state based on selected date
  async function fetchHottestCityTemperatures(selectedDate) {
    const temperatureData = {};
    const forecastDate = selectedDate;
    const formattedDate = forecastDate.toISOString().split('T')[0];

    loadingMessage.textContent = `Finding hottest cities for ${formattedDate} (${forecastDate.toDateString()})...`;

    // Process each state
    for (const [state, cities] of Object.entries(stateCities)) {
      let maxTemp = -Infinity;
      let hottestCityTemp = null;

      // Check each city in the state
      for (const city of cities) {
        try {
          const response = await fetch(
            `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${city},${state}&dt=${formattedDate}`
          );
          if (!response.ok) {
            console.error(`Failed to fetch data for ${city}, ${state}`);
            continue;
          }

          const data = await response.json();

          // Get the forecast for the exact selected date
          if (
            data.forecast &&
            data.forecast.forecastday &&
            data.forecast.forecastday[0]
          ) {
            const temp = data.forecast.forecastday[0].day.maxtemp_f;
            if (temp > maxTemp) {
              maxTemp = temp;
              hottestCityTemp = temp;
            }
          } else {
            console.log(
              `No forecast found for ${city}, ${state} on ${formattedDate}`
            );
          }
        } catch (error) {
          console.error(`Error fetching data for ${city}, ${state}:`, error);
        }
      }

      temperatureData[state] = hottestCityTemp;
    }

    return temperatureData;
  }

  // Determine state color based on temperature or manual selection
  function getStateColor(stateName, stateAbbr) {
    // Manual color takes precedence
    if (stateColors[stateName]) {
      return stateColors[stateName];
    }

    // Then check for temperature data
    if (
      stateAbbr &&
      temperatureData[stateAbbr] !== undefined &&
      temperatureData[stateAbbr] !== null
    ) {
      return temperatureData[stateAbbr] >= 70 ? colors[2] : colors[1];
    }

    // Default color
    return colors[0];
  }

  // Function to update the map with new data
  async function updateMapWithNewData(selectedDate) {
    loadingMessage.style.display = 'block';

    try {
      // Fetch new temperature data
      temperatureData = await fetchHottestCityTemperatures(selectedDate);
      console.log('Temperature data:', temperatureData);

      // Update all state colors
      d3.selectAll('.state')
        .attr('fill', function (d) {
          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );
          return getStateColor(d.properties.name, stateAbbr);
        })
        .attr('data-color-index', function (d) {
          const savedColor = stateColors[d.properties.name];
          if (savedColor) {
            return savedColor === colors[1]
              ? 1
              : savedColor === colors[2]
              ? 2
              : 0;
          }

          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );

          if (
            stateAbbr &&
            temperatureData[stateAbbr] !== undefined &&
            temperatureData[stateAbbr] !== null
          ) {
            return temperatureData[stateAbbr] >= 70 ? 2 : 1;
          }

          return 0;
        });
    } catch (error) {
      console.error('Error updating map:', error);
      loadingMessage.textContent =
        'Error updating weather data. Please try again.';
    } finally {
      loadingMessage.style.display = 'none';
    }
  }

  // Event listener for date changes
  datePicker.addEventListener('change', function () {
    if (this.value) {
      const selectedDate = new Date(this.value);
      const estDate = toEasternTime(selectedDate);
      updateMapWithNewData(estDate);
    }
  });

  // Load and draw the US map
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(async function (us) {
      // Initial load with the date from the picker (which is today in EST by default)
      const initialDate = new Date(datePicker.value);
      const estInitialDate = toEasternTime(initialDate);
      temperatureData = await fetchHottestCityTemperatures(estInitialDate);

      // Then proceed with map drawing
      loadingMessage.textContent = 'Drawing temperature map...';
      const states = topojson.feature(us, us.objects.states).features;

      // Draw states with saved colors or temperature-based colors
      svg
        .selectAll('.state')
        .data(states)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', function (d) {
          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );
          return getStateColor(d.properties.name, stateAbbr);
        })
        .attr('data-color-index', function (d) {
          const savedColor = stateColors[d.properties.name];
          if (savedColor) {
            return savedColor === colors[1]
              ? 1
              : savedColor === colors[2]
              ? 2
              : 0;
          }

          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );

          if (
            stateAbbr &&
            temperatureData[stateAbbr] !== undefined &&
            temperatureData[stateAbbr] !== null
          ) {
            return temperatureData[stateAbbr] >= 70 ? 2 : 1;
          }

          return 0;
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
        })
        .on('mouseover', function (event, d) {
          showTooltip(event, d);
          d3.select(this)
            .attr('stroke-width', '1.5px')
            .attr('stroke', 'var(--primary-color)');
        })
        .on('mouseout', function () {
          hideTooltip();
          d3.select(this)
            .attr('stroke-width', '1px')
            .attr('stroke', 'var(--state-stroke)');
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

          // Special adjustments for specific states
          const stateAdjustments = {
            // Small states with connectors
            NH: { angle: Math.PI / 0.7, distanceMultiplier: 1 },
            RI: { angle: Math.PI / 0.5, distanceMultiplier: 1 },
            CT: { angle: Math.PI / 7.2, distanceMultiplier: 1 },
            MD: { angle: Math.PI / 5, distanceMultiplier: 1 },
            DE: { angle: Math.PI / 14, distanceMultiplier: 1 },
            NJ: { angle: -Math.PI / 0.51428, distanceMultiplier: 1 },
            MA: { angle: Math.PI / 0.545454, distanceMultiplier: 1 },
            VT: { angle: Math.PI / 0.8, distanceMultiplier: 1 },

            // Large states with manual offsets
            FL: { xOffset: 30, yOffset: 25 }, // Move Florida text down
            MI: { xOffset: 19, yOffset: 40 }, // Move Michigan text left and down
            LA: { xOffset: 0, yOffset: 10 }, // Move Louisiana text down slightly
            WA: { xOffset: 0, yOffset: -10 }, // Move Washington text up slightly
            CA: { xOffset: 10, yOffset: 0 }, // Move California text right
            TX: { xOffset: -15, yOffset: 0 }, // Move Texas text left
            NY: { xOffset: 5, yOffset: -5 }, // Move New York text right and up slightly
            PA: { xOffset: 0, yOffset: -5 }, // Move Pennsylvania text up slightly
            HI: { xOffset: 0, yOffset: 15 }, // Move Hawaii text down
            AK: { xOffset: 0, yOffset: -15 }, // Move Alaska text up
          };

          if (isSmallState) {
            const distance = 80;
            let angle = 0;
            let distanceMultiplier = 1.5;

            if (stateAdjustments[abbr]) {
              angle = stateAdjustments[abbr].angle;
              distanceMultiplier = stateAdjustments[abbr].distanceMultiplier;
            }

            const adjustedDistance = distance * distanceMultiplier;
            const textX = centroid[0] + Math.cos(angle) * adjustedDistance;
            const textY = centroid[1] + Math.sin(angle) * adjustedDistance;

            group
              .append('line')
              .attr('x1', centroid[0])
              .attr('y1', centroid[1])
              .attr('x2', textX)
              .attr('y2', textY)
              .attr('stroke', function () {
                return document.body.classList.contains('dark-mode')
                  ? '#f1c40f'
                  : '#555';
              })
              .attr('stroke-width', function () {
                return document.body.classList.contains('dark-mode') ? 3 : 2;
              })
              .attr('stroke-dasharray', function () {
                return document.body.classList.contains('dark-mode')
                  ? '8,6'
                  : '6,4';
              })
              .attr('opacity', function () {
                return document.body.classList.contains('dark-mode')
                  ? 0.9
                  : 0.7;
              });

            group
              .append('text')
              .attr('class', 'state-abbr')
              .attr('x', textX)
              .attr('y', textY)
              .attr('dy', '.35em')
              .text(abbr);
          } else {
            // Apply manual offsets for larger states if needed
            const adjustment = stateAdjustments[abbr] || {
              xOffset: 0,
              yOffset: 0,
            };
            group
              .append('text')
              .attr('class', 'state-abbr')
              .attr('x', centroid[0] + adjustment.xOffset)
              .attr('y', centroid[1] + adjustment.yOffset)
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

    // Update state abbreviations and lines
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

      if (!abbr) return;

      const centroid = path.centroid(d);
      const isSmallState = smallStates.includes(abbr);

      // Special adjustments for specific states
      const stateAdjustments = {
        FL: { xOffset: 30, yOffset: 25 }, // Move Florida text down
        MI: { xOffset: 19, yOffset: 40 }, // Move Michigan text left and down
        LA: { xOffset: 0, yOffset: 10 }, // Move Louisiana text down slightly
        WA: { xOffset: 0, yOffset: -10 }, // Move Washington text up slightly
        CA: { xOffset: 10, yOffset: 0 }, // Move California text right
        TX: { xOffset: -15, yOffset: 0 }, // Move Texas text left
        NY: { xOffset: 5, yOffset: -5 }, // Move New York text right and up slightly
        PA: { xOffset: 0, yOffset: -5 }, // Move Pennsylvania text up slightly
        HI: { xOffset: 0, yOffset: 15 }, // Move Hawaii text down
        AK: { xOffset: 0, yOffset: -15 }, // Move Alaska text up
      };

      if (isSmallState) {
        const distance = 80;
        let angle = 0;
        let distanceMultiplier = 1.5;

        const smallStateAdjustments = {
          NH: { angle: Math.PI / 0.7, distanceMultiplier: 1.3 },
          RI: { angle: Math.PI / 0.5, distanceMultiplier: 1.3 },
          CT: { angle: Math.PI / 7.2, distanceMultiplier: 1.2 },
          MD: { angle: Math.PI / 5, distanceMultiplier: 1.2 },
          DE: { angle: Math.PI / 14, distanceMultiplier: 1.4 },
          NJ: { angle: -Math.PI / 0.51428, distanceMultiplier: 1.3 },
          MA: { angle: Math.PI / 0.545454, distanceMultiplier: 1.3 },
          VT: { angle: Math.PI / 0.8, distanceMultiplier: 1.2 },
        };

        if (smallStateAdjustments[abbr]) {
          angle = smallStateAdjustments[abbr].angle;
          distanceMultiplier = smallStateAdjustments[abbr].distanceMultiplier;
        }

        const adjustedDistance = distance * distanceMultiplier;
        const textX = centroid[0] + Math.cos(angle) * adjustedDistance;
        const textY = centroid[1] + Math.sin(angle) * adjustedDistance;

        group
          .select('line')
          .attr('x1', centroid[0])
          .attr('y1', centroid[1])
          .attr('x2', textX)
          .attr('y2', textY)
          .attr('stroke', function () {
            return document.body.classList.contains('dark-mode')
              ? '#f1c40f'
              : '#555';
          })
          .attr('stroke-width', function () {
            return document.body.classList.contains('dark-mode') ? 3 : 2;
          })
          .attr('stroke-dasharray', function () {
            return document.body.classList.contains('dark-mode')
              ? '8,6'
              : '6,4';
          })
          .attr('opacity', function () {
            return document.body.classList.contains('dark-mode') ? 0.9 : 0.7;
          });

        group.select('text').attr('x', textX).attr('y', textY);
      } else {
        const adjustment = stateAdjustments[abbr] || { xOffset: 0, yOffset: 0 };
        group
          .select('text')
          .attr('x', centroid[0] + adjustment.xOffset)
          .attr('y', centroid[1] + adjustment.yOffset);
      }
    });

    // Reposition tooltip if visible
    if (tooltip.style('opacity') === '1') {
      const [x, y] = d3.pointer(event, svg.node());
      tooltip.style('left', x + 10 + 'px').style('top', y + 10 + 'px');
    }
  });
});
