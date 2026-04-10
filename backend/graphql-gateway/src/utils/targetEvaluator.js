/**
 * Evaluates an entity's data against a JSON rule segment.
 * Supports basic implicit equality and $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
 * * @param {Object} entityData - The real data of the User/DeliveryPartner
 * @param {Object} targetSegment - The JSON rules (e.g., { zoneId: "z1", totalOrders: { $gte: 5 } })
 * @returns {Boolean} - True if the entity matches all rules
 */
export const evaluateTargetSegment = (entityData, targetSegment) => {
  if (!targetSegment || Object.keys(targetSegment).length === 0) {
    return true; // No rules means it applies to everyone in the TargetEntity group
  }
 
  for (const [key, condition] of Object.entries(targetSegment)) {
    const entityValue = entityData[key];
 
    // If the condition is a simple primitive, do a direct equality check
    if (typeof condition !== 'object' || condition === null) {
      if (entityValue !== condition) return false;
      continue;
    }
 
    // Handle MongoDB-style operators
    if (condition.$eq !== undefined && entityValue !== condition.$eq) return false;
    if (condition.$ne !== undefined && entityValue === condition.$ne) return false;
    if (condition.$gt !== undefined && entityValue <= condition.$gt) return false;
    if (condition.$gte !== undefined && entityValue < condition.$gte) return false;
    if (condition.$lt !== undefined && entityValue >= condition.$lt) return false;
    if (condition.$lte !== undefined && entityValue > condition.$lte) return false;
 
    if (condition.$in && Array.isArray(condition.$in)) {
      if (!condition.$in.includes(entityValue)) return false;
    }
    if (condition.$nin && Array.isArray(condition.$nin)) {
      if (condition.$nin.includes(entityValue)) return false;
    }
  }
 
  return true; // Passed all segment conditions
};
 
 