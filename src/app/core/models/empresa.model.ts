export interface Empresa {

    idEmpresa?: number;

    nombre: string;
    direccion: string;
    nit: string;
    passwordCantidadMayusculas: number;
    passwordCantidadMinusculas: number;
    passwordCantidadNumeros: number;
    passwordCantidadCaracteresEspeciales: number;
    passwordLargo: number;
    passwordIntentosAntesDeBloquear: number;
    passwordCantidadCaducidadDias: number;
    passwordCantidadPreguntasValidar: number;
}