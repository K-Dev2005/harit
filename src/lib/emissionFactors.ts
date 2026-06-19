export const EMISSION_FACTORS = {
  // Transport (kg CO2e per km)
  'petrol cab': 0.21,
  'ola': 0.21,
  'uber': 0.21,
  'auto-rickshaw': 0.10,
  'personal petrol car': 0.21,
  'electric cab': 0.07,
  'metro': 0.022,
  'bus (city)': 0.089,
  'train - sleeper (sl)': 0.016,
  'train - 3a': 0.021,
  'train - 2a': 0.024,
  'train - chair car (cc)': 0.029,
  'flight (economy)': 0.255 * 1.9, // Includes radiative forcing

  // Food (kg CO2e per meal)
  'non-veg meal': 3.0,
  'veg meal': 1.2,
  'vegan meal': 0.7,

  // Additional modifiers
  'food delivery packaging': 0.05, // Flat per order
};
