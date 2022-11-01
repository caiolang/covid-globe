let myGlobe;
let btn = document.getElementById("btn");

btn.onclick = () => {
  myGlobe
    .hexPolygonAltitude(({ properties: d }) =>
      d.cases ? 0.25 : Math.random() / 1000 + 0.001
    )
    .hexPolygonColor(({ properties: d }) => {
      let color = `#${Math.round(Math.random() * Math.pow(2, 24))
        .toString(16)
        .padStart(6, "0")}${percentToHex(d.cases ? 100 : 20)}`;
      return color;
    });
};

const percentToHex = (p) => {
  const percent = Math.max(0, Math.min(100, p)); // bound percent from 0 to 100
  const intValue = Math.round((percent / 100) * 255); // map percent to nearest integer (0 - 255)
  const hexValue = intValue.toString(16); // get hexadecimal representation
  return hexValue.padStart(2, "0").toUpperCase(); // format with leading 0 and upper case characters
};

fetch("./datasets/countries_covid.geojson")
  .then((res) => res.json())
  .then((countries) => {
    myGlobe = Globe()
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(2)
      .hexPolygonMargin(0.3)
      .hexPolygonsTransitionDuration(500)
      //   .hexPolygonAltitude(({ properties: d }) =>
      //     d.cases ? 0.25 : Math.random() / 1000 + 0.001
      //   )
      .hexPolygonColor(({ properties: d }) => {
        let color = `#${Math.round(Math.random() * Math.pow(2, 24))
          .toString(16)
          .padStart(6, "0")}${percentToHex(20)}`;
        return color;
      })
      .hexPolygonLabel(
        ({ properties: d }) => `
            <b>${d.ADMIN} (${d.ISO_A2})</b> <br />
            Population: <i>${d.POP_EST}</i>
          `
      )(document.getElementById("globeViz"));
  });
