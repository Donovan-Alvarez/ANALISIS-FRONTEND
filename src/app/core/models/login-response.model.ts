export interface LoginResponse {
  token: string;
  idUsuario: string;
  nombre: string;
  idRole: number;
  nombreRole: string;
  expiraEn: number;
}