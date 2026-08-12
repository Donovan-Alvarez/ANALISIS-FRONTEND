import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuService } from '../../../core/services/menu.service';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly menuService = inject(MenuService);

  ngOnInit(): void {
    this.menuService.cargarMenu().subscribe();
  }
}