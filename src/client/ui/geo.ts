import { geoArea } from 'd3-geo';
import type { Feature, Geometry, MultiPolygon, Polygon } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import atlas from 'world-atlas/countries-110m.json';

/** Oyundaki ülke kodları → world-atlas (ISO 3166 sayısal) kimlikleri */
export const ISO_NUM: Record<string, string> = {
  tr: '792', us: '840', de: '276', fr: '250', gb: '826', it: '380', es: '724', pl: '616', gr: '300',
  az: '031', il: '376', in: '356', jp: '392', kr: '410', ca: '124', mx: '484', br: '076', ar: '032',
  cn: '156', ru: '643', ir: '364', sa: '682', eg: '818',
};
export const NUM_TO_ID: Record<string, string> = Object.fromEntries(Object.entries(ISO_NUM).map(([k, v]) => [v, k]));

export type CountryFeature = Feature<Geometry, { name: string }> & { id?: string };

const topo = atlas as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
export const FEATURES: CountryFeature[] = (
  feature(topo, topo.objects.countries) as unknown as { features: CountryFeature[] }
).features.filter((f) => f.id !== '010'); // Antarktika haritayı gereksiz büyütüyor

export function featureFor(countryId: string): CountryFeature | undefined {
  const num = ISO_NUM[countryId];
  return FEATURES.find((f) => f.id === num);
}

/** Çok parçalı ülkelerde (ör. Fransa + Guyana) yakınlaştırma için ana kara parçası. */
export function mainland(f: CountryFeature): CountryFeature {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const polys = (f.geometry as MultiPolygon).coordinates.map(
    (coords) => ({ type: 'Polygon', coordinates: coords }) as Polygon,
  );
  const best = polys.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  return { ...f, geometry: best };
}
