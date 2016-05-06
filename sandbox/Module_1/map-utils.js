EARTH_RADIUS = 6371;
TILE_SIZE = 256;

var tilePixelCenter = TILE_SIZE / 2;
var pixelsPerLngDegree = TILE_SIZE / 360;
var pixelsPerLngRadian = TILE_SIZE / (2 * Math.PI);

var degreesToRadians = function (degrees) {
  return (degrees * Math.PI) / 180;
};

var radiansToDegrees = function (radians) {
  return radians / (Math.PI / 180);
};

var getDistance = function (posA, posB) {
  var startLat = degreesToRadians(posA.lat || posA.latitude);
  var startLng = degreesToRadians(posA.lng || posA.longitude);
  var endLat = degreesToRadians(posB.lat || posB.latitude);
  var endLng = degreesToRadians(posB.lng || posB.longitude);
  partialResult = Math.sin(startLat) * Math.sin(endLat) + Math.cos(startLat) * Math.cos(endLat) * Math.cos(startLng - endLng);
  console.log('partialResult: ', partialResult);
  distance = Math.acos(Math.min(partialResult, 1)) * EARTH_RADIUS;
  return Number(distance.toFixed(3));
};

var getRadiusLatLng = function (latLng, radius) {
  var startLat = degreesToRadians(latLng.lat);
  var startLng = degreesToRadians(latLng.lng);
  var dist = parseFloat(radius) / (EARTH_RADIUS * 1000);
  var destAng = degreesToRadians(0);
  var destLat = Math.asin(Math.sin(startLat) * Math.cos(dist) + Math.cos(startLat) * Math.sin(dist) * Math.cos(destAng));
  var destLng = ((startLng + Math.atan2(Math.sin(destAng) * Math.sin(dist) * Math.cos(startLat), Math.cos(dist) - Math.sin(startLat) * Math.sin(destLat))) * 180) / Math.PI;
  destLat = (destLat * 180) / Math.PI;
  console.log('destLat: ', destLat);
  return { lat: destLat, lng: destLng };
};

var getPointFromLatLng = function (latLng, opts) {
  opts = opts || {asPlainObject: false};
  var siny = Math.max(Math.sin(degreesToRadians(latLng.lat)), -0.9999);
  x = TILE_SIZE * (0.5 + latLng.lng / 360);
  y = TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
  if (opts.asPlainObject) {
    return {x: x, y: y};
  }
  return new google.maps.Point(x, y);
};

var getLatLngFromPoint = function (point) {
  var lng = (point.x - tilePixelCenter) / pixelsPerLngDegree;
  var latRadians = (point.y - tilePixelCenter) / -pixelsPerLngRadian;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return {lat: lat, lng: lng};
};

var getFormattedPlaceName = function (placeObj) {
  if (!placeObj.formatted_address) {
    return null;
  }
  var htmlAddress = placeObj.adr_address;
  var firstPart = htmlAddress.substr(0, htmlAddress.indexOf('<'));
  var addressContainer = window.document.createElement('span');
  addressContainer.innerHTML = htmlAddress;
  var childNodes = Array.prototype.slice.call(addressContainer.children, 0);
  if (childNodes.length == 0) {
    return placeObj.formatted_address;
  }
  // return firstPart + childNodes
  //   .filter(function (node) { return node.className != 'postal-code'})
  //   .map(function (node) { return node.textContent});
  //   .join(', ')
};

var getAdjustedMapCenter = function (options) {
  var mapCenter = options.mapCenter;
  var mapZoom = options.mapZoom;
  var offset = options.offset;
  var reverse = options.reverse;
  var directionalOffset = reverse ? offset * -1 : offset;
  z = Math.pow(2, mapZoom);
  console.log('z: ', z);
  var point = getPointFromLatLng({
    lat: result(mapCenter, 'lat'),
    lng: result(mapCenter, 'lng'),
  }, {asPlainObject: true});
  var adjustedMapCenter = getLatLngFromPoint({
    x: point.x,
    y: point.y + (directionalOffset / 2) / z,
  });
  adjustedMapCenter.lat = round(adjustedMapCenter.lat, 6);
  adjustedMapCenter.lng = round(adjustedMapCenter.lng, 6);
  return adjustedMapCenter;
};

var latLngAreDifferent = function (firstLoc, secondLoc) {
  var distance;
  var firstLat = parseFloat((firstLoc.lat || firstLoc.latitude).toFixed(6));
  var firstLng = parseFloat((firstLoc.lng || firstLoc.longitude).toFixed(6));
  var secondLat = parseFloat((secondLoc.lat || secondLoc.latitude).toFixed(6));
  var secondLng = parseFloat((secondLoc.lng || secondLoc.longitude).toFixed(6));
  if (firstLat != secondLat || firstLng != secondLng) {
    return true;
  }
  return false;
};

var getAdjustedPositionFromMapInstance = function (instance, offset) {
  var zoomLevel = instance.getZoom();
  var center = instance.getCenter();
  var wrappedCenter = new google.maps.LatLng({
    lat: center.lat(),
    lng: center.lng()
  });
  var response = getAdjustedMapCenter({
    mapCenter: {
      lat: wrappedCenter.lat(),
      lng: wrappedCenter.lng()
    },
    mapZoom: zoomLevel,
    offset: offset,
    reverse: true
  });
  response.zoomLevel = zoomLevel;
  return response;
};

module.exports = {
  getAdjustedPositionFromMapInstance: getAdjustedPositionFromMapInstance,
  getDistance: getDistance,
  degreesToRadians: degreesToradians,
  getRadiusLatLng: getRadiusLatlng,
  getPointFromLatLng: getPointFromLatLng,
  getLatLngFromPoint: getLatLngFromPoint,
  getFormattedPlaceName: getFormattedPlaceName,
  getAdjustedMapCenter: getAdjustedMapCenter,
  latLngAreDifferent: latLngAreDifferent
};
