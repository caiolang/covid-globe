let myGlobe;
let btn = document.getElementById("btn");
let date_input = document.getElementById("date_input");
let metric_option = document.getElementById("metric_option");
let colorCodes;
let countries_covid;
let maxDate;
let minDate;

btn.onclick = () => {
  myGlobe
    .pointAltitude(
      ({ properties: d }) =>
        Math.log10(d.NEW_CASES + 1) / Math.log10(100000000) + 0.01
    )
    .pointColor(({ properties: d }) => {
      let color = colorCodes[d.ISO];
      if (color === undefined) {
        return undefined;
      }
      color = `${color.slice(0, -2)}${percentToHex(d.NEW_CASES ? 100 : 20)}`;
      return color;
    });
};

const percentToHex = (p) => {
  const percent = Math.max(0, Math.min(100, p)); // bound percent from 0 to 100
  const intValue = Math.round((percent / 100) * 255); // map percent to nearest integer (0 - 255)
  const hexValue = intValue.toString(16); // get hexadecimal representation
  return hexValue.padStart(2, "0").toUpperCase(); // format with leading 0 and upper case characters
};

fetch("./datasets/colors.json")
  .then((res) => res.json())
  .then((colors) => {
    colorCodes = colors;
  });

//TODO: Maybe change this to a more interpretable one
function altituteConversion(altitude) {
  return Math.log10(altitude + 1) / Math.log10(100000000) + 0.01;
}

function update_visualization() {
  date = date_input.value;
  metric = metric_option.value;
  myGlobe
    .pointsData(countries_covid.features)
    .pointAltitude(({ properties: d }) => {
      // console.log(d.data)
      if (d.data !== undefined && date in d.data) {
        return altituteConversion(d.data[date][metric]);
      } else if (d.data === undefined || new Date(date) < new Date(minDate)) {
        return altituteConversion(0);
      } else {
        if (metric === "CUMULATIVE_CASES" || metric === "CUMULATIVE_DEATHS") {
          return altituteConversion(
            metric === "CUMULATIVE_CASES"
              ? d.data.cumulative_cases_max
              : d.data.cumulative_deaths_max
          );
        } else {
          return altituteConversion(0);
        }
      }
    })
    .pointColor(({ properties: d }) => {
      //TODO: Define color behavior (based on daily change in the metric ?);
      let color = colorCodes[d.ISO];
      if (color === undefined) {
        return undefined;
      }
      if (d.data !== undefined && date in d.data) {
        color = `${color.slice(0, -2)}${percentToHex(
          d.data[date].NEW_CASES ? 100 : 20
        )}`;
      } else {
        color = "red";
      }

      return color;
    })
    .pointLabel(({ properties: d }) => {
      if (d.data !== undefined && date in d.data) {
        return `Country: ${d.COUNTRY}\nNew cases: ${d.data[date].NEW_CASES}\nCumulative cases: ${d.data[date].CUMULATIVE_CASES}\n
        New deaths: ${d.data[date].NEW_DEATHS}\nCumulative deaths: ${d.data[date].CUMULATIVE_DEATHS}`;
      } else if (d.data === undefined || new Date(date) < new Date(minDate)) {
        return `Country: ${d.COUNTRY}\nNew cases: 0\nCumulative cases: 0\n
        New deaths: 0\nCumulative deaths: 0`;
      } else {
        return `Country: ${d.COUNTRY}\nNew cases: 0\nCumulative cases: ${d.data.cumulative_cases_max}\n
        New deaths: 0\nCumulative deaths: ${d.data.cumulative_deaths_max}`;
      }
    });
}

function init() {
  countries_centroid_promise = d3.json(
    "./datasets/countries_centroids.geojson"
  );
  covid_data_promise = d3.csv("./datasets/WHO-COVID-19-global-data.csv");
  // covid_data_promise = d3.csv('https://covid19.who.int/WHO-COVID-19-global-data.csv');

  Promise.all([countries_centroid_promise, covid_data_promise]).then((data) => {
    countries_covid = data[0];
    covid_data = data[1];

    // Map each country code to a date->value dictionary
    country_covid = {};
    covid_data.forEach((row) => {
      if (!(row.Country_code in country_covid)) {
        country_covid[row.Country_code] = {};
        country_covid[row.Country_code].cumulative_cases_max = 0;
        country_covid[row.Country_code].cumulative_deaths_max = 0;
      }
      country_covid[row.Country_code][row.Date_reported] = new Object();
      country_covid[row.Country_code][row.Date_reported].NEW_CASES =
        row.New_cases;
      country_covid[row.Country_code][row.Date_reported].CUMULATIVE_CASES =
        row.Cumulative_cases;
      country_covid[row.Country_code][row.Date_reported].NEW_DEATHS =
        row.New_deaths;
      country_covid[row.Country_code][row.Date_reported].CUMULATIVE_DEATHS =
        row.Cumulative_deaths;

      country_covid[row.Country_code].cumulative_cases_max = Math.max(
        country_covid[row.Country_code].cumulative_cases_max,
        row.Cumulative_cases
      );

      country_covid[row.Country_code].cumulative_deaths_max = Math.max(
        country_covid[row.Country_code].cumulative_deaths_max,
        row.Cumulative_deaths
      );
    });

    countries_covid.features.map(function (country) {
      country.lng = country.geometry.coordinates[0];
      country.lat = country.geometry.coordinates[1];

      country.properties.data = country_covid[country.properties.ISO];

      return country;
    });

    // console.log(country_covid);

    let date = "2021-01-03";
    let dates = covid_data
      .map((el) => {
        return new Date(el.Date_reported);
      })
      .filter((value) => value instanceof Date && isFinite(value));
    minDate = dates.reduce(function (a, b) {
      return a < b ? a : b;
    });
    maxDate = dates.reduce(function (a, b) {
      return a > b ? a : b;
    });
    date_input.value = date;
    // date_input.max = maxDate;
    // date_input.min = minDate;

    // countries_covid = process_data_by_date(date);
    myGlobe = Globe().globeImageUrl(
      "//unpkg.com/three-globe/example/img/earth-night.jpg"
    )(document.getElementById("globeViz"));
    update_visualization();
  });
}

window.addEventListener("load", init);
date_input.addEventListener("input", update_visualization);
metric_option.addEventListener("input", update_visualization);
