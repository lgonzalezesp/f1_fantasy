import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { Season, SeasonModel } from '../services/season';
import { RaceService, RaceModel } from '../services/race';
import { DriverService, DriverModel } from '../services/driver';
import { TeamService, TeamModel } from '../services/team';
import { ResponseService, RaceResponseModel } from '../services/response';
import { Observable, of, combineLatest } from 'rxjs';
import { tap, map, switchMap, startWith, take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export interface QuestionConfig {
  question: string;
  type: 'text' | 'driver' | 'team' | 'boolean';
  mode: 'single' | 'multiple';
  answers: string[];
  points: number;
  pointsPerCorrect?: number;
  maxPoints?: number;
}

@Component({
  selector: 'app-races-response',
  standalone: true,
  imports: [CommonModule, Navbar, ReactiveFormsModule, FormsModule],
  templateUrl: './races-response.html',
  styleUrl: './races-response.css',
})
export class RacesResponse implements OnInit {
  private seasonService = inject(Season);
  private raceService = inject(RaceService);
  private driverService = inject(DriverService);
  private teamService = inject(TeamService);
  private responseService = inject(ResponseService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  isLoading = true;
  isProcessing = false;
  uploadStatus: string = '';
  parsedData: any[] = [];
  extractedQuestions: QuestionConfig[] = [];
  calculatedResults: RaceResponseModel[] = [];
  isConfigOpen: boolean = true;
  currentStep: number = 1; // 1: Config, 2: Results
  
  drivers$: Observable<DriverModel[]> = of([]);
  teams$: Observable<TeamModel[]> = of([]);

  form: FormGroup = this.fb.group({
    seasonId: ['', Validators.required],
    raceId: ['', Validators.required]
  });

  seasons$: Observable<SeasonModel[]> = this.seasonService.getSeasons().pipe(
    tap(seasons => {
      const active = seasons.find(s => s.isActive);
      if (active && !this.form.get('seasonId')?.value) {
        this.form.patchValue({ seasonId: active.id });
      }
    }),
    tap(() => this.isLoading = false)
  );

  races$: Observable<RaceModel[]> = this.form.get('seasonId')!.valueChanges.pipe(
    startWith(this.form.get('seasonId')?.value || ''),
    switchMap(id => {
      if (!id) return of([]);
      
      const driversObs = this.driverService.getDriversBySeason(id);
      const teamsObs = this.teamService.getTeamsBySeason(id);
      
      this.drivers$ = combineLatest([driversObs, teamsObs]).pipe(
        map(([drivers, teams]) => {
          return [...drivers].sort((a, b) => {
            const teamA = teams.find(t => t.id === a.teamId)?.name || '';
            const teamB = teams.find(t => t.id === b.teamId)?.name || '';
            return teamA.localeCompare(teamB);
          });
        })
      );

      this.teams$ = teamsObs;
      return this.raceService.getRacesBySeason(id);
    })
  );

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const sId = params['seasonId'];
      const rId = params['raceId'];
      if (sId) {
        this.form.patchValue({ seasonId: sId });
        if (rId) {
          // Add a small delay for the race checklist to load
          setTimeout(() => {
            this.form.patchValue({ raceId: rId });
          }, 300);
        }
      }
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        this.parseCSV(text);
        this.cdr.detectChanges();
      };
      reader.readAsText(file);
    }
  }

  private parseCSV(text: string) {
    text = text.replace(/^\uFEFF/, ''); // Remove BOM if present

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i+1];
        
        if (char === '"' && inQuotes && nextChar === '"') {
            currentCell += '"';
            i++; // skip next quote
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++; // skip \n
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    
    if (currentCell !== '' || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c !== '')) {
            rows.push(currentRow);
        }
    }

    if (rows.length < 2) return;

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    this.extractedQuestions = headers
      .filter(h => h.includes(')') || h.includes('pto') || h.includes('?'))
      .map(q => {
        const lowerQ = q.toLowerCase();
        let type: QuestionConfig['type'] = 'text';
        if (lowerQ.includes('escuderia') || lowerQ.includes('team')) {
          type = 'team';
        } else if (lowerQ.includes('piloto') || lowerQ.includes('qualy') || lowerQ.includes('gana') || lowerQ.includes('vuelta') || lowerQ.includes('3ro') || lowerQ.includes('2do') || lowerQ.includes('1ro')) {
          type = 'driver';
        } else if (lowerQ.includes('bandera roja') || lowerQ.includes('si/no') || lowerQ.includes('verdadero') || lowerQ.includes('falso') || lowerQ.includes('habra') || lowerQ.includes('habrá')) {
          type = 'boolean';
        }

        const pointsMatch = q.match(/\((\d+(?:[.,]\d+)?)\s*pto/i);
        const points = pointsMatch ? parseFloat(pointsMatch[1].replace(',', '.')) : 0;
        const isMultiple = lowerQ.includes('pilotos') || lowerQ.includes('abandonaron') || lowerQ.includes('eliminados');

        return { 
          question: q, 
          type,
          mode: isMultiple ? 'multiple' : 'single',
          answers: [],
          points: !isMultiple ? points : 0,
          pointsPerCorrect: isMultiple ? points : 0,
          maxPoints: isMultiple ? points * 2 : 0 // Default guess
        };
      });

    this.parsedData = data.filter(d => {
      const hasParticipant = Object.keys(d).some(k => (k.toLowerCase().includes('participante') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('submission')) && d[k]);
      return hasParticipant;
    });

    this.calculatedResults = [];
    this.currentStep = 1;
    this.isConfigOpen = true;

    console.log('Headers detectados:', headers);
    console.log('Datos procesados:', this.parsedData.length);
    
    if (this.extractedQuestions.length === 0) {
      this.uploadStatus = 'Error: No se detectaron preguntas válidas en las cabeceras del CSV.';
    } else if (this.parsedData.length === 0) {
      this.uploadStatus = 'Error: El CSV se leyó pero no se encontraron filas de respuestas válidas.';
    } else {
      this.uploadStatus = `Archivo cargado: ${this.parsedData.length} respuestas encontradas y ${this.extractedQuestions.length} preguntas detectadas.`;
    }
    this.cdr.detectChanges();
  }

  toggleAnswer(q: QuestionConfig, value: string) {
    if (q.mode === 'single') {
        q.answers = [value];
    } else {
        const idx = q.answers.indexOf(value);
        if (idx > -1) {
            q.answers.splice(idx, 1);
        } else {
            q.answers.push(value);
        }
    }
  }

  parseAnswers(q: QuestionConfig, value: string) {
    q.answers = value.split(',').map(x => x.trim()).filter(x => !!x);
  }

  changeType(q: QuestionConfig, type: QuestionConfig['type']) {
    q.type = type;
    q.answers = []; // Reset answers when type changes
  }

  changeMode(q: QuestionConfig, mode: QuestionConfig['mode']) {
    q.mode = mode;
    if (mode === 'single' && q.answers.length > 1) {
      q.answers = [q.answers[0]];
    }
  }

  toggleConfig() {
    this.isConfigOpen = !this.isConfigOpen;
  }

  get isConfigValid(): boolean {
    if (this.extractedQuestions.length === 0) return false;
    return this.extractedQuestions.every(q => {
      const hasAnswer = q.answers.length > 0;
      const hasPoints = q.mode === 'single' ? (q.points || 0) > 0 : (q.pointsPerCorrect || 0) > 0;
      return hasAnswer && hasPoints;
    });
  }

  private calculateScore(userAnswers: {question: string, answer: string | string[], points?: number}[], correctConfigs: QuestionConfig[]): number {
    let total = 0;

    userAnswers.forEach(ua => {
      const config = correctConfigs.find(c => c.question === ua.question);
      if (!config) return;

      const userRawAnswer = String(ua.answer || '');
      const userSelected = userRawAnswer.split(',').map(s => s.trim().toLowerCase()).filter(s => !!s);
      const correctOnes = config.answers.map(s => s.trim().toLowerCase());

      let questionPoints = 0;
      if (config.mode === 'single') {
        if (correctOnes.includes(userRawAnswer.trim().toLowerCase())) {
          questionPoints = (config.points || 0);
        }
      } else {
        let matches = 0;
        userSelected.forEach(selection => {
          if (correctOnes.includes(selection)) {
            matches++;
          }
        });
        
        const calculated = matches * (config.pointsPerCorrect || 0);
        questionPoints = Math.min(calculated, config.maxPoints || Infinity);
      }
      
      ua.points = questionPoints;
      total += questionPoints;
    });

    return total;
  }

  async uploadResponses() {
    console.log('Iniciando carga...');
    const raceId = this.form.get('raceId')?.value;

    if (this.form.invalid || !raceId) {
      this.uploadStatus = 'Error: Selección de Temporada y Carrera obligatorias.';
      return;
    }

    // Validación: solo una carga por carrera
    try {
      const docRef = doc(this.firestore, `correct_answers/${raceId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.uploadStatus = 'Error: Esta carrera ya tiene resultados cargados. Debes vaciar los resultados anteriores desde el Calendario antes de cargar nuevos.';
        this.cdr.detectChanges();
        return;
      }
    } catch (err) {
      console.error('Error validando existencia:', err);
    }

    if (this.parsedData.length === 0) {
      this.uploadStatus = 'Error: No hay datos cargados para subir.';
      return;
    }
    
    if (!this.isConfigValid) {
        this.uploadStatus = 'Error: Todas las preguntas deben tener respuesta y puntos asignados.';
        this.extractedQuestions.forEach((q, i) => {
            const hasAnswer = q.answers.length > 0;
            const hasPoints = q.mode === 'single' ? q.points > 0 : (q.pointsPerCorrect || 0) > 0;
            if (!hasAnswer || !hasPoints) {
                console.warn(`Error en Q${i+1}: ${q.question} - Resp: ${hasAnswer}, Puntos: ${hasPoints}`);
            }
        });
        this.cdr.detectChanges();
        return;
    }

    this.isProcessing = true;
    this.uploadStatus = 'Procesando y calculando puntos...';
    this.calculatedResults = [];
    this.cdr.detectChanges();

    const seasonId = this.form.get('seasonId')?.value;
    console.log('ID Carrera:', raceId);

    try {
      console.log('Iniciando subida de participantes...', this.parsedData.length);
      let count = 0;
      
      const dbAnswers = this.extractedQuestions.map(q => ({
          question: q.question,
          answer: q.answers.join(', '),
          points: q.points || 0,
          pointsPerCorrect: q.pointsPerCorrect || 0,
          maxPoints: q.maxPoints || 0,
          type: q.type,
          mode: q.mode
      }));
      await this.responseService.saveCorrectAnswers(raceId, dbAnswers);
      console.log('Respuestas correctas guardadas.');

      const participantKey = Object.keys(this.parsedData[0] || {}).find(k => k.toLowerCase().includes('participante') || k.toLowerCase().includes('nombre')) || 'Seleccionar Participante';

      for (const row of this.parsedData) {
        const response: RaceResponseModel = {
          seasonId,
          raceId,
          submissionId: row['Submission ID'] || row['ID'] || '',
          respondentId: row['Respondent ID'] || '',
          submittedAt: row['Submitted at'] || '',
          participantName: row[participantKey] || '',
          answers: []
        };

        // Align answers with extractedQuestions order
        this.extractedQuestions.forEach(q => {
          response.answers.push({
            question: q.question,
            answer: row[q.question] || ''
          });
        });

        // Calculate score
        response.totalScore = this.calculateScore(response.answers, this.extractedQuestions);

        await this.responseService.addResponse(response);
        this.calculatedResults.push(response);
        count++;
        console.log(`Participante ${count}/${this.parsedData.length} guardado con score: ${response.totalScore}`);
      }

      this.uploadStatus = '¡Configuración, resultados y PUNTOS calculados con éxito!';
      this.isConfigOpen = true; 
      this.currentStep = 2; // Pass to results step
      // We keep parsedData and extractedQuestions for reference if needed, 
      // or at least we have calculatedResults now.
    } catch (error) {
      console.error('Error FATAL en la subida:', error);
      this.uploadStatus = 'Error al subir las respuestas. Revisa la consola.';
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }
}
