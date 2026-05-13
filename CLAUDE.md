# HVAC Energy Optimizer

Energistyringssystem for store eiendomsselskaper. Samler data fra varmepumper og kjøleanlegg via RS485/Modbus og CAN-bus, optimerer setpunkter basert på Nord Pool strømpriser, og viser alt i et profesjonelt dashboard.

## Hardware (installert i bygg)
- **Raspberry Pi Zero 2 WH** — edge-kontroller
- **Waveshare RS485 CAN HAT (B)** (SKU 23227) — Modbus RTU over RS485 + CAN-bus
- **Waveshare SIM7600G-H 4G HAT (B)** (SKU 19485) — 4G-tilkobling + GPS

## Prosjektstruktur

```
hvac-optimizer/
├── edge/                        ← kjører på RPi Zero 2 WH
│   ├── main.py                  ← hovedtjeneste (60s telemetri, 5min optimering)
│   ├── modbus_reader.py         ← RS485 Modbus RTU — varmepumper og kjølanlegg
│   ├── can_reader.py            ← CAN-bus feilmeldinger, kritisk-alarm-callback
│   ├── nordpool.py              ← henter Nord Pool day-ahead priser (NO1–NO5)
│   ├── optimizer.py             ← Nord Pool-styrt setpunkt-optimalisering
│   ├── mqtt_client.py           ← publiserer data via 4G/MQTT til backend
│   ├── device_registry.py       ← laster produsent-YAML og bygger registermap
│   ├── config.yaml              ← enhetsoppsett, RS485-port, MQTT-config, terskler
│   └── devices/                 ← Modbus-registerbibliotek per produsent
│       ├── carel.yaml           ← pCO5+, IR33, MPXPRO
│       ├── systemair.yaml       ← Topline EC / SAVE VTR, Villavent VR
│       ├── danfoss.yaml         ← FC-serie, AK-SC255/355, ECL Comfort, Optyma Plus
│       ├── eliwell.yaml         ← EWCM 4120/4140, IC915, EWDR 974, ID961 LX
│       └── swegon.yaml          ← GOLD RX/LP/VX/CX, CASA R, RUBY VAV
├── backend/                     ← kjører på server eller sky (Docker)
│   ├── docker-compose.yml       ← Mosquitto + InfluxDB 2.7 + Grafana + FastAPI
│   ├── api/
│   │   ├── main.py              ← FastAPI: MQTT→InfluxDB + REST endpoints
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── mosquitto/mosquitto.conf
│   └── grafana/                 ← ferdig dashboard + provisioning
└── dashboard/                   ← React + Vite + Tailwind (http://localhost:5173)
    └── src/
        ├── App.tsx              ← sider: Oversikt, Bygg, Energi, Optimalisering, Alarmer
        ├── components/
        │   ├── KpiCard.tsx
        │   ├── PriceChart.tsx   ← Nord Pool timespris, fargekodet soner
        │   ├── EnergyChart.tsx  ← effektforbruk siste 24h
        │   ├── EnergyBarChart.tsx
        │   ├── BuildingGrid.tsx ← porteføljeoversikt
        │   ├── AlarmTable.tsx
        │   ├── DeviceTable.tsx  ← filter per produsent
        │   └── OptimizationLog.tsx
        └── lib/mockData.ts      ← 19 enheter, 5 bygg, priser, alarmer (demo)

```

## Kjøring

### Edge (RPi)
```bash
pip install -r edge/requirements.txt
python edge/main.py
```

### Backend
```bash
cd backend
docker compose up -d
```
- Grafana: http://localhost:3000 (admin/changeme)
- InfluxDB: http://localhost:8086 (token: `hvac-super-secret-token`)
- API: http://localhost:8000

### Dashboard (utvikling)
```bash
cd dashboard
npm install
npm run dev
```
Åpnes på http://localhost:5173

## Optimaliseringslogikk
| Strømpris | Varmepumpe | Kjøleanlegg |
|-----------|-----------|------------|
| < 0.50 kr/kWh | Forvarm +2°C (lagre termisk energi) | Prekjøl −2°C |
| 0.50–1.20 kr | Normal / se neste time | Normal |
| > 1.20 kr/kWh | Reduser −2°C (bruk termisk buffer) | Slapp av +2°C |

Komfortgrenser: varme 18–24°C, kjøling 18–26°C. Enheter med aktiv alarm hoppes over.

## Støttede produsenter
- **Carel** — pCO5+, IR33, MPXPRO
- **System Air** — Topline EC / SAVE VTR 150–1200, Villavent VR
- **Danfoss** — FC51/101/102/202/301/302, AK-SC255/355, ECL Comfort 210/310, Optyma Plus
- **Eliwell** — EWCM 4120/4140, IC915/IC902, EWDR 974, ID961 LX
- **Swegon** — GOLD RX/LP/VX/CX, CASA R, RUBY VAV

## Neste steg
- Tilpass registeradresser i `edge/config.yaml` til faktisk utstyr og firmware
- Tilpass CAN-feilkodene i `edge/can_reader.py` til anleggets feilkodetabell
- Bytt ut mockdata i `dashboard/src/lib/mockData.ts` med ekte API-kall mot FastAPI
- Sett opp SSL/TLS på Mosquitto for sikker 4G-kommunikasjon
- Legg til valutakurs-API for nøyaktig EUR→NOK konvertering i nordpool.py
