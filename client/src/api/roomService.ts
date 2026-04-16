import axiosInstance from "./axiosInstance";

export interface Room {
  _id: string;
  name: string;
  topic: string;
  createdBy: { _id: string; name: string; avatar: string } | string;
  members: any[];
  isPrivate: boolean;
  createdAt: string;
}

export const getPublicRooms = async (): Promise<Room[]> => {
  const response = await axiosInstance.get("/rooms");
  return response.data;
};

export const createRoom = async (data: {
  name: string;
  topic: string;
  isPrivate: boolean;
  accessCode?: string;
}): Promise<Room> => {
  const response = await axiosInstance.post("/rooms", data);
  return response.data;
};

export const joinRoom = async (roomId: string, accessCode?: string) => {
  const response = await axiosInstance.post(`/rooms/${roomId}/join`, { accessCode });
  return response.data;
};

export const getRoomMessages = async (roomId: string) => {
  const response = await axiosInstance.get(`/rooms/${roomId}/messages`);
  return response.data;
};
