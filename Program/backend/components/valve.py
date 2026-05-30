import config
import math

class Valve:
    def __init__(self):
        self.steam_flow_kgs = 0.0

    def calculate_flow(self, valve_opening_pct, p_boiler, p_turbine=5.0):
        dp = max(0.0, p_boiler - p_turbine)
        
        # [REVISI] Faktor kompresibilitas uap pada tekanan tinggi
        compressibility_factor = 0.98
        
        self.steam_flow_kgs = (config.VALVE_CV * (valve_opening_pct / 100.0) * math.sqrt(dp) * compressibility_factor)
        return self.steam_flow_kgs