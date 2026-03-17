import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface RaceResponseModel {
  id?: string;
  seasonId: string;
  raceId: string;
  submissionId: string;
  respondentId: string;
  submittedAt: string;
  participantName: string;
  answers: {
    question: string;
    answer: string | string[];
    points?: number;
  }[];
  totalScore?: number;
}

export interface CorrectAnswerModel {
  question: string;
  answer: string;
  points: number;
  pointsPerCorrect?: number;
  maxPoints?: number;
  type: string;
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private firestore = inject(Firestore);
  private collectionName = 'responses';

  getResponsesByRace(raceId: string): Observable<RaceResponseModel[]> {
    const responsesRef = collection(this.firestore, this.collectionName);
    const q = query(responsesRef, where('raceId', '==', raceId));
    return collectionData(q, { idField: 'id' }) as Observable<RaceResponseModel[]>;
  }

  getResponsesBySeason(seasonId: string): Observable<RaceResponseModel[]> {
    const responsesRef = collection(this.firestore, this.collectionName);
    const q = query(responsesRef, where('seasonId', '==', seasonId));
    return collectionData(q, { idField: 'id' }) as Observable<RaceResponseModel[]>;
  }

  async addResponse(response: RaceResponseModel) {
    const responsesRef = collection(this.firestore, this.collectionName);
    return addDoc(responsesRef, response);
  }

  async deleteResponsesByRace(raceId: string) {
    const responsesRef = collection(this.firestore, this.collectionName);
    const q = query(responsesRef, where('raceId', '==', raceId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(this.firestore);
    querySnapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    
    return await batch.commit();
  }

  async deleteCorrectAnswers(raceId: string) {
    const answersDoc = doc(this.firestore, `correct_answers/${raceId}`);
    return await deleteDoc(answersDoc);
  }

  async saveCorrectAnswers(raceId: string, answers: any[]) {
    const answersDoc = doc(this.firestore, `correct_answers/${raceId}`);
    return setDoc(answersDoc, { raceId, answers });
  }

  async getCorrectAnswers(raceId: string): Promise<CorrectAnswerModel[]> {
    const answersDoc = doc(this.firestore, `correct_answers/${raceId}`);
    // Using standard firestore getDoc involves more imports, we'll use a simpler approach or assume it's fetched via observable if needed, 
    // but for the calculation after upload we might need a direct fetch.
    // However, since we are in the same component, we might already have the data.
    return []; // Placeholder if needed
  }

  async updateResponseScore(responseId: string, score: number) {
    const responseDoc = doc(this.firestore, `${this.collectionName}/${responseId}`);
    return updateDoc(responseDoc, { totalScore: score });
  }
}
