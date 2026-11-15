import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página para rutas que no existen (por ejemplo /safari-secreto). */
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  templateUrl: './no-encontrado.html',
  styleUrl: './no-encontrado.css',
})
export class NoEncontrado {}
