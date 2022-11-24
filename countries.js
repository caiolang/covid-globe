let myGlobe;
let btn = document.getElementById("btn");
let colorCodes;

btn.onclick = () => {
  myGlobe
    // .hexPolygonAltitude(({ properties: d }) =>
    //   d.cases ? 0.25 : Math.random() / 1000 + 0.001
    // )
    .hexPolygonAltitude(
      ({properties: d}) => Math.log10(d.NEW_CASES + 1)/ Math.log10(100000000) + 0.01
    )
    .hexPolygonColor(({ properties: d }) => {
      let color = colorCodes[d.ISO_A2];
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

fetch("./datasets/countries_covid.geojson")
  .then((res) => res.json())
  .then((countries) => {
      let date = '2021-01-03';

      d3.csv('./datasets/WHO-COVID-19-global-data.csv')
        .then((data) => {
          data = data.filter((el) => el.Date_reported == date)

          countries.features.map(function (elem) {
            let value = data.find((v) => v.Country_code == elem.properties.ISO_A2)
            if (value !== undefined) {
              elem.properties.NEW_CASES = value.New_cases
              elem.properties.CUMULATIVE_CASES = value.Cumulative_cases
              elem.properties.NEW_DEATHS = value.New_deaths
              elem.properties.CUMULATIVE_DEATHS = value.Cumulative_deaths
            }

            return elem
          })

          myGlobe = Globe()
            .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
            .hexPolygonsData(countries.features)
            .hexPolygonResolution(2)
            .hexPolygonMargin(0.3)
            .hexPolygonsTransitionDuration(500)
            .hexPolygonColor(({ properties: d }) => {
              // console.log(colorCodes[d.ISO_A2]);
              return colorCodes[d.ISO_A2];
            })
            .hexPolygonLabel(
              ({ properties: d }) => `
              <b>${d.ADMIN} (${d.ISO_A2})</b> <br />
              Population: <i>${d.POP_EST}</i>
            `
            )(document.getElementById("globeViz"));
        })
  });