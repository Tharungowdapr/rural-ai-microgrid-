from typing import List, Dict, Tuple
from app.simulation.engine import Village, VillageStatus

class EMSController:
    """Energy Management System - Decides load shedding and power transfers"""
    
    def __init__(self):
        self.min_soc_threshold = 30  # %
        self.critical_load_priority = True
        
    async def run(self, villages: List[Village]) -> List[Dict]:
        """
        Run EMS logic and return transfer decisions
        
        Returns:
            List of transfer decisions: [{"source": "...", "destination": "...", "rate": ...}]
        """
        decisions = []
        
        # Identify deficit villages
        deficit_villages = [v for v in villages if v.status == VillageStatus.DEFICIT]
        surplus_villages = [v for v in villages if v.status == VillageStatus.SURPLUS]
        
        # For each deficit village, find surplus suppliers
        for deficit_village in deficit_villages:
            # Calculate how much power is needed
            needed_power = deficit_village.demand - deficit_village.solarGeneration
            
            if needed_power <= 0:
                continue
            
            # Find best supplier (closest surplus village with enough power)
            best_supplier = self._find_best_supplier(
                deficit_village, surplus_villages, needed_power
            )
            
            if best_supplier:
                # Calculate transfer rate (considering transmission efficiency)
                transfer_rate = min(needed_power, best_supplier.solarGeneration - best_supplier.demand)
                
                if transfer_rate > 5:  # Only transfer if significant
                    decisions.append({
                        "source": best_supplier.id,
                        "destination": deficit_village.id,
                        "rate": transfer_rate,
                    })
        
        # Handle load shedding for critical low SOC
        for village in villages:
            if village.soc < self.min_soc_threshold:
                # Shed non-critical loads first
                if village.standardLoad > 0:
                    village.standardLoad *= 0.5  # Reduce by 50%
                    
                    # If still low, shed critical loads
                    if village.soc < 20:
                        village.criticalLoad *= 0.8
        
        return decisions
    
    def _find_best_supplier(
        self, deficit_village: Village, surplus_villages: List[Village], needed_power: float
    ) -> Village:
        """Find the best supplier for a deficit village"""
        
        if not surplus_villages:
            return None
        
        # Sort by distance (euclidean)
        def distance(v1: Village, v2: Village) -> float:
            return ((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2) ** 0.5
        
        # Sort by distance and available power
        candidates = [
            (v, distance(deficit_village, v), v.solarGeneration - v.demand)
            for v in surplus_villages
            if v.solarGeneration - v.demand > 5  # Has available power
        ]
        
        if not candidates:
            return None
        
        # Prefer closer villages with more available power
        candidates.sort(key=lambda x: x[1])  # Sort by distance
        
        return candidates[0][0]
    
    async def handle_relay_failure(self, relay_id: str, villages: List[Village]) -> List[Dict]:
        """
        Reroute transfers when a relay fails
        """
        # This would need network topology information
        # For now, just remove transfers through the failed relay
        decisions = []
        
        # In a real system, find alternate paths
        for village in villages:
            if village.status == VillageStatus.DEFICIT:
                # Try to find alternate suppliers
                pass
        
        return decisions
