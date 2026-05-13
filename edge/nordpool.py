import logging
import httpx
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from dataclasses import dataclass

log = logging.getLogger(__name__)

NORDPOOL_URL = "https://www.nordpoolgroup.com/api/marketdata/page/10"
AREA_INDEX = {
    "NO1": 0, "NO2": 1, "NO3": 2, "NO4": 3, "NO5": 4,
    "SE1": 5, "SE2": 6, "SE3": 7, "SE4": 8,
    "DK1": 9, "DK2": 10,
}

TZ = ZoneInfo("Europe/Oslo")


@dataclass
class HourlyPrice:
    hour: int       # 0-23
    price_nok: float
    date: date


@dataclass
class PriceForecast:
    fetched_at: datetime
    area: str
    today: list[HourlyPrice]
    tomorrow: list[HourlyPrice]

    def price_at(self, dt: datetime) -> float | None:
        target_date = dt.date()
        target_hour = dt.hour
        for source in (self.today, self.tomorrow):
            for p in source:
                if p.date == target_date and p.hour == target_hour:
                    return p.price_nok
        return None

    def cheapest_hours(self, n: int = 4, on_date: date | None = None) -> list[int]:
        target = on_date or date.today()
        prices = [p for p in self.today + self.tomorrow if p.date == target]
        prices.sort(key=lambda p: p.price_nok)
        return [p.hour for p in prices[:n]]

    def most_expensive_hours(self, n: int = 4, on_date: date | None = None) -> list[int]:
        target = on_date or date.today()
        prices = [p for p in self.today + self.tomorrow if p.date == target]
        prices.sort(key=lambda p: p.price_nok, reverse=True)
        return [p.hour for p in prices[:n]]


class NordPoolClient:
    def __init__(self, area: str = "NO1"):
        self.area = area
        self._area_idx = AREA_INDEX.get(area, 0)
        self._cache: PriceForecast | None = None
        self._cache_date: date | None = None

    def get_prices(self, force_refresh: bool = False) -> PriceForecast | None:
        today = datetime.now(TZ).date()
        if not force_refresh and self._cache and self._cache_date == today:
            return self._cache

        try:
            forecast = self._fetch(today)
            self._cache = forecast
            self._cache_date = today
            log.info(
                "Nord Pool priser hentet for %s — i dag: %.2f–%.2f kr/kWh",
                self.area,
                min(p.price_nok for p in forecast.today),
                max(p.price_nok for p in forecast.today),
            )
            return forecast
        except Exception as e:
            log.error("Klarte ikke hente Nord Pool priser: %s", e)
            return self._cache  # returner gammel cache ved feil

    def _fetch(self, for_date: date) -> PriceForecast:
        params = {
            "currency": "NOK",
            "endDate": for_date.strftime("%d-%m-%Y"),
        }
        with httpx.Client(timeout=10) as client:
            resp = client.get(NORDPOOL_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        today_prices = self._parse_rows(data, for_date)
        tomorrow = for_date + timedelta(days=1)

        try:
            params["endDate"] = tomorrow.strftime("%d-%m-%Y")
            with httpx.Client(timeout=10) as client:
                resp2 = client.get(NORDPOOL_URL, params=params)
                resp2.raise_for_status()
                tomorrow_prices = self._parse_rows(resp2.json(), tomorrow)
        except Exception:
            tomorrow_prices = []

        return PriceForecast(
            fetched_at=datetime.now(TZ),
            area=self.area,
            today=today_prices,
            tomorrow=tomorrow_prices,
        )

    def _parse_rows(self, data: dict, for_date: date) -> list[HourlyPrice]:
        prices = []
        try:
            rows = data["data"]["Rows"]
            for row in rows:
                time_str = row.get("StartTime", "")
                if not time_str:
                    continue
                try:
                    hour = int(time_str.split("T")[1][:2])
                except (IndexError, ValueError):
                    continue

                cols = row.get("Columns", [])
                if self._area_idx >= len(cols):
                    continue

                raw = cols[self._area_idx].get("Value", "").replace(",", ".").replace(" ", "")
                try:
                    price_eur_mwh = float(raw)
                    # EUR/MWh → NOK/kWh (approximert, bruk faktisk valutakurs ved behov)
                    price_nok_kwh = price_eur_mwh * 0.001 * 11.8
                    prices.append(HourlyPrice(hour=hour, price_nok=round(price_nok_kwh, 4), date=for_date))
                except ValueError:
                    continue
        except (KeyError, TypeError) as e:
            log.warning("Klarte ikke parse Nord Pool data: %s", e)

        return sorted(prices, key=lambda p: p.hour)
