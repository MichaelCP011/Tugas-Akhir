# ==========================================
# KONSTANTA FISIKA & PARAMETER PLTU 300 MW
# (REVISI BERDASARKAN STANDAR TERMODINAMIKA)
# ==========================================

# Parameter Batubara & Pembakaran
LHV_COAL = 17.5         # Nilai Kalor Bawah batubara (MJ/kg)
FURNACE_EFF = 0.88      # Efisiensi perpindahan panas
MAX_COAL_FEED = 220.0   # Kapasitas maksimum coal feeder (ton/jam)

# Parameter Boiler & Air
BOILER_MASS = 50000.0   # Massa ekuivalen boiler & air (kg)
CP_BOILER = 0.0023      # [REVISI] Kapasitas panas spesifik saturated steam (MJ/kg°C)
NOMINAL_TEMP = 540.0    # Suhu desain uap utama (°C)
NOMINAL_PRESSURE = 165.0# Tekanan desain uap utama (Bar)

# Parameter Entalpi (Hukum Termodinamika I)
ENTHALPY_FEED_WATER = 0.167 # [REVISI] Entalpi air masuk pada ~40°C (MJ/kg)
ENTHALPY_STEAM_OUT = 3.456  # [REVISI] Entalpi uap keluar pada 540°C, 165 bar (MJ/kg)
ENTHALPY_RISE = ENTHALPY_STEAM_OUT - ENTHALPY_FEED_WATER # ~3.289 MJ/kg (Energi yang diserap)

# Parameter Valve & Turbin
VALVE_CV = 28.0         # Koefisien aliran katup
TURBINE_EFF = 0.85      # Efisiensi isentropik turbin uap
ENTHALPY_DROP_NOMINAL = 1.293 # [REVISI] Penurunan entalpi ideal dari 165 bar ke 5 bar (MJ/kg)

# Parameter Generator
GENERATOR_EFF = 0.98    # Efisiensi generator