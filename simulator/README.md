# NordSense buss-simulator

Simulerer et komplett bygg-portefølje av varmepumper, kjøleanlegg, ventilasjon
og frekvensomformere som ligger på en RS485/CAN buss-linje. Sender realistisk
telemetri og alarmer via MQTT til NordSense-backenden — slik at hele
data-pipelinen kan testes (og demonstreres) før hardwaren er installert.

## Hva den simulerer

- 22 enheter i 5 bygg (matcher dashboardets mockData)
- Carel, Danfoss, Eliwell, System Air, Swegon, Stulz
- Realistiske sensorverdier som drifter sakte (Ornstein-Uhlenbeck mean reversion)
- Setpunkter som reagerer på faktiske Nord Pool spotpriser (NO1, hentes live)
- Tilfeldige Modbus/CAN "tapte rammer" (~1 % av polls)
- Tilfeldige alarmer med 10–45 min varighet
- Datarom-CRAC-enheter med høyere kritikalitet

## Installasjon

```powershell
cd hvac-optimizer/simulator
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Kjør

```powershell
# Mot Hetzner-backend (produksjon)
python main.py --broker 178.105.130.167 --user hvac --password changeme

# Mot lokal Mosquitto (utvikling)
python main.py --broker localhost

# Sanity-test: send én sample per enhet og avslutt
python main.py --broker 178.105.130.167 --user hvac --password changeme --once

# Debug: 30× raskere tid for å fylle InfluxDB raskt
python main.py --broker 178.105.130.167 --user hvac --password changeme --speed 30
```

## MQTT-topics

Simulatoren publiserer på samme topics som ekte Pi-edge:

| Topic                          | Innhold                         |
| ------------------------------ | ------------------------------- |
| `hvac/{device_id}/telemetry`   | Sensorverdier, ~hvert 30. sek   |
| `hvac/{device_id}/alarm`       | Feilkode + tekst når alarm fyrer |
| `nordpool/prices`              | Dagens timepriser per time      |

Backend-API (FastAPI) lytter på disse og skriver til InfluxDB.

## Hvor du ser dataene

- **Grafana** (port 3000): forhåndskonfigurerte dashboards på Hetzner
- **REST API** (port 8000):
  - `GET /devices` — alle enheter sett siste 10 min
  - `GET /telemetry/{device_id}?hours=24` — historikk per enhet
  - `GET /alarms?hours=24` — alarm-historikk
  - `GET /prices` — Nord Pool-historikk
- **NordSense dashboard**: når dashbordet kobles til ekte API
  (`hvac-optimizer/dashboard/src/lib/mockData.ts` byttes ut)

## Stopp

Ctrl+C — graceful shutdown.
