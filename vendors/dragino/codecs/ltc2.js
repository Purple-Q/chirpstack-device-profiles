// Dragino LTC2 (PT100 temperature transmitter) - Purple-Q field naming.
//
// Based on Dragino's official decoder (dragino-end-node-decoder, "LTC2-HT Decoder TTN"),
// with Purple-Q's names: BatV -> battery, Temp_Channel1/2 -> temperature_1/2, Node_type dropped.
//
// Payload (11 bytes): battery(2) | ext(1) | temperature 1 (2) | temperature 2 (2) | unix timestamp (4)
// A probe reading of 0x8001 means "no probe connected" and is reported as the text "NULL".
//
// Verified against stored uplinks of PQ-2001 (ext mode 1). Ext modes 2 and 3 follow Dragino's
// decoder but have not been checked against old Purple-Q output.

function decodeLtc2Temperature(highByte, lowByte, divider, decimals) {
  if (highByte === 0x80 && lowByte === 0x01) {
    return "NULL";
  }
  var rawValue = highByte << 8 | lowByte;
  // Dragino: values from 0xE4A8 upward are negative (down to -70 C); below that, positive
  if (rawValue >= 0xe4a8) {
    rawValue = highByte << 24 >> 16 | lowByte;
  }
  return parseFloat((rawValue / divider).toFixed(decimals));
}

function decodeUplink(input) {
  var bytes = input.bytes;
  if (bytes.length !== 11) {
    return { errors: ["LTC2: expected 11 bytes, got " + bytes.length] };
  }
  var pollMessage = (bytes[2] & 0x40) >> 6;
  if (pollMessage === 1) {
    return { warnings: ["LTC2: poll/datalog message, not decoded"], data: {} };
  }

  var data = {};
  data.Ext = bytes[2] & 0x0f;
  data.battery = ((bytes[0] << 8 | bytes[1]) & 0x3fff) / 1000;

  if (data.Ext === 0x01) {
    data.temperature_1 = decodeLtc2Temperature(bytes[3], bytes[4], 100, 2);
    data.temperature_2 = decodeLtc2Temperature(bytes[5], bytes[6], 100, 2);
  } else if (data.Ext === 0x02) {
    data.temperature_1 = decodeLtc2Temperature(bytes[3], bytes[4], 10, 1);
    data.temperature_2 = decodeLtc2Temperature(bytes[5], bytes[6], 10, 1);
  } else if (data.Ext === 0x03) {
    data.Res_Channel1 = parseFloat(((bytes[3] << 8 | bytes[4]) / 100).toFixed(2));
    data.Res_Channel2 = parseFloat(((bytes[5] << 8 | bytes[6]) / 100).toFixed(2));
  }

  data.Systimestamp = ((bytes[7] << 24 | bytes[8] << 16 | bytes[9] << 8 | bytes[10]) >>> 0);

  return { data: data };
}
