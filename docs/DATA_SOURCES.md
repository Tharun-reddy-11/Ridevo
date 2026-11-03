# Data and integration register

## Phase 1 development catalog

There is no seeded catalog or generated interaction history. Vehicles, prices, availability and recommendation events originate from approved RideNexa owner and customer actions in MySQL.

## Planned production inputs

| Need | Intended source | Phase | Notes |
|---|---|---|---|
| Inventory, pricing, availability and interactions | RideNexa transactional database | Current | The only authoritative source for marketplace facts. |
| Vehicle specification enrichment | Licensed vehicle-data supplier or owner-entered details | 4 | No scraped or licence-unclear data will be imported. |
| Geocoding | Configurable provider adapter | 5 | OpenStreetMap's public Nominatim instance has a 1 request/second limit and forbids client-side autocomplete; use caching and an approved provider/self-hosting for production. |
| Routing/ETA | Configurable routing adapter | 5 | OSRM is suitable as a self-hosted routing engine; route distance must not be inferred from straight-line distance. |

## Dataset decision

Vehicle recommendations require platform-specific signals—availability, delivery coverage, pricing, clicks, bookings and reviews—which do not exist in a generic public dataset. Phase 14 will train only on consented RideNexa interaction events with a temporal, leakage-aware split. The development catalog is deliberately kept separate from any claimed trained model.
