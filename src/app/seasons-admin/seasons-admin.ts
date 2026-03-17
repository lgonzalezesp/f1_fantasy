import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Season, SeasonModel } from '../services/season';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Navbar } from '../components/navbar/navbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: "app-seasons-admin",
  imports: [CommonModule, ReactiveFormsModule, Navbar, RouterLink],
  templateUrl: "./seasons-admin.html",
  styleUrl: "./seasons-admin.css",
})
export class SeasonsAdmin implements OnInit {
  private seasonService = inject(Season);
  private fb = inject(FormBuilder);

  isLoading = true;
  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap(() => {
      // Once the first emission arrives, loading is done
      this.isLoading = false;
    })
  );

  seasonForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.seasonForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {}

  async onSubmit() {
    if (this.seasonForm.valid) {
      this.isSubmitting = true;
      try {
        await this.seasonService.addSeason(this.seasonForm.value);
        this.seasonForm.reset({ name: '', isActive: true });
      } catch (error) {
        console.error('Error adding season:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async toggleSeasonStatus(season: SeasonModel) {
    if (season.id) {
      await this.seasonService.updateSeason(season.id, { isActive: !season.isActive });
    }
  }

  async deleteSeason(seasonId: string | undefined) {
    if (seasonId && confirm('¿Estás seguro de que deseas eliminar esta temporada?')) {
      await this.seasonService.deleteSeason(seasonId);
    }
  }
}
