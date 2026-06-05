import config

class Turbine:
    def __init__(self):
        self.p_mech_mw = 0.0

    def calculate_power(self, steam_flow_kgs, t_boiler, p_boiler):
        t_dev_curve = 0.015 * ((t_boiler - config.NOMINAL_TEMP) ** 2) / 10000.0
        p_dev_curve = 0.02 * ((p_boiler - config.NOMINAL_PRESSURE) ** 2) / 10000.0
        
        if t_boiler < config.NOMINAL_TEMP:
            t_dev_curve = -t_dev_curve
            
        delta_h_actual = config.ENTHALPY_DROP_NOMINAL * (1.0 + t_dev_curve + p_dev_curve)
        
        self.p_mech_mw = steam_flow_kgs * delta_h_actual * config.TURBINE_EFF
        
        if self.p_mech_mw < 0:
            self.p_mech_mw = 0.0
            
        return self.p_mech_mw