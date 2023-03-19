import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Popup, Rectangle, TileLayer} from "react-leaflet";

// const gridSize = 0.001; // ~100m
const gridSize = 0.005; // ~500m
const stationMaxDistance = 0.005; // After grid size is added, this will be ~1000m
const riverMaxDistance = 0.005; // After grid size is added, this will be ~1000m
const pedMaxDistance = 0.015; // After grid size is added, this will be ~2000m
const renderStations = false;
const zoom = 10;
const mapCentre = {lat: 51.508, lon: -0.128}; // Trafalgar Square
const boundingCoords = {
  southLat: mapCentre.lat - 0.4,
  westLon: mapCentre.lon - 1.1,
  northLat: mapCentre.lat + 0.4,
  eastLon: mapCentre.lon + 0.6
};
// const zoom = 12;
// const mapCentre = {lat: 51.17, lon: -0.65}; // Milford
// const boundingCoords = {
//   southLat: mapCentre.lat - 0.1,
//   westLon: mapCentre.lon - 0.1,
//   northLat: mapCentre.lat + 0.1,
//   eastLon: mapCentre.lon + 0.1
// };

// @TODO Do I need to filter on lat if I've already done it in filterNearLat ?
function hasNearbyX(list, southernLatitude, westernLongitude, maxDistance) {
  return list.some((item) => {
    return item.lat >= southernLatitude - maxDistance && item.lat < southernLatitude + (maxDistance + gridSize) && item.lon >= westernLongitude - maxDistance && item.lon < westernLongitude + (maxDistance + gridSize); // Not perfect as item might be just outside the edge of a rectangle
  });
}

function filterNearLat(list, southernLatitude, maxDistance) {
  return list.filter((item) => {
    return item.lat >= southernLatitude - (maxDistance + (2 * gridSize)) && item.lat < southernLatitude + (maxDistance + (3 * gridSize));
  });
}

function fetchJson(feature) {
  if (feature.slice(0, 3) === 'way') {
    return fetch(`https://www.overpass-api.de/api/interpreter?data=[out:json];${feature}(${boundingCoords.southLat},${boundingCoords.westLon},${boundingCoords.northLat},${boundingCoords.eastLon});out%20meta;`).then((response) => response.json());
  }
  return fetch(`https://www.overpass-api.de/api/interpreter?data=[out:json];${feature}(${boundingCoords.southLat},${boundingCoords.westLon},${boundingCoords.northLat},${boundingCoords.eastLon});(._;>;);out%20meta;`).then((response) => response.json());
}

function getGridColour(southernLatitude, westernLongitude, stations, rivers, pedestrianAreas) {
  const hasNearbyStations = hasNearbyX(stations, southernLatitude, westernLongitude, stationMaxDistance);

  if (!hasNearbyStations) {
    return '#ff0000';
  }

  const hasNearbyPedAreas = hasNearbyX(pedestrianAreas, southernLatitude, westernLongitude, pedMaxDistance);
  const hasNearbyRivers = hasNearbyX(rivers, southernLatitude, westernLongitude, riverMaxDistance);

  if (hasNearbyPedAreas && hasNearbyRivers) {
    return '#00ff00';
  }

  if (hasNearbyPedAreas || hasNearbyRivers) {
    return '#ffff66';
  }

  return '#ff9933';
}

function Map() {
  const grid = [];
  const markers = [];
  const [stations, setStations] = useState([]);
  const [rivers, setRivers] = useState([]);
  const [pedestrianAreas, setPedestrianAreas] = useState([]);

  useEffect(() => {
    (async () => {
      const [stationsData, riversData, pedestrianAreaData] = await Promise.all([
        fetchJson('node[railway=station]'),
        fetchJson('way[waterway=river]'),
        fetchJson('area[highway=pedestrian]'),
      ]);
      const goodStations = stationsData.elements.filter(station => station.tags?.usage !== 'tourism');
      const goodPedestrianAreas = pedestrianAreaData.elements.filter(ped => ped.tags?.area === 'yes');
      setStations(goodStations);
      setRivers(riversData.elements);
      setPedestrianAreas(goodPedestrianAreas);
    })();
  }, []);

  console.log(`Grid size ${Math.ceil((boundingCoords.northLat - boundingCoords.southLat) / gridSize)} x ${Math.ceil((boundingCoords.eastLon - boundingCoords.westLon) / gridSize)}`)

  if (stations && rivers && pedestrianAreas) {
    for (let southernLatitude = boundingCoords.southLat; southernLatitude < boundingCoords.northLat; southernLatitude += gridSize) {
      const stationsNearThisLat = filterNearLat(stations, southernLatitude, stationMaxDistance); // Narrow down the number of stations to be iterated
      const riversNearThisLat = filterNearLat(rivers, southernLatitude, riverMaxDistance); // Narrow down the number of rivers to be iterated
      const pedestrianAreasNearThisLat = filterNearLat(pedestrianAreas, pedMaxDistance); // Narrow down the number of rivers to be iterated
      for (let westernLongitude = boundingCoords.westLon; westernLongitude < boundingCoords.eastLon; westernLongitude += gridSize) {
        const colour = getGridColour(southernLatitude, westernLongitude, stationsNearThisLat, riversNearThisLat, pedestrianAreasNearThisLat);
        grid.push(<Rectangle key={`${southernLatitude}-${westernLongitude}`}
                             bounds={[[southernLatitude, westernLongitude], [southernLatitude + gridSize, westernLongitude + gridSize]]}
                             pathOptions={{color: colour, weight: 1}}/>);

      }
    }
    if (renderStations) {
      stations.forEach((station) => {
        markers.push(<Marker position={[station.lat, station.lon]}><Popup>${station.tags.name}</Popup></Marker>);
      });
    }
  }

  return (
    <MapContainer center={[mapCentre.lat, mapCentre.lon]} zoom={zoom} scrollWheelZoom={false} style={{height: '600px'}}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {grid}
      {markers}
    </MapContainer>
  );
}

export default Map;
