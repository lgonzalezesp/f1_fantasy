import { Component } from '@angular/core';
import { Navbar } from '../components/navbar/navbar';

@Component({
  selector: 'app-admin',
  imports: [Navbar],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {}
