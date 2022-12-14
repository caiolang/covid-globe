let myGlobe;
let btn = document.getElementById("btn");
let colorCodes;

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

function create_vizualisation(data) {

  myGlobe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .pointsData(data.features)
    .pointAltitude(
      ({properties: d}) => Math.log10(d.NEW_CASES + 1)/ Math.log10(100000000) + 0.01
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

function init() {
  countries_centroid_promise = d3.json('./datasets/countries_centroids.geojson')
  covid_data_promise = d3.csv('./datasets/WHO-COVID-19-global-data.csv')

  Promise.all([countries_centroid_promise, covid_data_promise])
    .then((data) => {
      countries_centroid = data[0]
      covid_data = data[1]


      let date = '2021-01-03';
      covid_data_filtered = covid_data.filter((el) => el.Date_reported == date)

      countries_centroid.features.map(function(country) {
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

        country.lng = country.geometry.coordinates[0]
        country.lat = country.geometry.coordinates[1]

        return country
      })

      countries_centroid.features = countries_centroid.features.filter((v) => { return v !== undefined })

      create_vizualisation(countries_centroid)

    })
}

window.addEventListener('load', init);



