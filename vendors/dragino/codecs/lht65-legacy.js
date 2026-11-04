// Dragino LHT65 (older firmware, NOT the LHT65N) - Purple-Q field naming.
//
// Why a separate codec: on this firmware, bit 7 of byte 6 means "external sensor not connected".
// The LHT65N firmware reuses that bit as "retransmission", so the official LHT65N codec
// returns only {retransmission_message} for these devices.
//
// Field names follow Purple-Q's convention: measurements get a _1 suffix, battery does not.
// Verified against stored uplinks of AMC-0110 (work mode 4, interrupt). Other work modes
// follow Dragino's own decoder logic but have not been checked against old Purple-Q output.

function decodeUplink(input) {
  var bytes = input.bytes;
  if (bytes.length < 11) {
    return { errors: ["LHT65: expected at least 11 bytes, got " + bytes.length] };
  }

  var data = {};
  var externalSensorType = bytes[6] & 0x0f;
  var sensorNotConnected = (bytes[6] & 0x80) >> 7;

  data.battery = ((bytes[0] << 8 | bytes[1]) & 0x3fff) / 1000;
  data.battery_status = bytes[0] >> 6;
  data.temperature_1 = parseFloat(((bytes[2] << 24 >> 16 | bytes[3]) / 100).toFixed(2));
  data.humidity_1 = parseFloat((((bytes[4] << 8 | bytes[5]) & 0xfff) / 10).toFixed(1));

  if (sensorNotConnected === 1) {
    data.No_connect = "Sensor no connection";
  }

  if (externalSensorType === 0) {
    data.Ext_sensor = "No external sensor";
  } else if (externalSensorType === 1) {
    data.Ext_sensor = "Temperature Sensor";
    data.TempC_DS = parseFloat(((bytes[7] << 24 >> 16 | bytes[8]) / 100).toFixed(2));
  } else if (externalSensorType === 4) {
    data.Work_mode = "Interrupt Sensor send";
    data.Exti_pin_level = bytes[7] ? "High" : "Low";
    data.Exti_status = bytes[8] ? "True" : "False";
  } else if (externalSensorType === 5) {
    data.Work_mode = "Illumination Sensor";
    data.ILL_lx = bytes[7] << 8 | bytes[8];
  } else if (externalSensorType === 6) {
    data.Work_mode = "ADC Sensor";
    data.ADC_V = (bytes[7] << 8 | bytes[8]) / 1000;
  } else if (externalSensorType === 7) {
    data.Work_mode = "Interrupt Sensor count";
    data.Exit_count = bytes[7] << 8 | bytes[8];
  }

  return { data: data };
}
