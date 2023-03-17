import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Popup, Rectangle, TileLayer} from "react-leaflet";

const gridSize = 0.005; // ~500m
const stationMaxDistance = 0.005; // After grid size is added, this will be ~1000m
const riverMaxDistance = 0.005; // After grid size is added, this will be ~1000m
const renderStations = false;

function getGridColour(southernLatitude, westernLongitude, stations, rivers) {
  const hasNearbyStations = stations.some((station) => {
    return station.lat >= southernLatitude - stationMaxDistance && station.lat < southernLatitude + (stationMaxDistance + gridSize) && station.lon >= westernLongitude - stationMaxDistance && station.lon < westernLongitude + (stationMaxDistance + gridSize); // Not perfect as a station might be just outside the edge of a rectangle
  });

  if (!hasNearbyStations) {
    return '#ff0000';
  }

  const hasNearbyRivers = rivers.some((rivers) => {
    return rivers.lat >= southernLatitude - riverMaxDistance && rivers.lat < southernLatitude + (riverMaxDistance + gridSize) && rivers.lon >= westernLongitude - riverMaxDistance && rivers.lon < westernLongitude + (riverMaxDistance + gridSize); // Not perfect as a station might be just outside the edge of a rectangle
  });

  if (hasNearbyStations && hasNearbyRivers) {
    return '#00ff00';
  }

  return '#ff9933';
}

function getStationsNearThisLat(stations, southernLatitude) {
  return stations.filter((station) => {
    return station.lat >= southernLatitude - (stationMaxDistance + (2 * gridSize)) && station.lat < southernLatitude + (stationMaxDistance + (3 * gridSize));
  });
}

function getRiversNearThisLat(rivers, southernLatitude) {
  return rivers.filter((rivers) => {
    return rivers.lat >= southernLatitude - (riverMaxDistance + (2 * gridSize)) && rivers.lat < southernLatitude + (riverMaxDistance + (3 * gridSize));
  });
}

function Map() {
  const zoom = 10;
  const mapCentre = {lat: 51.508, lon: -0.128}; // Trafalgar Square
  const boundingCoords = {
    southLat: mapCentre.lat - 0.4,
    westLon: mapCentre.lon - 1.1,
    northLat: mapCentre.lat + 0.4,
    eastLon: mapCentre.lon + 0.6
  };

  const grid = [];
  const markers = [];
  const [stations, setStations] = useState([]);
  const [rivers, setRivers] = useState([]);

  useEffect(() => {
    (async () => {
      const [stationsData, riversData] = await Promise.all([
        fetch(`https://www.overpass-api.de/api/interpreter?data=[out:json];node[railway=station](${boundingCoords.southLat},${boundingCoords.westLon},${boundingCoords.northLat},${boundingCoords.eastLon});out%20meta;`).then((response) => response.json()),
        fetch(`https://www.overpass-api.de/api/interpreter?data=[out:json];way[waterway=river](${boundingCoords.southLat},${boundingCoords.westLon},${boundingCoords.northLat},${boundingCoords.eastLon});(._;>;);out%20meta;`).then((response) => response.json())
      ]);
      const goodStations = stationsData.elements.filter(station => station.tags?.usage !== 'tourism');
      setStations(goodStations);
      setRivers(riversData.elements);
    })();
  }, []);

  console.log(`Grid size ${Math.ceil((boundingCoords.northLat - boundingCoords.southLat) / gridSize)} x ${Math.ceil((boundingCoords.eastLon - boundingCoords.westLon) / gridSize)}`)

  if (stations && rivers) {
    for (let southernLatitude = boundingCoords.southLat; southernLatitude < boundingCoords.northLat; southernLatitude += gridSize) {
      const stationsNearThisLat = getStationsNearThisLat(stations, southernLatitude); // Narrow down the number of stations to be iterated
      const riversNearThisLat = getRiversNearThisLat(rivers, southernLatitude); // Narrow down the number of rivers to be iterated
      for (let westernLongitude = boundingCoords.westLon; westernLongitude < boundingCoords.eastLon; westernLongitude += gridSize) {
        const colour = getGridColour(southernLatitude, westernLongitude, stationsNearThisLat, riversNearThisLat);
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
