var OpenLocationCode = require('open-location-code').OpenLocationCode;
var openLocationCode = new OpenLocationCode();

// Encode a location, default accuracy:
var code = openLocationCode.encode(11.890769, 105.433263);
console.log(code);

// Encode a location using one stage of additional refinement: code = openLocationCode.encode(47.365590, 8.524997, 11); console.log(code);

//Decode a full code: var coord = openLocationCode.decode(code); var msg = 'Center is ' + coord.latitudeCenter + ',' + coord.longitudeCenter; console.log(msg);

// Attempt to trim the first characters from a code: var shortCode = openLocationCode.shorten('8FVC9G8F+6X', 47.5, 8.5); console.log(shortCode);

// Recover the full code from a short code: var nearestCode = openLocationCode.recoverNearest('9G8F+6X', 47.4, 8.6); console.log(nearestCode); nearestCode = openLocationCode.recoverNearest('8F+6X', 47.4, 8.6); console.log(nearestCode);