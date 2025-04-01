document.addEventListener('DOMContentLoaded', function () {
  // Configuration constants
  const WEATHER_API_KEY = 'c8770350a4744a86bbd193337252603';
  const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
  const SMALL_STATES = ['CT', 'DE', 'MA', 'MD', 'NH', 'NJ', 'RI', 'VT'];
  const COLORS = ['#f0f0f0', '#a8d8ea', '#ff6b6b'];
  const MAX_CONCURRENT_REQUESTS = 6;
  const REQUEST_TIMEOUT = 5000;

  // Convert date to Eastern Time (UTC-5)
  function toEasternTime(date) {
    const estOffset = date.getTimezoneOffset() + 300;
    return new Date(date.getTime() + estOffset * 60000);
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

  // DOM elements
  const darkModeSwitch = document.getElementById('dark-mode-switch');
  const toggleText = document.querySelector('.toggle-text');
  const datePicker = document.getElementById('date-picker');
  const loadingMessage = createLoadingMessage();
  const tooltip = d3.select('#state-tooltip');
  let hoverTimeout;
  let temperatureData = {};
  let manualColors = {}; // Track manually set colors
  let svg, projection, path;

  function createLoadingMessage() {
    const msg = document.createElement('div');
    msg.className = 'loading-message';
    msg.textContent = 'Loading map...';
    document.body.appendChild(msg);
    return msg;
  }

  function initializeDatePicker() {
    const today = new Date();
    const estToday = toEasternTime(today);
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const estTwoWeeksLater = toEasternTime(twoWeeksLater);

    datePicker.valueAsDate = estToday;
    datePicker.max = estTwoWeeksLater.toISOString().split('T')[0];
  }

  function setupDarkModeToggle() {
    // Load saved preference or default to light mode
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode === 'true';

    // Apply the saved mode
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      darkModeSwitch.checked = true;
      toggleText.textContent = 'Light Mode';
    }

    darkModeSwitch.addEventListener('change', function () {
      const isDarkMode = this.checked;
      document.body.classList.toggle('dark-mode', isDarkMode);
      toggleText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';

      // Save preference to localStorage
      localStorage.setItem('darkMode', isDarkMode);

      refreshStateAbbreviations();
    });
  }

  function refreshStateAbbreviations() {
    const abbrs = document.querySelectorAll('.state-abbr');
    abbrs.forEach((abbr) => {
      abbr.style.display = 'none';
      abbr.offsetHeight;
      abbr.style.display = null;
    });
  }

  function setupButtons() {
    document.getElementById('print-btn').addEventListener('click', function () {
      window.print();
    });
    document.getElementById('clear-storage').style.display = 'none';
  }

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
      .text(temp !== undefined ? `${temp}°F` : 'No data');

    positionTooltip(event);
  }

  function positionTooltip(event) {
    const tooltipWidth = 220;
    const tooltipHeight = 100;
    const padding = 20;

    let left = event.pageX + 15;
    let top = event.pageY + 15;

    if (left + tooltipWidth > window.innerWidth) {
      left = event.pageX - tooltipWidth - 5;
    }

    if (top + tooltipHeight > window.innerHeight) {
      top = event.pageY - tooltipHeight - 5;
    }

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

  function hideTooltip() {
    hoverTimeout = setTimeout(() => {
      tooltip.classed('show', false);
    }, 200);
  }

  async function fetchWeatherData(city, state, formattedDate, retries = 2) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${city},${state}&dt=${formattedDate}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchWeatherData(city, state, formattedDate, retries - 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWeatherData(city, state, formattedDate, retries - 1);
      }
      console.error(`Failed to fetch data for ${city}, ${state}:`, error);
      return null;
    }
  }

  async function processStateCities(state, cities, formattedDate) {
    let maxTemp = -Infinity;
    const cityPromises = [];

    for (const city of cities) {
      cityPromises.push(
        (async () => {
          try {
            const data = await fetchWeatherData(city, state, formattedDate);
            if (data?.forecast?.forecastday?.[0]) {
              const temp = data.forecast.forecastday[0].day.maxtemp_f;
              if (temp > maxTemp) maxTemp = temp;
            }
          } catch (error) {
            console.error(`Error processing ${city}, ${state}:`, error);
          }
        })()
      );
    }

    await Promise.all(cityPromises);
    return maxTemp !== -Infinity ? maxTemp : null;
  }

  async function fetchHottestCityTemperatures(selectedDate) {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const newTemperatureData = {};
    const states = Object.keys(stateCities);
    loadingMessage.textContent = `Loading temperatures for ${formattedDate}...`;
    loadingMessage.style.display = 'block';

    const batchSize = MAX_CONCURRENT_REQUESTS;
    for (let i = 0; i < states.length; i += batchSize) {
      const batch = states.slice(i, i + batchSize);
      const batchPromises = batch.map((state) =>
        processStateCities(state, stateCities[state], formattedDate).then(
          (temp) => {
            newTemperatureData[state] = temp;
            updateLoadingProgress(i + batch.indexOf(state) + 1, states.length);
          }
        )
      );

      await Promise.all(batchPromises);
    }

    return newTemperatureData;
  }

  function updateLoadingProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    loadingMessage.textContent = `Loading temperatures... ${current}/${total} states (${percent}%)`;
  }

  function getStateColor(stateName, stateAbbr) {
    if (manualColors[stateName] !== undefined) {
      return manualColors[stateName];
    }

    if (
      !stateAbbr ||
      temperatureData[stateAbbr] === undefined ||
      temperatureData[stateAbbr] === null
    ) {
      return COLORS[0];
    }
    return temperatureData[stateAbbr] >= 70 ? COLORS[2] : COLORS[1];
  }

  function handleStateClick(event, d) {
    const stateName = d.properties.name;
    const currentColor = d3.select(this).attr('fill');
    const currentIndex = COLORS.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % COLORS.length;

    manualColors[stateName] = COLORS[nextIndex];

    d3.select(this)
      .attr('fill', COLORS[nextIndex])
      .attr('data-color-index', nextIndex);
  }

  async function updateMapWithNewData(selectedDate) {
    loadingMessage.style.display = 'block';

    try {
      temperatureData = await fetchHottestCityTemperatures(selectedDate);

      d3.selectAll('.state')
        .attr('fill', function (d) {
          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );
          return getStateColor(d.properties.name, stateAbbr);
        })
        .attr('data-color-index', function (d) {
          const stateAbbr = Object.keys(stateAbbreviations).find(
            (abbr) => stateAbbreviations[abbr] === d.properties.name
          );
          const color = getStateColor(d.properties.name, stateAbbr);
          return COLORS.indexOf(color);
        });
    } catch (error) {
      console.error('Error updating map:', error);
      loadingMessage.textContent =
        'Error updating weather data. Please try again.';
    } finally {
      loadingMessage.style.display = 'none';
    }
  }

  function init() {
    initializeDatePicker();
    setupDarkModeToggle();
    setupButtons();

    datePicker.addEventListener('change', function () {
      if (this.value) {
        manualColors = {}; // Reset manual colors when date changes
        const selectedDate = new Date(this.value);
        const estDate = toEasternTime(selectedDate);
        updateMapWithNewData(estDate);
      }
    });

    // Load and draw the US map
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(async function (us) {
        const initialDate = new Date(datePicker.value);
        const estInitialDate = toEasternTime(initialDate);
        temperatureData = await fetchHottestCityTemperatures(estInitialDate);

        loadingMessage.textContent = 'Drawing temperature map...';
        const states = topojson.feature(us, us.objects.states).features;

        const width = window.innerWidth;
        const height =
          window.innerHeight - document.querySelector('header').offsetHeight;
        svg = d3.select('#us-map').attr('width', width).attr('height', height);

        projection = d3
          .geoAlbersUsa()
          .translate([width / 2, height / 2])
          .scale(width);

        path = d3.geoPath().projection(projection);

        // Draw states
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
            const stateAbbr = Object.keys(stateAbbreviations).find(
              (abbr) => stateAbbreviations[abbr] === d.properties.name
            );
            const color = getStateColor(d.properties.name, stateAbbr);
            return COLORS.indexOf(color);
          })
          .on('click', handleStateClick)
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

        // Add state abbreviations
        svg
          .selectAll('.state-abbr-container')
          .data(states)
          .enter()
          .append('g')
          .attr('class', 'state-abbr-container')
          .each(function (d) {
            const group = d3.select(this);
            const stateName = d.properties.name;
            const abbr = Object.keys(stateAbbreviations).find(
              (a) => stateAbbreviations[a] === stateName
            );

            if (!abbr) return;

            const centroid = path.centroid(d);
            const isSmallState = SMALL_STATES.includes(abbr);

            const adjustments = {
              NH: { angle: Math.PI / 0.7, distanceMultiplier: 1 },
              RI: { angle: Math.PI / 0.5, distanceMultiplier: 1 },
              CT: { angle: Math.PI / 7.2, distanceMultiplier: 1 },
              MD: { angle: Math.PI / 5, distanceMultiplier: 1 },
              DE: { angle: Math.PI / 14, distanceMultiplier: 1 },
              NJ: { angle: -Math.PI / 0.51428, distanceMultiplier: 1 },
              MA: { angle: Math.PI / 0.545454, distanceMultiplier: 1 },
              VT: { angle: Math.PI / 0.8, distanceMultiplier: 1 },
              FL: { xOffset: 30, yOffset: 25 },
              MI: { xOffset: 19, yOffset: 40 },
              LA: { xOffset: 0, yOffset: 10 },
              WA: { xOffset: 0, yOffset: -10 },
              CA: { xOffset: 10, yOffset: 0 },
              TX: { xOffset: -15, yOffset: 0 },
              NY: { xOffset: 5, yOffset: -5 },
              PA: { xOffset: 0, yOffset: -5 },
              HI: { xOffset: 0, yOffset: 15 },
              AK: { xOffset: 0, yOffset: -15 },
            };

            if (isSmallState) {
              const distance = 80;
              let angle = 0;
              let distanceMultiplier = 1.5;

              if (adjustments[abbr]) {
                angle = adjustments[abbr].angle;
                distanceMultiplier = adjustments[abbr].distanceMultiplier || 1;
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
                });

              group
                .append('text')
                .attr('class', 'state-abbr')
                .attr('x', textX)
                .attr('y', textY)
                .attr('dy', '.35em')
                .text(abbr);
            } else {
              const adjustment = adjustments[abbr] || {
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
        const abbr = Object.keys(stateAbbreviations).find(
          (a) => stateAbbreviations[a] === stateName
        );

        if (!abbr) return;

        const centroid = path.centroid(d);
        const isSmallState = SMALL_STATES.includes(abbr);

        const adjustments = {
          NH: { angle: Math.PI / 0.7, distanceMultiplier: 1.3 },
          RI: { angle: Math.PI / 0.5, distanceMultiplier: 1.3 },
          CT: { angle: Math.PI / 7.2, distanceMultiplier: 1.2 },
          MD: { angle: Math.PI / 5, distanceMultiplier: 1.2 },
          DE: { angle: Math.PI / 14, distanceMultiplier: 1.4 },
          NJ: { angle: -Math.PI / 0.51428, distanceMultiplier: 1.3 },
          MA: { angle: Math.PI / 0.545454, distanceMultiplier: 1.3 },
          VT: { angle: Math.PI / 0.8, distanceMultiplier: 1.2 },
          FL: { xOffset: 30, yOffset: 25 },
          MI: { xOffset: 19, yOffset: 40 },
          LA: { xOffset: 0, yOffset: 10 },
          WA: { xOffset: 0, yOffset: -10 },
          CA: { xOffset: 10, yOffset: 0 },
          TX: { xOffset: -15, yOffset: 0 },
          NY: { xOffset: 5, yOffset: -5 },
          PA: { xOffset: 0, yOffset: -5 },
          HI: { xOffset: 0, yOffset: 15 },
          AK: { xOffset: 0, yOffset: -15 },
        };

        if (isSmallState) {
          const distance = 80;
          let angle = 0;
          let distanceMultiplier = 1.5;

          if (adjustments[abbr]) {
            angle = adjustments[abbr].angle;
            distanceMultiplier = adjustments[abbr].distanceMultiplier || 1;
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
        } else {
          const adjustment = adjustments[abbr] || { xOffset: 0, yOffset: 0 };
          group
            .select('text')
            .attr('x', centroid[0] + adjustment.xOffset)
            .attr('y', centroid[1] + adjustment.yOffset);
        }
      });
    });
  }

  // Start the application
  init();
});
