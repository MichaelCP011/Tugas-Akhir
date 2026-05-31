# ==========================================
# KONSTANTA FISIKA & PARAMETER PLTU 300 MW
# ==========================================

LHV_COAL = 17.5
FURNACE_EFF = 0.88
MAX_COAL_FEED = 220.0

BOILER_MASS = 50000.0
# [FIXED] CP_BOILER diperbaiki: thermal inertia realitik untuk boiler 300MW
CP_BOILER = 3.0         # kJ/kg·K (lebih realitik daripada 0.5)
NOMINAL_TEMP = 540.0
NOMINAL_PRESSURE = 165.0

# [FIXED] Enthalpy values diperbaiki berdasarkan steam tables PLTU 300MW
ENTHALPY_FEED_WATER = 0.8    # MW·s/kg ≈ 800 kJ/kg (feed water @ 150°C, 100 bar)
ENTHALPY_STEAM_OUT = 3.5     # MW·s/kg ≈ 3500 kJ/kg (superheated steam @ 540°C, 165 bar)
ENTHALPY_RISE = ENTHALPY_STEAM_OUT - ENTHALPY_FEED_WATER  # = 2.7 MW·s/kg

VALVE_CV = 28.0
TURBINE_EFF = 0.85
# [FIXED] Enthalpy drop dari 3500 ke 2700 kJ/kg = 0.8 MW·s/kg
ENTHALPY_DROP_NOMINAL = 0.8
GENERATOR_EFF = 0.98

OPTIMAL_AFR = 4.5
MAX_AIR_SUPPLY_KGS = 0.5
# [FIXED] MAX_FEEDWATER_RATE_KGS diperbaiki: max steam flow pada kondisi nominal ≈ 110 kg/s
MAX_FEEDWATER_RATE_KGS = 380.0

CAUTION_TEMP = 560.0
CAUTION_PRESS = 185.0
# [MEDIUM FIX] Margin level air diperketat agar lebih realistis
CAUTION_LEVEL_LOW = 45.0  
CAUTION_LEVEL_HIGH = 80.0 

FATAL_TEMP = 650.0       
FATAL_PRESS = 220.0      
FATAL_LEVEL_LOW = 15.0   
FATAL_LEVEL_HIGH = 90.0
