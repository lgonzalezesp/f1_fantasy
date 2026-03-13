import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { Season, SeasonModel } from '../services/season';
import { TeamService, TeamModel } from '../services/team';
import { DriverService, DriverModel } from '../services/driver';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { tap, map, switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-driver-admin',
  standalone: true,
  imports: [CommonModule, Navbar, ReactiveFormsModule],
  templateUrl: './driver-admin.html',
  styleUrl: './driver-admin.css',
})
export class DriverAdmin implements OnInit {
  private seasonService = inject(Season);
  private teamService = inject(TeamService);
  private driverService = inject(DriverService);
  private fb = inject(FormBuilder);

  isLoading = true;
  isSubmitting = false;

  teamForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    seasonId: ['', Validators.required]
  });

  driverForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    teamId: ['', Validators.required],
    seasonId: ['', Validators.required]
  });

  // Filter for the list
  filterSeasonControl = this.fb.control('');

  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap((seasons: SeasonModel[]) => {
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason) {
        if (!this.teamForm.get('seasonId')?.value) {
          this.teamForm.patchValue({ seasonId: activeSeason.id });
        }
        if (!this.driverForm.get('seasonId')?.value) {
          this.driverForm.patchValue({ seasonId: activeSeason.id });
        }
        if (!this.filterSeasonControl.value) {
          this.filterSeasonControl.setValue(activeSeason.id!);
        }
      }
    }),
    tap(() => this.isLoading = false)
  );

  // Teams depend on the selected season in the form or overall, plus driver count
  teams$: Observable<any[]> = combineLatest([
    this.filterSeasonControl.valueChanges.pipe(
      startWith(this.filterSeasonControl.value),
      switchMap(seasonId => {
        if (!seasonId) return this.teamService.getTeams();
        return this.teamService.getTeamsBySeason(seasonId as string);
      })
    ),
    this.driverService.getDrivers()
  ]).pipe(
    map(([teams, drivers]) => {
      return teams.map(team => ({
        ...team,
        driverCount: drivers.filter(d => d.teamId === team.id).length
      })).sort((a, b) => a.name.localeCompare(b.name));
    })
  );

  // Specific teams for the driver form (depends on driverForm's seasonId)
  driverFormTeams$: Observable<TeamModel[]> = this.driverForm.get('seasonId')!.valueChanges.pipe(
    startWith(this.driverForm.get('seasonId')?.value || ''),
    switchMap(seasonId => {
      if (!seasonId) return of([]);
      return this.teamService.getTeamsBySeason(seasonId as string);
    })
  );

  allDrivers$: Observable<DriverModel[]> = this.driverService.getDrivers();

  filteredDrivers$: Observable<any[]> = combineLatest([
    this.allDrivers$,
    this.teams$,
    this.filterSeasonControl.valueChanges.pipe(startWith(this.filterSeasonControl.value))
  ]).pipe(
    map(([drivers, teams, filterSeasonId]) => {
      let filtered = drivers;
      if (filterSeasonId) {
        filtered = drivers.filter(d => d.seasonId === filterSeasonId);
      }
      
      // Map team names for display and sort by teamName
      return filtered.map(d => ({
        ...d,
        teamName: teams.find(t => t.id === d.teamId)?.name || 'Sin Equipo'
      })).sort((a, b) => a.teamName.localeCompare(b.teamName));
    })
  );

  ngOnInit(): void {}

  async onTeamSubmit() {
    if (this.teamForm.valid) {
      this.isSubmitting = true;
      try {
        await this.teamService.addTeam(this.teamForm.value);
        this.teamForm.get('name')?.reset();
      } catch (error) {
        console.error('Error adding team:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async onDriverSubmit() {
    if (this.driverForm.valid) {
      this.isSubmitting = true;
      try {
        await this.driverService.addDriver(this.driverForm.value);
        const currentSeasonId = this.driverForm.get('seasonId')?.value;
        const currentTeamId = this.driverForm.get('teamId')?.value;
        this.driverForm.reset({
            seasonId: currentSeasonId,
            teamId: currentTeamId
        });
      } catch (error) {
        console.error('Error adding driver:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async deleteDriver(id: string) {
    if (confirm('¿Estás seguro de eliminar este piloto?')) {
      await this.driverService.deleteDriver(id);
    }
  }

  async deleteTeam(id: string) {
      if (confirm('¿Estás seguro de eliminar esta escudería?')) {
          await this.teamService.deleteTeam(id);
      }
  }
}
