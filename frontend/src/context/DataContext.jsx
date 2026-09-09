import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [farms, setFarms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshAnimals = useCallback(async () => {
    if (!user) return;
    setAnimals(await api.getAnimals());
  }, [user]);

  const refreshFarms = useCallback(async () => {
    if (user?.role === "admin") setFarms(await api.getFarms());
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications(await api.getNotifications());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([refreshAnimals(), refreshFarms(), refreshNotifications()]).finally(() => setLoading(false));
  }, [user, refreshAnimals, refreshFarms, refreshNotifications]);

  const addAnimal = async (animal) => {
    await api.addAnimal(animal);
    await refreshAnimals();
  };
  const deleteAnimal = async (id) => {
    await api.deleteAnimal(id);
    await refreshAnimals();
  };
  const addMedicineRecord = async (animalId, medicine) => {
    await api.addMedicine({ animalId, medicine });
    await refreshAnimals();
  };
  const setAnimalStatus = async (id, status) => {
    await api.setAnimalStatus(id, status);
    await refreshAnimals();
  };
  const sendNotification = async (farmId, message) => {
    await api.sendNotification({ farmId, message });
    await refreshNotifications();
  };

  return (
    <DataContext.Provider
      value={{ animals, farms, notifications, loading, addAnimal, deleteAnimal, addMedicineRecord, setAnimalStatus, sendNotification }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
