<?php
$sheet_id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
$sheet_name = 'GeoData'; // 假設你有這個工作表，裡面有 lat/lng 欄位

$url = "https://docs.google.com/spreadsheets/d/$sheet_id/gviz/tq?tqx=out:json&sheet=" . urlencode($sheet_name);
$response = @file_get_contents($url);
if (!$response) {
    http_response_code(500);
    echo json_encode(["error" => "無法讀取 Google Sheet"]);
    exit;
}

$json = substr($response, 47, -2);
$data = json_decode($json, true);

$cols = array_map(fn($col) => $col['label'], $data['table']['cols']);

$features = [];

foreach ($data['table']['rows'] as $row) {
    $properties = [];
    $lat = null;
    $lng = null;

    foreach ($row['c'] as $i => $cell) {
        $key = $cols[$i];
        $val = $cell['v'] ?? null;

        if (is_null($val)) continue;

        // 嘗試抓經緯度欄位
        if (in_array(strtolower($key), ['lat', 'latitude'])) $lat = floatval($val);
        elseif (in_array(strtolower($key), ['lng', 'lon', 'longitude'])) $lng = floatval($val);
        else $properties[$key] = $val;
    }

    // 只有在有經緯度的情況下才加入
    if (!is_null($lat) && !is_null($lng)) {
        $features[] = [
            "type" => "Feature",
            "geometry" => [
                "type" => "Point",
                "coordinates" => [$lng, $lat]
            ],
            "properties" => $properties
        ];
    }
}

// 組合 GeoJSON 結構
$geojson = [
    "type" => "FeatureCollection",
    "features" => $features
];

header('Content-Type: application/json');
echo json_encode($geojson, JSON_UNESCAPED_UNICODE); // 無縮排即為 minimized JSON
