from components .furnace import Furnace 
from components .boiler import Boiler 
from components .valve import Valve 
from components .turbine import Turbine 
from components .generator import Generator 
import config 

class PlantOrchestrator :
    def __init__ (self ):
        self .furnace =Furnace ()
        self .boiler =Boiler ()
        self .valve =Valve ()
        self .turbine =Turbine ()
        self .generator =Generator ()

        self .health_point =100.0 
        self .is_tripped =False 
        self .is_running =False 
        self .alarms =[]

    def reset_plant (self ):
        self .health_point =100.0 
        self .is_tripped =False 
        self .is_running =False 
        self .boiler .temperature =config .NOMINAL_TEMP 
        self .boiler .pressure =config .NOMINAL_PRESSURE 
        self .boiler .water_level .water_level_pct =50.0 
        self .alarms .clear ()

    def update_step (self ,fuel_feed_tph ,valve_opening_pct ,water_inlet_pct ,air_flow_pct ,dt =1.0 ):
        if self .is_tripped or not self .is_running :
            fuel_feed_tph =valve_opening_pct =water_inlet_pct =air_flow_pct =0.0 

        q_in =self .furnace .calculate_heat (fuel_feed_tph ,air_flow_pct )
        steam_flow =self .valve .calculate_flow (valve_opening_pct ,self .boiler .pressure )
        t_boiler ,p_boiler ,water_level =self .boiler .update (q_in ,steam_flow ,water_inlet_pct ,dt )
        p_mech =self .turbine .calculate_power (steam_flow ,t_boiler ,p_boiler )
        mw_out =self .generator .calculate_electrical_power (p_mech )

        self ._check_safety_limits (t_boiler ,p_boiler ,water_level )

        if not self .is_running and not self .is_tripped :
            mw_out =steam_flow =0.0 

        return {
        "mw_out":round (mw_out ,2 ),"steam_press":round (p_boiler ,1 ),
        "boiler_temp":round (t_boiler ,1 ),"steam_flow":round (steam_flow ,1 ),
        "water_level":round (water_level ,1 ),"health":round (self .health_point ,1 ),
        "is_tripped":self .is_tripped ,"is_running":self .is_running ,"alarms":self .alarms 
        }

    def _check_safety_limits (self ,temp ,press ,level ):
        self .alarms .clear ()


        is_fatal =False 
        if temp >=config .FATAL_TEMP :
            self .alarms .append (f"FATAL: TUBE MELTDOWN (>{config .FATAL_TEMP }°C)")
            is_fatal =True 
        if press >=config .FATAL_PRESS :
            self .alarms .append (f"FATAL: BOILER RUPTURE (>{config .FATAL_PRESS } Bar)")
            is_fatal =True 
        if level <=config .FATAL_LEVEL_LOW :
            self .alarms .append ("FATAL: BOILER DRY OUT")
            is_fatal =True 
        if level >=config .FATAL_LEVEL_HIGH :
            self .alarms .append ("FATAL: TURBINE WATER INDUCTION")
            is_fatal =True 

        if is_fatal :
            self .health_point =0.0 
            self .is_tripped =True 
            self .is_running =False 
            return 


        if temp >config .CAUTION_TEMP :
            self .alarms .append ("WARNING: HIGH TEMP")
            self .health_point -=0.5 
        if press >config .CAUTION_PRESS :
            self .alarms .append ("WARNING: HIGH PRESSURE")
            self .health_point -=1.0 

        if level <config .CAUTION_LEVEL_LOW :
            self .alarms .append ("WARNING: LOW WATER LEVEL")
            self .health_point -=0.5 
        elif level >config .CAUTION_LEVEL_HIGH :
            self .alarms .append ("WARNING: HIGH WATER LEVEL")
            self .health_point -=0.5 

        if self .health_point <=0 :
            self .health_point =0.0 
            self .is_tripped =True 
            self .is_running =False 
            self .alarms .append ("SYSTEM TRIPPED - COMPONENTS WORN OUT")