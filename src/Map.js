import React from "react";
import {MapContainer, Rectangle, TileLayer} from "react-leaflet";

function Map() {
  const zoom = 10;
  const mapCentre = {lat: 51.508, lon: -0.128}; // Trafalgar Square
  const boundingCoords = {
    southLat: mapCentre.lat - 0.4,
    westLon: mapCentre.lon -1.1,
    northLat: mapCentre.lat + 0.4,
    eastLon: mapCentre.lon +0.6
  };
  const gridSize = 0.005; // ~500m

  const grid = [];

  console.log(`Grid size ${Math.ceil((boundingCoords.northLat-boundingCoords.southLat)/gridSize)} x ${Math.ceil((boundingCoords.eastLon-boundingCoords.westLon)/gridSize)}`)

  for (let i = boundingCoords.southLat; i < boundingCoords.northLat; i += gridSize) {
    for (let j = boundingCoords.westLon; j < boundingCoords.eastLon; j += gridSize) {
      grid.push(<Rectangle key={`${i}-${j}`} bounds={[[i, j], [i + gridSize, j + gridSize]]}
                           pathOptions={{color: "#ff66cc", weight: 1}}/>);
    }
  }

  return (
    <MapContainer center={[mapCentre.lat, mapCentre.lon]} zoom={zoom} scrollWheelZoom={false} style={{height: '600px'}}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {grid}
    </MapContainer>
  );
}

export default Map;
