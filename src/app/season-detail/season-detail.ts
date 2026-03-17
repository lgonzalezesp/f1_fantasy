import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Season, SeasonModel } from '../services/season';
import { RaceService, RaceModel } from '../services/race';
import { ResponseService } from '../services/response';
import { Navbar } from '../components/navbar/navbar';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-season-detail',
  standalone: true,
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './season-detail.html',
})
export class SeasonDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private seasonService = inject(Season);
  private raceService = inject(RaceService);
  private responseService = inject(ResponseService);
  private firestore = inject(Firestore);

  seasonId: string = '';
  seasonName: string = '';
  isLoading = true;

  racesWithStatus$: Observable<(RaceModel & { hasResponses: boolean })[]> = of([]);
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  ngOnInit() {
    this.seasonId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.seasonId) {
      this.racesWithStatus$ = this.refreshTrigger$.pipe(
        switchMap(() => this.raceService.getRacesBySeason(this.seasonId)),
        switchMap(races => {
          if (races.length === 0) return of([]);
          
          const statusChecks = races.map(async race => {
            const docRef = doc(this.firestore, `correct_answers/${race.id}`);
            const docSnap = await getDoc(docRef);
            return {
              ...race,
              hasResponses: docSnap.exists()
            };
          });
          
          return Promise.all(statusChecks);
        }),
        tap(() => this.isLoading = false)
      );
      // ... (fetching season name)
    }
  }

  async clearRaceResponses(race: RaceModel) {
    if (confirm(`¿Estás seguro de que deseas VACIAR todas las respuestas y la configuración de la carrera "${race.name}"? Esta acción no se puede deshacer.`)) {
      this.isLoading = true;
      try {
        await this.responseService.deleteResponsesByRace(race.id);
        await this.responseService.deleteCorrectAnswers(race.id);
        this.refreshTrigger$.next();
      } catch (error) {
        console.error('Error clearing race:', error);
        alert('Ocurrió un error al vaciar las respuestas.');
      } finally {
        this.isLoading = false;
      }
    }
  }
}
