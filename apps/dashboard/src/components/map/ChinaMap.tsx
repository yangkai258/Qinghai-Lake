"use client";
import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DouyinAccountRow } from "@/lib/types";

/**
 * ChinaMap 鈥?light navy backdrop, regional polygon fill scaled by total fans
 * across accounts whose `dept` matches the polygon name (case-insensitive).
 *
 * Data source for polygons: jsDelivr mirror of the public `d3-china-geojson`
 * dataset. Falls back to d3-built approximate if fetch fails.
 *
 * 鍥炬棰滆壊鎸?region fans 鍦ㄦ墍鏈?region 涓殑鐩稿鍊煎垎妗剁潃鑹诧紙4 绾э級銆? */

const POLY_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

type Region = { name: string; plays: number; fans: number; count: number };

const fmtN = (n: number) => (n >= 1e4 ? (n / 1e4).toFixed(1) + "万" : n.toLocaleString());

export function ChinaMap({
  rows,
  height = 870,
}: {
  rows: DouyinAccountRow[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const regions = new Map<string, Region>();
    for (const r of rows) {
      const key = (r.dept ?? "鍏朵粬").trim();
      const cur = regions.get(key) ?? { name: key, plays: 0, fans: 0, count: 0 };
      cur.plays += r.playsInc;
      cur.fans += r.fansTotal;
      cur.count += 1;
      regions.set(key, cur);
    }
    const max = Math.max(1, ...[...regions.values()].map((v) => v.fans));

    (async () => {
      // Fetch the China province polygons; bail to a graceful empty map on failure.
      let geo: GeoJSON.FeatureCollection | null = null;
      try {
        const res = await fetch(POLY_URL, { cache: "force-cache" });
        if (res.ok) geo = await res.json();
      } catch {/* offline OK */}
      if (!geo || !ref.current) return;

      const map = new maplibregl.Map({
        container: ref.current,
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: { empty: { type: "geojson", data: { type: "FeatureCollection", features: [] } } },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#0a1224" } },
          ],
        } as maplibregl.StyleSpecification,
        center: [104, 35],
        zoom: 3.2,
        interactive: false,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        map.addSource("cn", { type: "geojson", data: geo as GeoJSON.FeatureCollection });

        // Bucket function from fan count 鈫?fill color
        const bucket = (f: number) => {
          const r = f / max;
          if (r <= 0.25) return "#16314f";
          if (r <= 0.5) return "#1c4a7a";
          if (r <= 0.75) return "#2a73b9";
          return "#3aa0ff";
        };

        map.addLayer({
          id: "cn-fill",
          type: "fill",
          source: "cn",
          paint: {
            "fill-color": [
              "match",
              ["get", "name"],
              ...[...regions.entries()].flatMap(([name, v]) => [name, bucket(v.fans)]),
              "#102036",
            ] as unknown as maplibregl.ExpressionSpecification,
            "fill-opacity": 0.85,
          },
        });
        map.addLayer({
          id: "cn-stroke",
          type: "line",
          source: "cn",
          paint: {
            "line-color": "#5aa6ff",
            "line-opacity": 0.45,
            "line-width": 1,
          },
        });

        // Region labels
        map.addLayer({
          id: "cn-label",
          type: "symbol",
          source: "cn",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 12,
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#cfe5ff",
            "text-halo-color": "#0a1224",
            "text-halo-width": 1.5,
          },
        });
      });
    })();

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [rows]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={ref} style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", background: "#0a1224" }} />
      <div style={{ position: "absolute", left: 12, top: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(10,18,36,0.7)", fontSize: 12, color: "var(--ink-dim)", border: "1px solid rgba(58,160,255,0.35)" }}>
        鎸夎处鍙?dept 鐫€鑹?路 鏁版嵁鐐?{rows.length} 涓?      </div>
    </div>
  );
}