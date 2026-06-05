import config
import math
from components.environmental_controls import BoilerWaterLevel

class Boiler:
    def __init__(self):
        self.temperature = config.NOMINAL_TEMP
        self.pressure = config.NOMINAL_PRESSURE
        self.water_level = BoilerWaterLevel()

    def update(self, q_in_mw, steam_flow_out_kgs, water_inlet_pct, dt=1.0):
        level_pct, feedwater_kgs = self.water_level.update(steam_flow_out_kgs, water_inlet_pct, dt)
        
        q_steam_out = steam_flow_out_kgs * config.ENTHALPY_STEAM_OUT
        q_water_in = feedwater_kgs * config.ENTHALPY_FEED_WATER
        
        net_heat_mw = q_in_mw + q_water_in - q_steam_out
        
        dt_temp = (net_heat_mw / (config.BOILER_MASS * config.CP_BOILER)) * dt
        self.temperature += dt_temp
        
        if self.temperature < 30.0:
            self.temperature = 30.0

        if self.temperature > 100.0:
            exponent = 5423.0 * ((1.0 / (config.NOMINAL_TEMP + 273.15)) - (1.0 / (self.temperature + 273.15)))
            try:
                self.pressure = config.NOMINAL_PRESSURE * math.exp(exponent)
            except OverflowError:
                self.pressure = 300.0 
        else:
            self.pressure = 1.0

        return self.temperature, self.pressure, self.water_level.water_level_pct