export interface LoginResponse {
  token: string;
  idUsuario: string;
  nombre: string;
  rol: string;
  expiraEn: number;
}