import config
import math

class Boiler:
    def __init__(self):
        self.temperature = config.NOMINAL_TEMP
        self.pressure = config.NOMINAL_PRESSURE

    def update(self, q_in_mw, steam_flow_out_kgs, dt=1.0):
        # [REVISI] Q_out sekarang menggunakan selisih entalpi (H_out - H_in) yang benar!
        q_out_mw = steam_flow_out_kgs * config.ENTHALPY_RISE
        
        # [REVISI] dT/dt dengan nilai Cp yang akurat (0.0023 MJ/kgK)
        dt_temp = ((q_in_mw - q_out_mw) / (config.BOILER_MASS * config.CP_BOILER)) * dt
        self.temperature += dt_temp

        if self.temperature < 30.0:
            self.temperature = 30.0

        # [REVISI] Menggunakan Persamaan Clausius-Clapeyron untuk tekanan
        if self.temperature > 100.0:
            delta_h_vap = 2257.0  # kJ/kg (entalpi vaporisasi)
            R_specific = 0.461    # kJ/kgK (konstanta spesifik uap)
            t_kelvin = self.temperature + 273.15
            t_nominal_kelvin = config.NOMINAL_TEMP + 273.15
            
            exponent = (delta_h_vap / R_specific) * ((1.0 / t_nominal_kelvin) - (1.0 / t_kelvin))
            
            try:
                self.pressure = config.NOMINAL_PRESSURE * math.exp(exponent)
            except OverflowError:
                self.pressure = 250.0 # Safety cap jika suhu meledak terlalu tinggi
        else:
            self.pressure = 1.0

        return self.temperature, self.pressure