import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, ClientModel } from '../services/client';
import { Season, SeasonModel } from '../services/season';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { tap, map, startWith } from 'rxjs/operators';
import { Navbar } from '../components/navbar/navbar';

@Component({
  selector: 'app-client-admin',
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './client-admin.html',
  styleUrl: './client-admin.css'
})
export class ClientAdmin implements OnInit {
  private clientService = inject(ClientService);
  private seasonService = inject(Season);
  private fb = inject(FormBuilder);

  isLoading = true;
  filterSeasonControl = this.fb.control('');

  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap(seasons => {
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason?.id) {
        // Pre-fill form if empty
        if (this.clientForm && !this.clientForm.get('seasonId')?.value) {
          this.clientForm.patchValue({ seasonId: activeSeason.id });
        }
        // Set default filter if empty
        if (!this.filterSeasonControl.value) {
          this.filterSeasonControl.setValue(activeSeason.id);
        }
      }
    })
  );

  allClients$: Observable<ClientModel[]> = this.clientService.getClients().pipe(
    tap(() => {
      this.isLoading = false;
    })
  );

  filteredClients$: Observable<ClientModel[]> = combineLatest([
    this.allClients$,
    this.filterSeasonControl.valueChanges.pipe(
      // Start with the initial value so it emits immediately
      startWith(this.filterSeasonControl.value)
    )
  ]).pipe(
    map(([clients, filterSeasonId]) => {
      if (!filterSeasonId) return clients;
      return clients.filter(c => c.seasonId === filterSeasonId);
    })
  );

  clientForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      favoriteNumber: ['', [Validators.required, Validators.min(0)]],
      seasonId: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // We don't need onFilterChange since the formControl handles it reactively now.
  }

  async onSubmit() {
    if (this.clientForm.valid) {
      this.isSubmitting = true;
      try {
        await this.clientService.addClient(this.clientForm.value);
        this.clientForm.reset({ name: '', favoriteNumber: '', seasonId: this.clientForm.value.seasonId, isActive: true });
      } catch (error) {
        console.error('Error adding client:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async toggleClientStatus(client: ClientModel) {
    if (client.id) {
      await this.clientService.updateClient(client.id, { isActive: !client.isActive });
    }
  }

  async deleteClient(clientId: string | undefined) {
    if (clientId && confirm('¿Estás seguro de que deseas eliminar este participante?')) {
      await this.clientService.deleteClient(clientId);
    }
  }
}
