export interface IDatePoint {
  date: string;
  creatad: string;
}

export interface IRegistredUsersByDate {
  registredUsers: IDatePoint[];
  onlineUsers: string;
}
