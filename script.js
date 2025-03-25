document.addEventListener('DOMContentLoaded', function () {
  // Set default date to today
  const datePicker = document.getElementById('date-picker');
  const today = new Date();
  datePicker.valueAsDate = today;

  // Print button functionality with rendering delay
  document.getElementById('print-btn').addEventListener('click', function () {
    setTimeout(() => {
      window.print();
    }, 100);
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

  // State abbreviations
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

  // Load and draw the US map
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(
    function (us) {
      const states = topojson.feature(us, us.objects.states).features;

      // Draw states
      svg
        .selectAll('.state')
        .data(states)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', colors[0])
        .attr('data-color-index', 0)
        .on('click', function (event, d) {
          const currentIndex = +d3.select(this).attr('data-color-index');
          const nextIndex = (currentIndex + 1) % colors.length;
          d3.select(this)
            .attr('fill', colors[nextIndex])
            .attr('data-color-index', nextIndex);
        });

      // Add state abbreviations
      svg
        .selectAll('.state-abbr')
        .data(states)
        .enter()
        .append('text')
        .attr('class', 'state-abbr')
        .attr('transform', function (d) {
          const centroid = path.centroid(d);
          return 'translate(' + centroid + ')';
        })
        .attr('dy', '.35em')
        .text(function (d) {
          const stateName = d.properties.name;
          for (const abbr in stateAbbreviations) {
            if (stateAbbreviations[abbr] === stateName) {
              return abbr;
            }
          }
          return '';
        });
    }
  );

  // Handle window resize
  window.addEventListener('resize', function () {
    const newWidth = window.innerWidth;
    const newHeight =
      window.innerHeight - document.querySelector('header').offsetHeight;

    svg.attr('width', newWidth).attr('height', newHeight);

    projection.translate([newWidth / 2, newHeight / 2]).scale(newWidth);

    svg.selectAll('.state').attr('d', path);

    svg.selectAll('.state-abbr').attr('transform', function (d) {
      const centroid = path.centroid(d);
      return 'translate(' + centroid + ')';
    });
  });
});
