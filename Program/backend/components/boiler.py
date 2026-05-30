import config
import math
from components.environmental_controls import BoilerWaterLevel

class Boiler:
    def __init__(self):
        self.temperature = config.NOMINAL_TEMP
        self.pressure = config.NOMINAL_PRESSURE
        self.water_level = BoilerWaterLevel()

    def update(self, q_in_mw, steam_flow_out_kgs, water_inlet_pct, dt=1.0):
        # 1. Update massa air di drum
        self.water_level.update(steam_flow_out_kgs, water_inlet_pct, dt)
        
        # 2. Kalkulasi energi keluar (Uap) dan energi terserap pendinginan (Air Masuk)
        q_out_mw = steam_flow_out_kgs * config.ENTHALPY_RISE
        dt_temp_from_inlet = self.water_level.get_temperature_impact() * dt
        
        # 3. Update suhu boiler (Energi Masuk - Energi Keluar - Pendinginan)
        # [FIXED] Formula disesuaikan dengan CP_BOILER yang sudah diperbaiki
        dt_temp_from_flow = ((q_in_mw - q_out_mw) / (config.BOILER_MASS * config.CP_BOILER)) * dt
        self.temperature += dt_temp_from_flow + dt_temp_from_inlet
        
        if self.temperature < 30.0:
            self.temperature = 30.0

        # 4. Update Tekanan (Clausius-Clapeyron)
        if self.temperature > 100.0:
            exponent = (2257.0 / 0.461) * ((1.0 / (config.NOMINAL_TEMP + 273.15)) - (1.0 / (self.temperature + 273.15)))
            try:
                self.pressure = config.NOMINAL_PRESSURE * math.exp(exponent)
            except OverflowError:
                self.pressure = 300.0 # Mentok untuk memicu fatal error
        else:
            self.pressure = 1.0

        return self.temperature, self.pressure, self.water_level.water_level_pct
