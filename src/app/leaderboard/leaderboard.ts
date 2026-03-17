import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Season, SeasonModel } from '../services/season';
import { RaceService, RaceModel } from '../services/race';
import { ResponseService, RaceResponseModel } from '../services/response';
import { Navbar } from '../components/navbar/navbar';
import { Observable, of, combineLatest, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, Navbar, FormsModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard implements OnInit {
  private seasonService = inject(Season);
  private raceService = inject(RaceService);
  private responseService = inject(ResponseService);
  private firestore = inject(Firestore);

  isLoading = true;
  isLoadingRaces = false;
  isLoadingResults = false;
  selectedSeasonId = new BehaviorSubject<string>('');
  
  // Selection State
  selectedParticipantId = '';
  public raceIdSubject = new BehaviorSubject<string>('');
  correctAnswersMap: { [key: string]: any[] } = {};

  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap(seasons => {
      const active = seasons.find(s => s.isActive);
      if (active && !this.selectedSeasonId.value) {
        this.selectedSeasonId.next(active.id || '');
      }
    })
  );

  // Races for the selected season - FILTERED: only show races with information
  races$: Observable<RaceModel[]> = this.selectedSeasonId.pipe(
    tap(() => this.isLoadingRaces = true),
    switchMap(id => id ? this.raceService.getRacesBySeason(id) : of([])),
    switchMap(async races => {
      const filtered = [];
      for(const race of races) {
        const docRef = doc(this.firestore, `correct_answers/${race.id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          filtered.push(race);
        }
      }
      this.isLoadingRaces = false;
      return filtered;
    })
  );

  // General Leaderboard (Aggregated)
  generalRanking$: Observable<any[]> = this.selectedSeasonId.pipe(
    switchMap(id => id ? this.responseService.getResponsesBySeason(id) : of([])),
    map(responses => {
      const grouped: { [key: string]: any } = {};
      
      responses.forEach(r => {
        if (!grouped[r.participantName]) {
          grouped[r.participantName] = {
            name: r.participantName,
            totalScore: 0,
            racesCount: 0
          };
        }
        grouped[r.participantName].totalScore += (r.totalScore || 0);
        grouped[r.participantName].racesCount += 1;
      });

      return Object.values(grouped).sort((a, b) => b.totalScore - a.totalScore);
    })
  );

  // Raw Race Results
  raceResultsReactivity$ = combineLatest([
    this.selectedSeasonId,
    this.raceIdSubject
  ]).pipe(
    tap(() => { if (this.raceIdSubject.value) this.isLoadingResults = true; }),
    switchMap(([seasonId, raceId]) => {
      if (!raceId) return of([]);
      this.loadCorrectAnswers(raceId);
      return this.responseService.getResponsesByRace(raceId).pipe(
        map(res => res.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))),
        tap(() => this.isLoadingResults = false)
      );
    })
  );

  // Pivoted Data: One row per question
  pivotedResults$: Observable<any[]> = this.raceResultsReactivity$.pipe(
    map(responses => {
      if (!responses || responses.length === 0) return [];
      
      const questionsMap: { [key: string]: any } = {};
      const raceId = this.raceIdSubject.value;

      responses.forEach(r => {
        r.answers.forEach(ans => {
          if (!questionsMap[ans.question]) {
            questionsMap[ans.question] = {
              question: ans.question,
              correctAnswer: this.getCorrectAnswer(raceId, ans.question),
              participants: []
            };
          }
          questionsMap[ans.question].participants.push({
            name: r.participantName,
            answer: ans.answer,
            points: ans.points
          });
        });
      });

      return Object.values(questionsMap);
    })
  );

  ngOnInit(): void {
    this.generalRanking$.subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  onSeasonChange(id: string) {
    this.selectedSeasonId.next(id);
    this.raceIdSubject.next('');
    this.selectedParticipantId = '';
  }

  async loadCorrectAnswers(raceId: string) {
    const docRef = doc(this.firestore, `correct_answers/${raceId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.correctAnswersMap[raceId] = docSnap.data()['answers'] || [];
    }
  }

  getCorrectAnswer(raceId: string, question: string) {
    const answers = this.correctAnswersMap[raceId] || [];
    return answers.find(a => a.question === question);
  }

  setRace(id: string) {
    this.raceIdSubject.next(id);
    this.selectedParticipantId = '';
  }

  toggleParticipant(id: string) {
    this.selectedParticipantId = this.selectedParticipantId === id ? '' : id;
  }
}
