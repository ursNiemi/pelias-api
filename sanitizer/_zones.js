// validate inputs, convert types and apply defaults
function sanitize( raw, clean ){

  // error & warning messages
  var messages = { errors: [], warnings: [] };

  // valid input 'zones'
  if(raw.zones === '1' ) {
    clean.zones = raw.zones;
  }

  return messages;
}


function expected() {
  // add zones as a valid parameter
  return [{ name: 'zones' }];
}

// export function
module.exports = () => ({
  sanitize: sanitize,
  expected: expected
});

