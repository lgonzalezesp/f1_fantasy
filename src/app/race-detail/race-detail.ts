import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RaceService, RaceModel } from '../services/race';
import { ResponseService, RaceResponseModel, CorrectAnswerModel } from '../services/response';
import { Navbar } from '../components/navbar/navbar';
import { Observable, of, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-race-detail',
  standalone: true,
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './race-detail.html',
})
export class RaceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private raceService = inject(RaceService);
  private responseService = inject(ResponseService);
  private firestore = inject(Firestore);

  raceId: string = '';
  race: RaceModel | null = null;
  isLoading = true;
  
  responses$: Observable<RaceResponseModel[]> = of([]);
  correctAnswers: any[] = [];

  ngOnInit() {
    this.raceId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.raceId) {
      // 1. Fetch Race Info
      this.raceService.getRaces().pipe(
        map(races => races.find(r => r.id === this.raceId))
      ).subscribe(race => {
        if (race) this.race = race;
      });

      // 2. Fetch Correct Answers Breakdown
      from(getDoc(doc(this.firestore, `correct_answers/${this.raceId}`))).pipe(
        map(snap => snap.exists() ? snap.data()?.['answers'] || [] : [])
      ).subscribe(answers => {
        this.correctAnswers = answers;
      });

      // 3. Fetch All Participant Responses
      this.responses$ = this.responseService.getResponsesByRace(this.raceId).pipe(
        map(res => res.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))),
        tap(() => this.isLoading = false)
      );
    }
  }

  getCorrectAnswerForQuestion(questionTitle: string): string {
    const q = this.correctAnswers.find(c => c.question === questionTitle);
    return q ? q.answer : '—';
  }
}
