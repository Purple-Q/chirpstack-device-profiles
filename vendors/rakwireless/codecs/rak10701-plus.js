// RAK10701-P Field Tester Plus. Based on RAKwireless' official ChirpStack decoder.
// Uplink on fPort 1 (fPort 2 also accepted): packed GNSS position, altitude, HDOP, satellites.
function decodeUplink(input) {
    var bytes = input.bytes;
    if (input.fPort !== 1 && input.fPort !== 2) {
        return { data: {} };
    }

    var lonSign = (bytes[0] >> 7) & 0x01 ? -1 : 1;
    var latSign = (bytes[0] >> 6) & 0x01 ? -1 : 1;
    var encLat = ((bytes[0] & 0x3f) << 17) + (bytes[1] << 9) + (bytes[2] << 1) + (bytes[3] >> 7);
    var encLon = ((bytes[3] & 0x7f) << 16) + (bytes[4] << 8) + bytes[5];
    var hdop = bytes[8] / 10;
    var sats = bytes[9];

    var data = {
        latitude: (latSign * (encLat * 108 + 53)) / 10000000,
        longitude: (lonSign * (encLon * 215 + 107)) / 10000000,
        altitude: ((bytes[6] << 8) + bytes[7]) - 1000,
        accuracy: (hdop * 5 + 5) / 10,
        hdop: hdop,
        sats: sats,
    };

    // Same quality gate as RAK's decoder: position is still reported, just flagged.
    if (!(hdop < 2 && sats >= 5)) {
        data.error = "Need more GPS precision (hdop must be <2 & sats must be >= 5) current hdop: " + hdop + " & sats:" + sats;
    }
    return { data: data };
}
