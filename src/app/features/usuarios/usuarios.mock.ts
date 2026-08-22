/* =====================================================================
   DATOS DE DEMOSTRACION — ELIMINAR AL CONECTAR EL BACKEND
   =====================================================================
   Este archivo existe solo para que la pantalla se pueda ver y navegar
   sin endpoints. Cuando el backend exponga los servicios, se borra
   completo y en usuarios.ts se reemplazan las asignaciones iniciales por
   las llamadas HTTP correspondientes:

     MOCK_EMPRESAS        -> GET /api/empresas
     MOCK_SUCURSALES      -> GET /api/sucursales
     MOCK_GENEROS         -> GET /api/generos
     MOCK_STATUS_USUARIO  -> GET /api/status-usuario
     MOCK_ROLES           -> GET /api/roles
     MOCK_USUARIOS        -> GET /api/usuarios
   ===================================================================== */

import {
  Empresa,
  Genero,
  Role,
  StatusUsuario,
  Sucursal,
} from '../../core/models/catalogo.model';
import { UsuarioResponse } from '../../core/models/usuario.model';

export const MOCK_EMPRESAS: Empresa[] = [
  {
    idEmpresa: 1,
    nombre: 'Software Inc.',
    direccion: 'San Jose Pinula, Guatemala',
    nit: '12345678-9',
    passwordLargo: 8,
    passwordCantidadMayusculas: 1,
    passwordCantidadMinusculas: 1,
    passwordCantidadNumeros: 2,
    passwordCantidadCaracteresEspeciales: 1,
    passwordCantidadCaducidadDias: 60,
    passwordIntentosAntesDeBloquear: 5,
    passwordCantidadPreguntasValidar: 1,
  },
  {
    idEmpresa: 2,
    nombre: 'Distribuidora del Valle',
    direccion: 'Zona 4, Ciudad de Guatemala',
    nit: '98765432-1',
    passwordLargo: 12,
    passwordCantidadMayusculas: 2,
    passwordCantidadMinusculas: 2,
    passwordCantidadNumeros: 2,
    passwordCantidadCaracteresEspeciales: 2,
    passwordCantidadCaducidadDias: 30,
    passwordIntentosAntesDeBloquear: 3,
    passwordCantidadPreguntasValidar: 2,
  },
];

export const MOCK_SUCURSALES: Sucursal[] = [
  { idSucursal: 1, nombre: 'Oficinas Centrales', direccion: 'San Jose Pinula', idEmpresa: 1 },
  { idSucursal: 2, nombre: 'Sucursal Zona 10', direccion: '8va. Calle 2-46 z.10', idEmpresa: 1 },
  { idSucursal: 3, nombre: 'Sucursal Xela', direccion: 'Quetzaltenango', idEmpresa: 1 },
  { idSucursal: 4, nombre: 'Bodega Central', direccion: 'Zona 4, Guatemala', idEmpresa: 2 },
  { idSucursal: 5, nombre: 'Centro de Distribucion Sur', direccion: 'Villa Nueva', idEmpresa: 2 },
];

export const MOCK_GENEROS: Genero[] = [
  { idGenero: 1, nombre: 'Masculino' },
  { idGenero: 2, nombre: 'Femenino' },
];

export const MOCK_STATUS_USUARIO: StatusUsuario[] = [
  { idStatusUsuario: 1, nombre: 'Activo' },
  { idStatusUsuario: 2, nombre: 'Bloqueado por intentos de acceso' },
  { idStatusUsuario: 3, nombre: 'Inactivo' },
];

export const MOCK_ROLES: Role[] = [
  { idRole: 1, nombre: 'Administrador' },
  { idRole: 2, nombre: 'Sin Opciones' },
  { idRole: 3, nombre: 'Consulta' },
];

