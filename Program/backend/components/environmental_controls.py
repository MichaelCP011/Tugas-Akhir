import config
import math

class AirFlowSystem:
    def __init__(self):
        self.air_flow_pct = 65.0
        self.optimal_afr = 4.5
        self.efficiency_factor = 1.0
        
    def calculate_efficiency_factor(self, fuel_feed_tph, air_flow_pct):
        fuel_rate_kgs = fuel_feed_tph * (1000.0 / 3600.0)
        
        # [CRITICAL FIX] Max air disesuaikan dengan optimal AFR
        # Mengasumsikan 100% FD Fan dapat mensuplai 4.5x udara dari laju batubara maksimal
        max_air_supply_kgs = self.optimal_afr 
        air_rate_kgs = (air_flow_pct / 100.0) * fuel_rate_kgs * max_air_supply_kgs
        
        if fuel_rate_kgs > 0:
            actual_afr = air_rate_kgs / fuel_rate_kgs
        else:
            actual_afr = 0
            
        if fuel_rate_kgs > 0.01:
            afr_ratio = actual_afr / self.optimal_afr
            # [FIXED] Kurva efisiensi lebih lenient: memungkinkan AFR 0.7-1.3
            efficiency_factor = math.exp(-2.0 * ((afr_ratio - 1.0) ** 2))
            self.efficiency_factor = max(0.5, min(1.0, efficiency_factor))
        else:
            self.efficiency_factor = 0.0
            
        self.air_flow_pct = air_flow_pct
        return self.efficiency_factor


class BoilerWaterLevel:
    def __init__(self):
        self.water_level_pct = 80.0
        self.water_inlet_pct = 80.0
        
    def update(self, steam_flow_kgs, water_inlet_pct, dt=1.0):
        max_feedwater_rate_kgs = config.MAX_FEEDWATER_RATE_KGS
        feedwater_rate_kgs = (water_inlet_pct / 100.0) * max_feedwater_rate_kgs
        
        # [FIXED] k_level diperbesar agar water level lebih stabil (kurang responsive)
        k_level = 1000.0  # Dari 300.0 → 1000.0 (lebih inertia)
        delta_level = ((feedwater_rate_kgs - steam_flow_kgs) / k_level) * dt
        
        self.water_level_pct += delta_level
        self.water_level_pct = max(0.0, min(100.0, self.water_level_pct))
        self.water_inlet_pct = water_inlet_pct
        return self.water_level_pct
    
    def get_temperature_impact(self):
        # [FIXED] Dampak pendinginan: JANGAN kalikan dengan 1000
        # ENTHALPY sudah dalam MW, langsung gunakan tanpa konversi
        h_feedwater_inlet = config.ENTHALPY_FEED_WATER
        h_feedwater_outlet = config.ENTHALPY_STEAM_OUT
        delta_h_feedwater = h_feedwater_outlet - h_feedwater_inlet
        
        actual_feedwater_kgs = (self.water_inlet_pct / 100.0) * config.MAX_FEEDWATER_RATE_KGS
        energy_for_feedwater_mw = actual_feedwater_kgs * delta_h_feedwater
        
        # [FIXED] Jangan × 1000, karena ENTHALPY_RISE sudah dalam MW·s/kg
        dt_impact = -(energy_for_feedwater_mw) / (config.BOILER_MASS * config.CP_BOILER)
        return dt_impact
