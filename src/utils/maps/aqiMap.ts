type CategoryInfo = { category: string; textColor: string };

export const getAqiCategory = (aqi: number): CategoryInfo => {
  if (aqi > 0 && aqi <= 50) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (aqi <= 100) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (aqi <= 150) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (aqi <= 200) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (aqi <= 300) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (aqi <= 500) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (aqi > 500) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const getPm10Category = (concentration: number): CategoryInfo => {
  if (concentration > 0 && concentration <= 12) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (concentration <= 35.5) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (concentration <= 55.5) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (concentration <= 150.5) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (concentration <= 250.5) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 350.5) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 350.5) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const getPm2_5Category = (concentration: number): CategoryInfo => {
  if (concentration > 0 && concentration <= 55) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (concentration <= 155) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (concentration <= 255) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (concentration <= 355) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (concentration <= 425) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 505) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 505) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const getCOCategory = (concentration: number): CategoryInfo => {
  if (concentration > 0 && concentration <= 4.5) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (concentration <= 9.5) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (concentration <= 12.5) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (concentration <= 15.5) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (concentration <= 30.5) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 40.5) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 40.5) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const getNO2Category = (concentration: number): CategoryInfo => {
  if (concentration > 0 && concentration <= 54) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (concentration <= 100) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (concentration <= 360) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (concentration <= 650) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (concentration <= 1250) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 1650) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 1650) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const getS02Category = (concentration: number): CategoryInfo => {
  if (concentration <= 605) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 805) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 805) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};

export const get03Category = (concentration: number): CategoryInfo => {
  if (concentration > 0 && concentration <= 55) {
    return { category: "Good", textColor: "text-green-500" };
  } else if (concentration <= 70) {
    return { category: "Moderate", textColor: "text-yellow-500" };
  } else if (concentration <= 85) {
    return {
      category: "Unhealthy (SG)",
      textColor: "text-orange-500",
    };
  } else if (concentration <= 105) {
    return { category: "Unhealthy", textColor: "text-red-400" };
  } else if (concentration <= 200) {
    return { category: "Very unhealthy", textColor: "text-purple-500" };
  } else if (concentration <= 405) {
    return { category: "Hazardous", textColor: "text-red-600" };
  } else if (concentration > 405) {
    return { category: "Severe", textColor: "text-red-600" };
  } else {
    return { category: "N/A", textColor: "N/A" };
  }
};
