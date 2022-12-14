let myGlobe;
let btn = document.getElementById("btn");
let date_input = document.getElementById('date_input');
let colorCodes;
let countries_centroids;
let covid_data;

btn.onclick = () => {
  myGlobe
    .pointAltitude(
      ({properties: d}) => Math.log10(d.NEW_CASES + 1)/ Math.log10(100000000) + 0.01
    )
    .pointColor(({ properties: d }) => {
      let color = colorCodes[d.ISO];
      if (color === undefined) { return undefined; }
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
  return Math.log10(altitude + 1)/ Math.log10(100000000) + 0.01
}

function update_visualization(data) {
  myGlobe
    .pointsData(data.features)
    .pointAltitude(
      ({properties: d}) => { return altituteConversion(d.NEW_CASES); }
    );
}

function create_visualization(data) {
  myGlobe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .pointsData(data.features)
    .pointAltitude(
      ({properties: d}) => { return altituteConversion(d.NEW_CASES); }
    )
    .pointColor(({ properties: d }) => {
      let color = colorCodes[d.ISO];
      if (color === undefined) { return undefined; }
      color = `${color.slice(0, -2)}${percentToHex(d.NEW_CASES ? 100 : 20)}`;
      return color;
    })
    .pointLabel(({ properties: d}) => `Country: ${d.COUNTRY}\nNew cases: ${d.NEW_CASES}\nCumulative cases: ${d.CUMULATIVE_CASES}\n
      New deaths: ${d.NEW_DEATHS}\nCumulative deaths: ${d.CUMULATIVE_DEATHS}`)
    (document.getElementById("globeViz"));;
}


// Map each country centroid with the covid data for a specific date
function process_data_by_date(date) {
  covid_data_filtered = covid_data.filter((el) => el.Date_reported == date);

  countries_covid = countries_centroids
  countries_covid.features = countries_covid.features.map(function(country) {
    let value = covid_data_filtered.find((v) => v.Country_code == country.properties.ISO)
    if (value !== undefined) {
      country.properties.NEW_CASES = value.New_cases
      country.properties.CUMULATIVE_CASES = value.Cumulative_cases
      country.properties.NEW_DEATHS = value.New_deaths
      country.properties.CUMULATIVE_DEATHS = value.Cumulative_deaths
    }
    else {
      return undefined
    }

    return country
  });

  countries_covid.features = countries_covid.features.filter((v) => { return v !== undefined; });
  return countries_covid;
}

function init() {
  countries_centroid_promise = d3.json('./datasets/countries_centroids.geojson')
  covid_data_promise = d3.csv('./datasets/WHO-COVID-19-global-data.csv')

  Promise.all([countries_centroid_promise, covid_data_promise])
    .then((data) => {
      countries_centroids = data[0]
      covid_data = data[1]

      countries_centroids.features.map(function(country) {
        country.lng = country.geometry.coordinates[0]
        country.lat = country.geometry.coordinates[1]

        return country
      })

      let date = '2021-01-03';
      countries_covid = process_data_by_date(date);
      create_visualization(countries_covid)

    })
}

window.addEventListener('load', init);
date_input.addEventListener('input', (e) => update_visualization(process_data_by_date(e.target.value)))