export const MOCK_USUARIOS: UsuarioResponse[] = [
  {
    idUsuario: 'Administrador',
    nombre: 'Administrador',
    apellido: 'IT',
    fechaNacimiento: '1990-05-15',
    idStatusUsuario: 1,
    idGenero: 1,
    idSucursal: 1,
    idRole: 1,
    correoElectronico: 'itadmin@example.com',
    telefonoMovil: '5555-1234',
    pregunta: '¿Nombre de tu curso preferido?',
    respuesta: 'Analisis de Sistemas II',
    fotografiaBase64: null,
    requiereCambiarPassword: false,
    ultimaFechaIngreso: '2026-08-13T09:51:36',
    intentosDeAcceso: 0,
    sesionActual: '4f21c8a0-91bb-4a0e-9c4e-2b7d55e91f10',
    ultimaFechaCambioPassword: '2026-07-01T10:00:00',
    fechaCreacion: '2026-06-15T08:30:00',
    usuarioCreacion: 'system',
    fechaModificacion: '2026-08-01T14:22:00',
    usuarioModificacion: 'Administrador',
  },
  {
    idUsuario: 'system',
    nombre: 'Nologin',
    apellido: 'Nologin',
    fechaNacimiento: '1990-05-15',
    idStatusUsuario: 1,
    idGenero: 1,
    idSucursal: 1,
    idRole: 2,
    correoElectronico: 'system@example.com',
    telefonoMovil: '5555-1234',
    pregunta: '¿Nombre de tu primera mascota?',
    respuesta: 'Rex',
    fotografiaBase64: null,
    requiereCambiarPassword: true,
    ultimaFechaIngreso: null,
    intentosDeAcceso: 0,
    sesionActual: null,
    ultimaFechaCambioPassword: null,
    fechaCreacion: '2026-06-15T08:30:00',
    usuarioCreacion: 'system',
    fechaModificacion: null,
    usuarioModificacion: null,
  },
  {
    idUsuario: 'bmorales',
    nombre: 'Bryan',
    apellido: 'Morales Lopez',
    fechaNacimiento: '1999-11-02',
    idStatusUsuario: 1,
    idGenero: 1,
    idSucursal: 2,
    idRole: 3,
    correoElectronico: 'bmorales@example.com',
    telefonoMovil: '4412-8890',
    pregunta: '¿Ciudad donde naciste?',
    respuesta: 'Quetzaltenango',
    fotografiaBase64: null,
    requiereCambiarPassword: false,
    ultimaFechaIngreso: '2026-08-12T17:04:11',
    intentosDeAcceso: 1,
    sesionActual: null,
    ultimaFechaCambioPassword: '2026-08-02T09:15:00',
    fechaCreacion: '2026-07-20T11:00:00',
    usuarioCreacion: 'Administrador',
    fechaModificacion: null,
    usuarioModificacion: null,
  },
  {
    idUsuario: 'lgarcia',
    nombre: 'Lucia',
    apellido: 'Garcia Ruiz',
    fechaNacimiento: '1995-03-24',
    idStatusUsuario: 2,
    idGenero: 2,
    idSucursal: 3,
    idRole: 3,
    correoElectronico: 'lgarcia@example.com',
    telefonoMovil: '3021-7745',
    pregunta: '¿Nombre de tu primera mascota?',
    respuesta: 'Nube',
    fotografiaBase64: null,
    requiereCambiarPassword: true,
    ultimaFechaIngreso: '2026-08-10T08:45:00',
    intentosDeAcceso: 5,
    sesionActual: null,
    ultimaFechaCambioPassword: '2026-05-30T16:40:00',
    fechaCreacion: '2026-07-01T09:00:00',
    usuarioCreacion: 'Administrador',
    fechaModificacion: '2026-08-10T08:50:00',
    usuarioModificacion: 'Administrador',
  },
  {
    idUsuario: 'dalvarez',
    nombre: 'Donovan',
    apellido: 'Alvarez Perez',
    fechaNacimiento: '1997-07-09',
    idStatusUsuario: 3,
    idGenero: 1,
    idSucursal: 4,
    idRole: 2,
    correoElectronico: 'dalvarez@example.com',
    telefonoMovil: '5588-2210',
    pregunta: '¿Color favorito?',
    respuesta: 'Azul',
    fotografiaBase64: null,
    requiereCambiarPassword: false,
    ultimaFechaIngreso: '2026-06-28T13:12:00',
    intentosDeAcceso: 0,
    sesionActual: null,
    ultimaFechaCambioPassword: '2026-06-01T10:00:00',
    fechaCreacion: '2026-05-18T15:30:00',
    usuarioCreacion: 'system',
    fechaModificacion: null,
    usuarioModificacion: null,
  },
];
