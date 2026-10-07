import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuService } from '../../../core/services/menu.service';

const ICONOS_POR_PAGINA: Record<string, string> = {
  empresas: 'business',
  sucursales: 'store',
  generos: 'wc',
  'status-usuario': 'toggle_on',
  roles: 'admin_panel_settings',
  modulos: 'widgets',
  menus: 'menu',
  opciones: 'list_alt',
  usuarios: 'group',
  'asignacion-permisos': 'security',
  // Planilla (Fase 2): los 16 slugs de contrato-rutas.md.
  'estados-civiles': 'family_restroom',
  'status-empleado': 'how_to_reg',
  'flujo-status-empleado': 'account_tree',
  'tipos-documento': 'description',
  departamentos: 'apartment',
  puestos: 'work',
  personas: 'person',
  'documentos-persona': 'folder_shared',
  bancos: 'account_balance',
  empleados: 'badge',
  'cuentas-bancarias': 'credit_card',
  inasistencias: 'event_busy',
  'calculo-planilla': 'calculate',
  'reporte-planilla': 'summarize',
  'boletas-pago': 'receipt_long',
  liquidacion: 'request_quote',
};
const ICONO_DEFECTO = 'chevron_right';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly menuService = inject(MenuService);

  protected readonly modulos = this.menuService.menu;
  private readonly menusExpandidos = signal<Set<number>>(new Set());

  protected estaExpandido(idMenu: number): boolean {
    return this.menusExpandidos().has(idMenu);
  }

  protected toggleMenu(idMenu: number): void {
    this.menusExpandidos.update(actual => {
      const nuevo = new Set(actual);
      if (nuevo.has(idMenu)) {
        nuevo.delete(idMenu);
      } else {
        nuevo.add(idMenu);
      }
      return nuevo;
    });
  }

  protected iconoDe(pagina: string): string {
    return ICONOS_POR_PAGINA[pagina] ?? ICONO_DEFECTO;
  }
}