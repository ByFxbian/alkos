type SimpleLocation = {
  id: string;
  name: string;
  slug: string;
  city: string;
  heroImage: string | null;
};

let locationPromise: Promise<SimpleLocation[]> | null = null;

export function loadLocationsClient(): Promise<SimpleLocation[]> {
  if (!locationPromise) {
    locationPromise = fetch("/api/public/location-data")
      .then((res) => res.json())
      .then((data) => (Array.isArray(data.locations) ? data.locations : []))
      .catch(() => []);
  }
  return locationPromise;
}

