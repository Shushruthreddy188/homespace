import { useSearchParams } from "react-router-dom";

export function useUrlPosition() {
  const [searchParams] = useSearchParams();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const latNum = lat !== null ? Number(lat) : null;
  const lngNum = lng !== null ? Number(lng) : null;

  return [latNum, lngNum];
}
