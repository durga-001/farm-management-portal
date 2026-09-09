export const MEDICINES = ["Oxytetracycline", "Amoxicillin", "Enrofloxacin", "Ceftiofur", "Sulfadiazine"];
export const ANIMAL_TYPES = ["Cow", "Buffalo", "Goat", "Sheep", "Poultry"];

export const initialFarms = [
  { id: "F-01", name: "Shivpuri Farm", owner: "Ramesh Yadav", location: "Bhopal, MP", email: "ramesh@shivpuri.com" },
  { id: "F-02", name: "Green Valley", owner: "Sunita Devi", location: "Indore, MP", email: "sunita@greenvalley.com" },
];

export const initialAnimals = [
  { id: "AN-1001", farmId: "F-01", type: "Cow", ageMonths: 30, weight: 320, status: "safe" },
  { id: "AN-1002", farmId: "F-01", type: "Buffalo", ageMonths: 44, weight: 410, status: "withdrawal" },
  { id: "AN-1003", farmId: "F-01", type: "Goat", ageMonths: 12, weight: 38, status: "safe" },
  { id: "AN-1004", farmId: "F-02", type: "Poultry", ageMonths: 5, weight: 2, status: "unsafe" },
  { id: "AN-1005", farmId: "F-02", type: "Sheep", ageMonths: 20, weight: 45, status: "safe" },
];

export const stateRegistrations = [
  { state: "Madhya Pradesh", count: 128 },
  { state: "Uttar Pradesh", count: 96 },
  { state: "Punjab", count: 74 },
  { state: "Maharashtra", count: 61 },
  { state: "Rajasthan", count: 40 },
];
