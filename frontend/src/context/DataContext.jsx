import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [farms, setFarms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myVet, setMyVet] = useState(null);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshAnimals = useCallback(async () => {
    if (!user) return;
    setAnimals(await api.getAnimals());
  }, [user]);

  const refreshFarms = useCallback(async () => {
    if (user?.role === "vet") setFarms(await api.getFarms());
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications(await api.getNotifications());
  }, [user]);

  const refreshMyVet = useCallback(async () => {
    if (user?.role === "farmer") setMyVet(await api.getMyVet());
  }, [user]);

  const refreshVets = useCallback(async () => {
    if (user?.role === "farmer" || user?.role === "vet")
      setVets(await api.getVets());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      refreshAnimals(),
      refreshFarms(),
      refreshNotifications(),
      refreshMyVet(),
      refreshVets(),
    ]).finally(() => setLoading(false));
  }, [
    user,
    refreshAnimals,
    refreshFarms,
    refreshNotifications,
    refreshMyVet,
    refreshVets,
  ]);

  const addAnimal = async (animal) => {
    await api.addAnimal(animal);
    await refreshAnimals();
  };
  const deleteAnimal = async (id) => {
    await api.deleteAnimal(id);
    await refreshAnimals();
  };
  const addMedicineRecord = async (payload) => {
    await api.addMedicine(payload);
    await refreshAnimals();
  };
  const setAnimalStatus = async (id, status) => {
    await api.setAnimalStatus(id, status);
    await refreshAnimals();
  };
  const vetSendNotification = async (farmId, message, title) => {
    await api.vetSendNotification({ farmId, message, title });
    await refreshNotifications();
  };
  const assignVetToFarm = async (farmId, vetId) => {
    await api.assignVetToFarm(farmId, vetId);
    await refreshMyVet();
  };

  return (
    <DataContext.Provider
      value={{
        animals,
        farms,
        notifications,
        myVet,
        vets,
        loading,
        addAnimal,
        deleteAnimal,
        addMedicineRecord,
        setAnimalStatus,
        vetSendNotification,
        assignVetToFarm,
        refreshFarms,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
