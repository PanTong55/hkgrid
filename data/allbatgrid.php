<?php
$sheet_id = '1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8';
$sheet_name = 'sheet1';

$url = "https://docs.google.com/spreadsheets/d/$sheet_id/gviz/tq?tqx=out:json&sheet=" . urlencode($sheet_name);
$response = @file_get_contents($url);
if (!$response) {
    http_response_code(500);
    echo json_encode(["error" => "無法讀取 Google Sheet"]);
    exit;
}

$json = substr($response, 47, -2);
$data = json_decode($json, true);

// 取得欄位名稱
$cols = array_map(fn($col) => $col['label'], $data['table']['cols']);

$features = [];

foreach ($data['table']['rows'] as $row) {
    $properties = [];
    $lat = null;
    $lng = null;

    foreach ($row['c'] as $i => $cell) {
        $key = $cols[$i];
        $val = $cell['v'] ?? null;

        if ($val === null) continue;

        $lower_key = strtolower($key);
        if ($lower_key === 'lat' || $lower_key === 'latitude') {
            $lat = floatval($val);
        } elseif ($lower_key === 'lng' || $lower_key === 'lon' || $lower_key === 'longitude') {
            $lng = floatval($val);
        } else {
            $properties[$key] = $val;
        }
    }

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

$geojson = [
    "type" => "FeatureCollection",
    "features" => $features
];

header('Content-Type: application/json');
echo json_encode($geojson, JSON_UNESCAPED_UNICODE);
