import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { Season, SeasonModel } from '../services/season';
import { RaceService, RaceModel } from '../services/race';
import { Observable, combineLatest } from 'rxjs';
import { tap, map, switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-races-admin',
  standalone: true,
  imports: [CommonModule, Navbar, ReactiveFormsModule],
  templateUrl: './races-admin.html',
  styleUrl: './races-admin.css',
})
export class RacesAdmin implements OnInit {
  private seasonService = inject(Season);
  private raceService = inject(RaceService);
  private fb = inject(FormBuilder);

  isLoading = true;
  isSubmitting = false;

  raceForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    circuit: ['', Validators.required],
    date: ['', Validators.required],
    round: [1, [Validators.required, Validators.min(1)]],
    seasonId: ['', Validators.required]
  });

  filterSeasonControl = this.fb.control('');

  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap((seasons: SeasonModel[]) => {
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason) {
        if (!this.raceForm.get('seasonId')?.value) {
          this.raceForm.patchValue({ seasonId: activeSeason.id });
        }
        if (!this.filterSeasonControl.value) {
          this.filterSeasonControl.setValue(activeSeason.id!);
        }
      }
    }),
    tap(() => this.isLoading = false)
  );

  races$: Observable<RaceModel[]> = this.filterSeasonControl.valueChanges.pipe(
    startWith(this.filterSeasonControl.value),
    switchMap(seasonId => {
      if (!seasonId) return this.raceService.getRaces();
      return this.raceService.getRacesBySeason(seasonId as string);
    })
  );

  async seedRaces2026() {
    const seasonId = this.filterSeasonControl.value;
    if (!seasonId) {
      alert('Por favor selecciona la temporada 2026 primero.');
      return;
    }

    if (!confirm('¿Quieres cargar las 24 carreras oficiales de la F1 2026 en esta temporada?')) return;

    this.isSubmitting = true;
    const races = [
        { round: 1, name: 'Australian Grand Prix', circuit: 'Melbourne', date: '2026-03-08' },
        { round: 2, name: 'Chinese Grand Prix', circuit: 'Shanghai', date: '2026-03-15' },
        { round: 3, name: 'Japanese Grand Prix', circuit: 'Suzuka', date: '2026-03-29' },
        { round: 4, name: 'Bahrain Grand Prix', circuit: 'Sakhir', date: '2026-04-12' },
        { round: 5, name: 'Saudi Arabian Grand Prix', circuit: 'Jeddah', date: '2026-04-19' },
        { round: 6, name: 'Miami Grand Prix', circuit: 'Miami', date: '2026-05-03' },
        { round: 7, name: 'Canadian Grand Prix', circuit: 'Montreal', date: '2026-05-24' },
        { round: 8, name: 'Monaco Grand Prix', circuit: 'Monaco', date: '2026-06-07' },
        { round: 9, name: 'Spanish Grand Prix', circuit: 'Barcelona-Catalunya', date: '2026-06-14' },
        { round: 10, name: 'Austrian Grand Prix', circuit: 'Spielberg', date: '2026-06-28' },
        { round: 11, name: 'British Grand Prix', circuit: 'Silverstone', date: '2026-07-05' },
        { round: 12, name: 'Belgian Grand Prix', circuit: 'Spa-Francorchamps', date: '2026-07-19' },
        { round: 13, name: 'Hungarian Grand Prix', circuit: 'Budapest', date: '2026-07-26' },
        { round: 14, name: 'Dutch Grand Prix', circuit: 'Zandvoort', date: '2026-08-23' },
        { round: 15, name: 'Italian Grand Prix', circuit: 'Monza', date: '2026-09-06' },
        { round: 16, name: 'Spanish Grand Prix (Madrid)', circuit: 'Madrid', date: '2026-09-13' },
        { round: 17, name: 'Azerbaijan Grand Prix', circuit: 'Baku', date: '2026-09-26' },
        { round: 18, name: 'Singapore Grand Prix', circuit: 'Singapore', date: '2026-10-11' },
        { round: 19, name: 'United States Grand Prix', circuit: 'Austin', date: '2026-10-25' },
        { round: 20, name: 'Mexico City Grand Prix', circuit: 'Mexico City', date: '2026-11-01' },
        { round: 21, name: 'São Paulo Grand Prix', circuit: 'Interlagos', date: '2026-11-08' },
        { round: 22, name: 'Las Vegas Grand Prix', circuit: 'Las Vegas', date: '2026-11-21' },
        { round: 23, name: 'Qatar Grand Prix', circuit: 'Lusail', date: '2026-11-29' },
        { round: 24, name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina', date: '2026-12-06' }
    ];

    try {
      for (const race of races) {
        await this.raceService.addRace({ ...race, seasonId: seasonId as string });
      }
      alert('¡Calendario 2026 cargado exitosamente!');
    } catch (error) {
      console.error('Error seeding races:', error);
      alert('Error al cargar el calendario.');
    } finally {
      this.isSubmitting = false;
    }
  }

  ngOnInit(): void {}

  async onRaceSubmit() {
    if (this.raceForm.valid) {
      this.isSubmitting = true;
      try {
        await this.raceService.addRace(this.raceForm.value);
        const currentSeasonId = this.raceForm.get('seasonId')?.value;
        const nextRound = (this.raceForm.get('round')?.value || 0) + 1;
        this.raceForm.reset({
          seasonId: currentSeasonId,
          round: nextRound
        });
      } catch (error) {
        console.error('Error adding race:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async deleteRace(id: string) {
    if (confirm('¿Estás seguro de eliminar este Gran Premio?')) {
      await this.raceService.deleteRace(id);
    }
  }
}
