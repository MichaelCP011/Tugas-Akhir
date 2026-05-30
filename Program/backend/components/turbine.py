import config

class Turbine:
    def __init__(self):
        self.p_mech_mw = 0.0

    def calculate_power(self, steam_flow_kgs, t_boiler, p_boiler):
        # [REVISI] Pendekatan deviasi linear yang presisi (Aproksimasi Deret Taylor)
        t_deviation = (t_boiler - config.NOMINAL_TEMP) / config.NOMINAL_TEMP * 0.02
        p_deviation = (p_boiler - config.NOMINAL_PRESSURE) / config.NOMINAL_PRESSURE * 0.05
        
        delta_h_actual = config.ENTHALPY_DROP_NOMINAL * (1.0 + t_deviation + p_deviation)
        
        self.p_mech_mw = steam_flow_kgs * delta_h_actual * config.TURBINE_EFF
        
        if self.p_mech_mw < 0:
            self.p_mech_mw = 0.0
            
        return self.p_mech_mw