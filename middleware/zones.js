const inside = require('point-in-polygon');

function setup(prefix) {

  const regions = {
    HSL: require('./config/hsl_zone_areas_20190508.json'),
    tampere: require('./config/tre_zone_areas_20200401.json'),
    LINKKI:  require('./config/linkki.json'),
  };

  // precompute bounding boxes to optimize test speed
  for (const key in regions) {
    for (const feature of regions[key].features) {
      const bbox = [];
      const { coordinates, type } = feature.geometry;
      if (type === 'Polygon') {
        expandBBox(bbox, coordinates[0]); // first loop = outer boundary
      } else { // multipolygon
        for (const polygon of coordinates) {
          expandBBox(bbox, polygon[0]);
        }
      }
      feature.bbox = bbox;
    }
  }
  return function (req, res, next) {
    return setZones(req, res, next, regions);
  };
}

function  expandBBox(bbox, points) {
  for (const p of points) {
    if (!bbox.length) { // initialize to first point
      bbox[0] = bbox[2] = p[0];
      bbox[1] = bbox[3] = p[1];
    } else {
      if (p[0] < bbox[0]) {
        bbox[0] = p[0];
      } else {
        if (p[0] > bbox[2]) {
          bbox[2] = p[0];
        }
      }
      if (p[1] < bbox[1]) {
        bbox[1] = p[1];
      } else {
        if (p[1] > bbox[3]) {
          bbox[3] = p[1];
        }
      }
    }
  }
}

// Checks if lat and lon are inside of [minlat, minlon, maxlat, maxlon] bounding box
function isInBBox(lon, lat, boundingBox) {
  return (
    boundingBox[0] <= lon &&
    boundingBox[1] <= lat &&
    boundingBox[2] >= lon &&
    boundingBox[3] >= lat
  );
}

function isInPolygon(lon, lat, coordinates) {
  // check outer rim
  if (!inside([lon, lat], coordinates[0])) {
    return false;
  }
  // check holes
  for (let i=1; i<coordinates.length; i++) {
    if (inside([lon, lat], coordinates[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Finds any features inside which the given point is located. This returns
 * the properties.name of each feature by default.
 *
 * @param {{lat: number, lon: number}} point the location to check.
 * @param {*} features the area features available in a geojson format.
 */

function isInFeature(lon, lat, feature) {
  if (!isInBBox(lon, lat, feature.bbox)) {
    return false;
  }
  const { coordinates, type } = feature.geometry;
  if (type === 'Polygon') {
    if (isInPolygon(lon, lat, coordinates)) {
      return true;
    }
  } else {
    for (const polygon of coordinates) {
      if (isInPolygon(lon, lat, polygon)) {
        return true;
      }
    }
  }
  return false;
}

function findZones(lon, lat, regions) {
  const zones = [];

  for (const key in regions) {
    for (const feature of regions[key].features) {
      if (isInFeature(lon, lat, feature)) {
        zones.push(key + ':' + feature.properties.Zone); // new hit
      }
    }
  }
  return zones;
}

function setZones(req, res, next, regions) {
  if (!req.clean['point.lat'] || !req.clean['point.lon'] || !req.clean.zones) {
    return next();
  }
  res.zones = findZones(req.clean['point.lon'], req.clean['point.lat'], regions);
  if (res && res.data) {
    for (const place of res.data) {
      place.zones = findZones(place.center_point.lon, place.center_point.lat, regions);
    }
  }
  next();
}


module.exports = setup;
